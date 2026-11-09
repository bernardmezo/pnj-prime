<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\PengelolaApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PengelolaApplicationController extends Controller
{
    /**
     * Show pengelola application form or current status.
     */
    public function index(): Response
    {
        $existing = PengelolaApplication::where('user_id', Auth::id())
            ->latest()
            ->first();

        return Inertia::render('Customer/PengelolaApplication/Index', [
            'application' => $existing,
        ]);
    }

    /**
     * Submit an application to become admin_pengelola.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'unit_name' => 'required|string|max:100',
            'pic_name' => 'required|string|max:100',
            'pic_phone' => 'required|string|max:30',
            'sk_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        // Check if there is already a pending application
        $hasPending = PengelolaApplication::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return back()->withErrors(['unit_name' => 'Anda telah memiliki permohonan yang sedang diproses.']);
        }

        $path = $request->file('sk_document')->store('sk_documents', 'local');

        PengelolaApplication::create([
            'user_id' => Auth::id(),
            'unit_name' => $data['unit_name'],
            'pic_name' => $data['pic_name'],
            'phone' => $data['pic_phone'] ?? $request->input('phone'),
            'sk_document_path' => $path,
            'status' => 'pending',
        ]);

        return redirect()->route('customer.pengelola.index')->with('success', 'Permohonan menjadi Pengelola Unit berhasil diajukan, menunggu verifikasi Super Admin.');
    }
}
