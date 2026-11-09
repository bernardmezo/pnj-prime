<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class InvoiceController extends Controller
{
    /**
     * Show the latest invoice for customer's pengajuan.
     */
    public function show(Pengajuan $pengajuan): View
    {
        if ($pengajuan->buyer_id !== Auth::id()) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $invoice = $pengajuan->latestInvoice;
        if (! $invoice) {
            abort(404, 'Invoice belum diterbitkan untuk pengajuan ini.');
        }

        $invoice->load(['lines', 'pengajuan.buyer', 'pengajuan.product', 'order', 'issuer']);

        return view('invoices.show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Printable view of the customer's invoice.
     */
    public function print(Pengajuan $pengajuan): View
    {
        if ($pengajuan->buyer_id !== Auth::id()) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $invoice = $pengajuan->latestInvoice;
        if (! $invoice) {
            abort(404, 'Invoice belum diterbitkan untuk pengajuan ini.');
        }

        $invoice->load(['lines', 'pengajuan.buyer', 'pengajuan.product', 'order', 'issuer']);

        return view('invoices.print', [
            'invoice' => $invoice,
        ]);
    }
}
