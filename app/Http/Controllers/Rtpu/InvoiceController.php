<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Pengajuan;
use App\Services\InvoiceService;
use App\Services\PengajuanWorkflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected PengajuanWorkflow $workflow
    ) {}

    /**
     * Issue an official invoice for a pengajuan.
     */
    public function store(Request $request, Pengajuan $pengajuan): RedirectResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        $allowedStatuses = ['Menunggu Invoice', 'Menunggu Pembayaran'];
        if (! in_array($pengajuan->status, $allowedStatuses, true)) {
            abort(422, 'Pengajuan tidak dalam status yang dapat menerbitkan invoice.');
        }

        $invoice = $this->invoiceService->issueForPengajuan(
            $pengajuan,
            Auth::user(),
            $request->filled('due_date') ? $request->date('due_date') : null,
            $request->input('notes')
        );

        return redirect()->back()->with('success', "Invoice resmi {$invoice->invoice_number} berhasil diterbitkan.");
    }

    /**
     * Show invoice details or render printable view.
     */
    public function show(Invoice $invoice): View
    {
        $invoice->load(['lines', 'pengajuan.buyer', 'pengajuan.product', 'order', 'issuer']);

        return view('invoices.show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Printable view of the invoice.
     */
    public function print(Invoice $invoice): View
    {
        $invoice->load(['lines', 'pengajuan.buyer', 'pengajuan.product', 'order', 'issuer']);

        return view('invoices.print', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Cancel an invoice.
     */
    public function cancel(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->invoiceService->cancelInvoice($invoice, $data['reason']);

        return back()->with('success', "Invoice {$invoice->invoice_number} berhasil dibatalkan.");
    }
}
