<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\User;
use App\Notifications\PreorderInvoiceIssued;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        protected PengajuanWorkflow $workflow = new PengajuanWorkflow,
        protected TaxService $taxService = new TaxService,
    ) {}

    public function preparePreorder(Pengajuan $pengajuan, User $issuer, array $data): Invoice
    {
        abort_unless(in_array($issuer->role, ['admin_rtpu', 'super_admin'], true), 403);

        return DB::transaction(function () use ($pengajuan, $issuer, $data) {
            // Serialize allocation across requests with overlapping totals until commit.
            if (DB::getDriverName() === 'pgsql') {
                DB::select('SELECT pg_advisory_xact_lock(71420311)');
            } elseif (DB::getDriverName() === 'sqlite') {
                // SQLite ignores FOR UPDATE. A write statement (even with no matching
                // rows) acquires its database-wide writer reservation BEFORE any reads.
                // Keep Laravel's transaction/savepoint bookkeeping intact rather than
                // issuing a raw BEGIN IMMEDIATE. The partial unique indexes remain
                // the final backstop for active totals and requests.
                DB::update('UPDATE invoices SET id = id WHERE 1 = 0');
            }
            $pengajuan = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            abort_unless($pengajuan->isPreorder() && $pengajuan->status === 'Diajukan', 422);
            if ($pengajuan->invoices()->whereIn('status', ['draft', 'issued', 'paid'])->exists()) {
                throw ValidationException::withMessages(['invoice' => 'Invoice sudah disiapkan. Batalkan draf sebelum menyusun ulang.']);
            }
            $bank = MetodePembayaran::whereKey($data['bank_id'])->lockForUpdate()->firstOrFail();
            if (! $bank->aktif || strtoupper(trim($bank->tipe)) !== 'BLU' || ! trim($bank->rekening) || ! trim($bank->holder)) {
                throw ValidationException::withMessages(['bank_id' => 'Pilih rekening resmi aktif dengan tipe BLU melalui menu Metode Pembayaran.']);
            }
            $quantity = (int) ($pengajuan->jumlah ?: 1);
            $shipping = 0;
            if (in_array($pengajuan->metode_pengambilan, ['kurir', 'Diantar'], true)) {
                $rates = app(ShippingService::class)->preorderRates($pengajuan, $data['shipping_courier'] ?? '');
                $rate = collect($rates)->firstWhere('service', $data['shipping_service'] ?? '');
                if (! $rate) {
                    throw ValidationException::withMessages(['shipping_service' => 'Pilih layanan tarif live yang tersedia.']);
                }
                $shipping = $rate['amount'];
            }
            $amounts = null;
            for ($unique = 1; $unique <= 999; $unique++) {
                $candidate = PreorderInvoiceMoney::calculate((int) $data['unit_price'], $quantity, (string) $data['tax_rate'], $shipping, $unique);
                if (! Invoice::whereNotNull('bank_snapshot')->whereIn('status', ['draft', 'issued'])->where('total', $candidate['total'])->exists()) {
                    $amounts = $candidate;
                    break;
                }
            }
            if (! $amounts) {
                throw ValidationException::withMessages(['invoice' => 'Nominal unik belum tersedia. Coba kembali setelah invoice aktif diselesaikan.']);
            }
            $invoice = Invoice::create(array_merge($amounts, [
                'invoice_number' => $this->generateInvoiceNumber($pengajuan),
                'pengajuan_id' => $pengajuan->id, 'issued_by' => $issuer->id,
                'request_snapshot' => $this->preorderRequestSnapshot($pengajuan),
                'issued_at' => now(), 'due_at' => Carbon::parse($data['due_date'])->endOfDay(),
                'tax_rate_snapshot' => $data['tax_rate'], 'status' => 'draft', 'notes' => $data['notes'] ?? null,
                'bank_snapshot' => ['id' => $bank->id, 'name' => $bank->nama, 'account' => $bank->rekening, 'holder' => $bank->holder, 'instructions' => $bank->instruksi],
            ]));
            $invoice->lines()->create(['item_type' => 'product', 'item_id' => $pengajuan->product_id,
                'description' => $pengajuan->product->name, 'quantity' => $quantity,
                'unit_price' => (int) $data['unit_price'], 'amount' => $amounts['subtotal']]);
            $pengajuan->pushHistory('Diajukan', 'Draf invoice BLU disiapkan: '.$invoice->invoice_number, $issuer->name);
            $pengajuan->save();

            return $invoice;
        }, attempts: 5);
    }

    public function approvePreorder(Pengajuan $pengajuan, User $issuer): void
    {
        abort_unless(in_array($issuer->role, ['admin_rtpu', 'super_admin'], true), 403);
        DB::transaction(function () use ($pengajuan, $issuer) {
            $pengajuan = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            abort_unless($pengajuan->status === 'Diajukan' && $pengajuan->isPreorder(), 422);
            $invoice = $pengajuan->invoices()->where('status', 'draft')->lockForUpdate()->first();
            if (! $invoice || ! $invoice->bank_snapshot || $invoice->due_at->isPast()) {
                throw ValidationException::withMessages(['invoice' => 'Siapkan invoice BLU dengan jatuh tempo yang berlaku sebelum menyetujui pre-order.']);
            }
            if ($invoice->request_snapshot != $this->preorderRequestSnapshot($pengajuan)) {
                throw ValidationException::withMessages(['invoice' => 'Data pengajuan berubah. Batalkan draf dan siapkan invoice baru.']);
            }
            $this->workflow->transition($pengajuan, 'Menunggu Pembayaran', 'Invoice BLU diterbitkan: '.$invoice->invoice_number, $issuer->name);
            $pengajuan->refresh();
            $order = $pengajuan->order;
            $order->update(['subtotal' => $invoice->subtotal, 'tax_rate_id' => null,
                'tax_rate_snapshot' => $invoice->tax_rate_snapshot, 'tax_name_snapshot' => 'Pajak barang',
                'tax_amount' => $invoice->tax_amount, 'total' => $invoice->total]);
            $line = $invoice->lines()->firstOrFail();
            $order->items()->update(['unit_price' => $line->unit_price, 'quantity' => $line->quantity, 'subtotal' => $line->amount]);
            $pengajuan->update(['total' => $invoice->total]);
            $invoice->update(['order_id' => $order->id, 'status' => 'issued', 'issued_at' => now()]);
            $pengajuan->buyer->notify(new PreorderInvoiceIssued($invoice));
        });
    }

    private function preorderRequestSnapshot(Pengajuan $pengajuan): array
    {
        return [
            'product_id' => (int) $pengajuan->product_id,
            'buyer_id' => (int) $pengajuan->buyer_id,
            'quantity' => (int) ($pengajuan->jumlah ?: 1),
            'fulfillment' => $pengajuan->metode_pengambilan,
            'notes' => $pengajuan->catatan,
            'need' => $pengajuan->keperluan,
        ];
    }

    public function generateInvoiceNumber(Pengajuan $pengajuan): string
    {
        $datePrefix = date('Ymd');
        $seq = str_pad((string) $pengajuan->id, 4, '0', STR_PAD_LEFT);
        $baseNumber = "INV-{$datePrefix}-{$seq}";

        // If duplicate exists (e.g. re-issue), append revision suffix
        $exists = Invoice::where('invoice_number', $baseNumber)->exists();
        if ($exists) {
            $count = Invoice::where('pengajuan_id', $pengajuan->id)->count() + 1;

            return "INV-{$datePrefix}-{$seq}-R{$count}";
        }

        return $baseNumber;
    }

    /**
     * @param  array<int, array{description: string, quantity: int, unit_price: int, item_type?: string, item_id?: int|null}>  $customLines
     *
     * @throws ValidationException
     */
    public function issueForPengajuan(
        Pengajuan $pengajuan,
        User $issuer,
        ?Carbon $dueAt = null,
        ?string $notes = null,
        array $customLines = []
    ): Invoice {
        if ($pengajuan->isPreorder()) {
            throw ValidationException::withMessages(['invoice' => 'Gunakan penyusunan draf invoice BLU sebelum persetujuan pre-order.']);
        }

        return DB::transaction(function () use ($pengajuan, $issuer, $dueAt, $notes, $customLines) {
            // Must have order snapshot; if not yet, ensure transition to Menunggu Pembayaran creates it
            if (! $pengajuan->order) {
                // Ensure Pengajuan moves to Menunggu Pembayaran to snapshot the order
                if ($pengajuan->status === 'Menunggu Invoice' || $pengajuan->status === 'Diajukan') {
                    $this->workflow->transition($pengajuan, 'Menunggu Pembayaran', $notes, $issuer->name);
                    $pengajuan->refresh();
                }
            }

            $order = $pengajuan->order;
            $subtotal = 0;
            $linesData = [];

            if (! empty($customLines)) {
                foreach ($customLines as $line) {
                    $qty = max(1, (int) ($line['quantity'] ?? 1));
                    $price = max(0, (int) ($line['unit_price'] ?? 0));
                    $amount = $qty * $price;
                    $subtotal += $amount;

                    $linesData[] = [
                        'item_type' => $line['item_type'] ?? 'custom',
                        'item_id' => $line['item_id'] ?? null,
                        'description' => $line['description'],
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'amount' => $amount,
                    ];
                }
            } elseif ($order && $order->items->isNotEmpty()) {
                foreach ($order->items as $item) {
                    $qty = max(1, (int) $item->quantity);
                    $price = (int) $item->unit_price;
                    $amount = $qty * $price;
                    $subtotal += $amount;

                    $linesData[] = [
                        'item_type' => 'product',
                        'item_id' => $item->product_id,
                        'description' => $item->product_name,
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'amount' => $amount,
                    ];
                }
            } else {
                $product = $pengajuan->product;
                $qty = (int) ($pengajuan->jumlah ?: 1);
                $price = (int) ($pengajuan->total ?: ($product ? $product->final_price ?? $product->base_price : 0));
                $amount = $qty * $price;
                $subtotal = $amount;

                $linesData[] = [
                    'item_type' => 'product',
                    'item_id' => $product?->id,
                    'description' => $product?->name ?? 'Layanan '.ucfirst($pengajuan->tipe),
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'amount' => $amount,
                ];
            }

            $product = $pengajuan->product;
            $taxCalc = $this->taxService->calculate($subtotal, $product?->taxRate, $pengajuan->tipe);

            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber($pengajuan),
                'pengajuan_id' => $pengajuan->id,
                'order_id' => $order?->id,
                'issued_by' => $issuer->id,
                'issued_at' => now(),
                'due_at' => $dueAt ?? now()->addDays(3),
                'subtotal' => $taxCalc['subtotal'],
                'tax_rate_snapshot' => $taxCalc['tax_rate_snapshot'],
                'tax_amount' => $taxCalc['tax_amount'],
                'total' => $taxCalc['total'],
                'status' => 'issued',
                'notes' => $notes,
            ]);

            foreach ($linesData as $data) {
                $invoice->lines()->create($data);
            }

            // Ensure pengajuan is in Menunggu Pembayaran
            if ($pengajuan->status !== 'Menunggu Pembayaran' && ! in_array($pengajuan->status, ['Lunas', 'Diproses', 'Dikirim', 'Selesai'])) {
                $this->workflow->transition($pengajuan, 'Menunggu Pembayaran', 'Invoice diterbitkan', $issuer->name);
            }

            return $invoice->load(['lines', 'pengajuan', 'order', 'issuer']);
        });
    }

    /**
     * Buat invoice kwitansi otomatis saat pesanan ready-stock (Jalur B) selesai.
     * Invoice langsung berstatus 'paid' karena pembayaran sudah dikonfirmasi Midtrans.
     * Hanya berjalan jika belum ada invoice paid sebelumnya.
     */
    public function issueReceiptForReadyStock(Pengajuan $pengajuan): ?Invoice
    {
        // Hanya untuk Jalur B (non-preorder, sudah ada order snapshot yang paid)
        if ($pengajuan->isPreorder()) {
            return null;
        }

        // Jika sudah ada invoice paid, tidak perlu buat ulang
        if ($pengajuan->invoices()->where('status', 'paid')->exists()) {
            return null;
        }

        return DB::transaction(function () use ($pengajuan) {
            $order = $pengajuan->order;
            $linesData = [];
            $subtotal = 0;

            if ($order && $order->items->isNotEmpty()) {
                foreach ($order->items as $item) {
                    $qty = max(1, (int) $item->quantity);
                    $price = (int) $item->unit_price;
                    $amount = $qty * $price;
                    $subtotal += $amount;
                    $linesData[] = [
                        'item_type' => 'product',
                        'item_id' => $item->product_id,
                        'description' => $item->product_name,
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'amount' => $amount,
                    ];
                }
            } else {
                // Fallback jika order items kosong
                $product = $pengajuan->product;
                $qty = max(1, (int) ($pengajuan->jumlah ?: 1));
                $price = (int) ($pengajuan->total ?: ($product?->final_price ?? $product?->base_price ?? 0));
                $amount = $qty * $price;
                $subtotal = $amount;
                $linesData[] = [
                    'item_type' => 'product',
                    'item_id' => $product?->id,
                    'description' => $product?->name ?? 'Produk',
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'amount' => $amount,
                ];
            }

            $product = $pengajuan->product;
            $taxCalc = $this->taxService->calculate($subtotal, $product?->taxRate, $pengajuan->tipe);

            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber($pengajuan),
                'pengajuan_id' => $pengajuan->id,
                'order_id' => $order?->id,
                'issued_by' => null, // dibuat otomatis oleh sistem
                'issued_at' => now(),
                'due_at' => null, // sudah lunas, tidak ada jatuh tempo
                'subtotal' => $taxCalc['subtotal'],
                'tax_rate_snapshot' => $taxCalc['tax_rate_snapshot'],
                'tax_amount' => $taxCalc['tax_amount'],
                'total' => $taxCalc['total'],
                'status' => 'paid', // langsung paid karena sudah dikonfirmasi Midtrans
                'notes' => 'Kwitansi pembayaran otomatis — Ready Stock (Midtrans). Nomor pesanan: '.$pengajuan->code,
            ]);

            foreach ($linesData as $line) {
                $invoice->lines()->create($line);
            }

            return $invoice->load(['lines', 'pengajuan', 'order']);
        });
    }

    /**
     * Kirim notifikasi kwitansi ke customer setelah invoice ready stock dibuat.
     * Dipanggil dari luar transaksi agar `afterCommit()` pada notifikasi bisa jalan.
     */
    public function notifyReadyStockReceipt(Pengajuan $pengajuan): void
    {
        $invoice = $pengajuan->invoices()->where('status', 'paid')->latest()->first();
        if ($invoice) {
            $pengajuan->buyer?->notify(new \App\Notifications\ReadyStockReceipt($invoice));
        }
    }

    public function cancelInvoice(Invoice $invoice, string $reason): Invoice
    {
        DB::transaction(function () use ($invoice, $reason) {
            $request = Pengajuan::whereKey($invoice->pengajuan_id)->lockForUpdate()->firstOrFail();
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($locked->bank_snapshot && $locked->status !== 'draft') {
                throw ValidationException::withMessages(['invoice' => 'Hanya draf invoice BLU yang boleh dibatalkan.']);
            }
            $locked->update(['status' => 'cancelled', 'notes' => trim(($locked->notes ?? '')."\n[Dibatalkan]: ".$reason)]);
            $request->pushHistory($request->status, 'Invoice dibatalkan: '.$reason, auth()->user()?->name);
            $request->save();
        });

        return $invoice;
    }
}
