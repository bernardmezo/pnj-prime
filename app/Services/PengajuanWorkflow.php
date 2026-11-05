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
            'Menunggu Pembayaran',
            'Menunggu Persetujuan Pimpinan',
            'Ditolak',
            'Dibatalkan',
        ],
        'Menunggu Persetujuan Pimpinan' => [
            'Menunggu Pembayaran',
            'Ditolak',
            'Dibatalkan',
        ],
        'Menunggu Pembayaran' => [
            'Menunggu Verifikasi Pembayaran',
            'Dibatalkan',
        ],
        'Menunggu Verifikasi Pembayaran' => [
            'Diproses',
            'Menunggu Pembayaran',
            'Ditolak',
            'Dibatalkan',
        ],
        'Diproses' => [
            'Selesai',
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
    public function transition(Pengajuan $pengajuan, string $targetStatus, ?string $note = null, ?string $actorName = null): Pengajuan
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

        DB::transaction(function () use ($pengajuan, $targetStatus, $note, $actorName) {
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
                $this->createOrderSnapshot($pengajuan);
            }

            // If cancelled or rejected, release room bookings
            if (in_array($targetStatus, ['Ditolak', 'Dibatalkan'], true)) {
                $this->roomBookingService->releaseForPengajuan($pengajuan->id);
            }
        });

        return $pengajuan->fresh(['order.items', 'product']);
    }

    /**
     * Create immutable order and order_items snapshot for billing.
     */
    protected function createOrderSnapshot(Pengajuan $pengajuan): Order
    {
        $product = $pengajuan->product;
        $subtotal = (int) ($pengajuan->total ?: ($product ? $product->final_price ?? $product->base_price : 0));

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
            'total' => $taxCalc['total'],
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
                'unit_price' => $product->final_price ?? $product->base_price,
                'quantity' => $pengajuan->jumlah ?: 1,
                'subtotal' => $subtotal,
            ]);
        }

        return $order;
    }
}
