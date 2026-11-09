<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Pengajuan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        protected PengajuanWorkflow $workflow = new PengajuanWorkflow,
        protected TaxService $taxService = new TaxService,
    ) {}

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
            if ($pengajuan->status !== 'Menunggu Pembayaran' && ! in_array($pengajuan->status, ['Lunas', 'Diproses', 'Selesai'])) {
                $this->workflow->transition($pengajuan, 'Menunggu Pembayaran', 'Invoice diterbitkan', $issuer->name);
            }

            return $invoice->load(['lines', 'pengajuan', 'order', 'issuer']);
        });
    }

    /**
     * Cancel an issued invoice with a reason.
     */
    public function cancelInvoice(Invoice $invoice, string $reason): Invoice
    {
        $invoice->update([
            'status' => 'cancelled',
            'notes' => trim(($invoice->notes ?? '')."\n[Dibatalkan]: ".$reason),
        ]);

        return $invoice;
    }
}
