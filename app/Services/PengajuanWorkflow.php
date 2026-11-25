<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pengajuan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PengajuanWorkflow
{
    public const ALLOWED_TRANSITIONS = [
        'Diajukan' => [
            'Menunggu Invoice',
            'Menunggu Pembayaran',
            'Menunggu Persetujuan Pimpinan',
            'Ditolak',
            'Dibatalkan',
        ],
        'Menunggu Persetujuan Pimpinan' => [
            'Menunggu Invoice',
            'Menunggu Pembayaran',
            'Ditolak',
            'Dibatalkan',
        ],
        'Menunggu Invoice' => [
            'Menunggu Pembayaran',
            'Ditolak',
            'Dibatalkan',
        ],
        'Menunggu Pembayaran' => [
            'Menunggu Verifikasi Pembayaran',
            'Lunas',
            'Dibatalkan',
        ],
        'Menunggu Verifikasi Pembayaran' => [
            'Lunas',
            'Diproses',
            'Menunggu Pembayaran',
            'Ditolak',
            'Dibatalkan',
        ],
        'Lunas' => [
            'Dikerjakan',
            'Diproses',
            'Terjadwal',
            'Berjalan',
            'Dibatalkan',
        ],
        'Terjadwal' => [
            'Berjalan',
            'Dipinjam',
            'Dibatalkan',
        ],
        'Berjalan' => [
            'Selesai',
            'Dibatalkan',
        ],
        'Dipinjam' => [
            'Dikembalikan',
            'Dibatalkan',
        ],
        'Dikembalikan' => [
            'Selesai',
            'Dibatalkan',
        ],
        'Diproses' => [
            'Dikerjakan',
            'Dikirim',
            'Dijadwalkan',
            'Selesai',
            'Dibatalkan',
        ],
        'Dikirim' => [
            'Selesai',
            'Dibatalkan',
        ],
        'Dijadwalkan' => [
            'Dikerjakan',
            'Dibatalkan',
        ],
        'Dikerjakan' => [
            'Hasil Diunggah',
            'Dibatalkan',
        ],
        'Hasil Diunggah' => [
            'Selesai',
            'Dikerjakan',
            'Dibatalkan',
        ],
        'Selesai' => [],
        'Ditolak' => [],
        'Dibatalkan' => [],
    ];

    public function __construct(
        protected TaxService $taxService = new TaxService,
        protected RoomBookingService $roomBookingService = new RoomBookingService,
    ) {}

    /**
     * Transition a Pengajuan to a new status.
     * Enforces business rules, records history, and handles billing creation upon approval.
     *
     * @throws ValidationException
     */
    public function transition(Pengajuan $pengajuan, string $targetStatus, ?string $note = null, ?string $actorName = null, ?array $shipping = null): Pengajuan
    {
        $current = $pengajuan->status;
        $allowed = self::ALLOWED_TRANSITIONS[$current] ?? [];

        if (! in_array($targetStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => "Transisi status dari '{$current}' ke '{$targetStatus}' tidak diizinkan.",
            ]);
        }

        // BR-03: Rejection requires note
        if ($targetStatus === 'Ditolak' && empty(trim((string) $note))) {
            throw ValidationException::withMessages([
                'catatan' => 'Penolakan wajib menyertakan alasan penolakan.',
            ]);
        }

        DB::transaction(function () use ($pengajuan, $targetStatus, $note, $actorName, $shipping) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            if (! in_array($targetStatus, self::ALLOWED_TRANSITIONS[$locked->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Status pengajuan telah berubah. Muat ulang halaman.']);
            }
            $pengajuan->setRawAttributes($locked->getAttributes(), true);
            $pengajuan->unsetRelations();
            $user = Auth::user();
            $actor = $actorName ?? ($user ? $user->name : 'Sistem');

            $pengajuan->pushHistory($targetStatus, $note, $actor);
            $pengajuan->status = $targetStatus;
            if ($note) {
                $pengajuan->catatan_peninjau = $note;
            }
            $pengajuan->save();

            // When moving to 'Menunggu Pembayaran', generate the Order + OrderItem + Tax snapshot if not already created
            if ($targetStatus === 'Menunggu Pembayaran' && ! $pengajuan->order) {
                $order = $this->createOrderSnapshot($pengajuan, $shipping);
                if ($pengajuan->isShipment() && ! $pengajuan->isPreorder()) {
                    $pengajuan->total = $order->total;
                    $pengajuan->save();
                }
            }

            if ($pengajuan->order) {
                $orderStatusMap = [
                    'Lunas' => 'lunas',
                    'Dikerjakan' => 'diproses',
                    'Diproses' => 'diproses',
                    'Berjalan' => 'diproses',
                    'Selesai' => 'selesai',
                    'Dibatalkan' => 'dibatalkan',
                    'Menunggu Pembayaran' => 'menunggu_pembayaran',
                ];

                if (isset($orderStatusMap[$targetStatus])) {
                    $orderData = ['status' => $orderStatusMap[$targetStatus]];
                    if ($targetStatus === 'Selesai') {
                        $orderData['completed_at'] = now();
                    }
                    $pengajuan->order->update($orderData);
                }
            }

            // If cancelled or rejected, release room bookings
            if (in_array($targetStatus, ['Ditolak', 'Dibatalkan'], true)) {
                $this->roomBookingService->releaseForPengajuan($pengajuan->id);
            }

            // Sewa (ruangan/alat): kunci jadwal saat pengajuan masuk agar slot
            // tidak bisa diambil pengajuan lain. Hanya bila belum ada reservation.
            if ($targetStatus === 'Diajukan' && $pengajuan->isRental() && $pengajuan->product_id) {
                $this->roomBookingService->reserve(
                    $pengajuan->product_id,
                    $pengajuan->id,
                    $pengajuan->rental_start,
                    $pengajuan->rental_end,
                );
            }
        });

        // Jalur B (ready stock, Midtrans): buat kwitansi otomatis saat pesanan selesai.
        // Dijalankan setelah transaksi di atas commit, supaya notifikasi afterCommit() terkirim.
        if ($targetStatus === 'Selesai' && ! $pengajuan->isPreorder() && $pengajuan->tipe === 'produk') {
            $invoiceService = app(InvoiceService::class);
            $invoiceService->issueReceiptForReadyStock($pengajuan);
            $invoiceService->notifyReadyStockReceipt($pengajuan);
        }

        // Saat Admin RTPU memverifikasi pesanan (status → Menunggu Pembayaran),
        // kirim email ke Customer agar tahu harus membayar. Preorder punya
        // notifikasi invoice sendiri (PreorderInvoiceIssued) sehingga di-skip.
        if ($targetStatus === 'Menunggu Pembayaran' && ! $pengajuan->isPreorder()) {
            $pengajuan->buyer?->notify(new \App\Notifications\PesananDiverifikasi($pengajuan));
        }

        return $pengajuan->fresh(['order.items', 'product']);
    }

    /**
     * Create immutable order and order_items snapshot for billing.
     */
    protected function createOrderSnapshot(Pengajuan $pengajuan, ?array $shipping = null): Order
    {
        $product = $pengajuan->product;
        $subtotal = (int) ($pengajuan->total ?: ($product ? $product->final_price ?? $product->base_price : 0));
        $isShipment = $pengajuan->isShipment() && ! $pengajuan->isPreorder();
        $storeShippingSnapshot = ! $pengajuan->isPreorder() && $pengajuan->tipe === 'produk';
        $shippingAmount = 0;

        if ($isShipment) {
            if (! $product) {
                throw ValidationException::withMessages(['shipping_service' => 'Produk tidak tersedia untuk menghitung subtotal.']);
            }
            $subtotal = (int) ($product->final_price ?? $product->base_price ?? 0) * PricingService::parseQty($pengajuan->jumlah)
                + (int) $pengajuan->opsi()->sum('subtotal');
            if ($shipping === null) {
                throw ValidationException::withMessages(['shipping_service' => 'Admin RTPU harus memilih layanan JNE tarif live sebelum menyetujui pengiriman.']);
            }
            if (($shipping['courier'] ?? null) !== 'jne' || ! is_string($shipping['service'] ?? null)) {
                throw ValidationException::withMessages(['shipping_service' => 'Pilih layanan JNE tarif live yang tersedia.']);
            }
            $rate = collect(app(ShippingService::class)->preorderRates($pengajuan, 'jne'))->firstWhere('service', $shipping['service']);
            if (! $rate) {
                throw ValidationException::withMessages(['shipping_service' => 'Layanan JNE tidak tersedia. Perbarui tarif dan pilih kembali.']);
            }
            $shipping = ['courier' => 'jne', 'service' => $rate['service'], 'amount' => $rate['amount'], 'etd' => $rate['etd']];
            $shippingAmount = $rate['amount'];
        } elseif ($shipping !== null) {
            throw ValidationException::withMessages(['shipping_service' => 'Ongkir hanya dapat ditetapkan untuk produk yang dikirim.']);
        }

        $taxCalc = $this->taxService->calculate($subtotal, $product?->taxRate, $pengajuan->tipe);

        $orderType = ($pengajuan->tipe === 'ruangan' || $pengajuan->tipe === 'alat') ? 'b2b' : 'b2c';

        $order = Order::create([
            'order_number' => 'ORD-'.date('Ymd').'-'.str_pad((string) $pengajuan->id, 5, '0', STR_PAD_LEFT),
            'buyer_id' => $pengajuan->buyer_id,
            'pengajuan_id' => $pengajuan->id,
            'subtotal' => $taxCalc['subtotal'],
            'tax_rate_id' => $taxCalc['tax_rate_id'],
            'tax_rate_snapshot' => $taxCalc['tax_rate_snapshot'],
            'tax_name_snapshot' => $taxCalc['tax_name_snapshot'],
            'tax_amount' => $taxCalc['tax_amount'],
            ...($storeShippingSnapshot ? ['shipping_amount' => $shippingAmount, 'shipping_snapshot' => $shipping] : []),
            'total' => $taxCalc['total'] + $shippingAmount,
            'status' => 'menunggu_pembayaran',
            'order_type' => $orderType,
            'buyer_notes' => $pengajuan->catatan,
            'admin_notes' => $pengajuan->catatan_peninjau,
        ]);

        if ($product) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'unit_price' => $this->unitPriceForSnapshot($pengajuan, $subtotal, $product),
                'quantity' => $pengajuan->jumlah ?: 1,
                'subtotal' => $isShipment ? (int) ($product->final_price ?? $product->base_price ?? 0) * PricingService::parseQty($pengajuan->jumlah) : $subtotal,
            ]);
        }

        return $order;
    }

    /**
     * Harga satuan snapshot. Jasa/sewa: bila RTPU menetapkan tarif (total pengajuan),
     * satuan = total / jumlah agar subtotal item sama dengan total order.
     */
    private function unitPriceForSnapshot(Pengajuan $pengajuan, int $subtotal, $product): int
    {
        if (in_array($pengajuan->tipe, ['jasa', 'ruangan', 'alat'], true) && $pengajuan->total) {
            $qty = max(1, PricingService::parseQty($pengajuan->jumlah));

            return intdiv($subtotal, $qty);
        }

        return (int) ($product->final_price ?? $product->base_price);
    }
}
