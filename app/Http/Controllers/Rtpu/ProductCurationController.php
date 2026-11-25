<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\ProdukUnggulan;
use App\Services\PengajuanWorkflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductCurationController extends Controller
{
    /**
     * Display a listing of Produk Unggulan proposals from P3M awaiting RTPU verification.
     */
    public function index(): Response
    {
        $products = ProdukUnggulan::with(['owner:id,name,email,phone,nip,jurusan,institution,unit_name'])
            ->where('status', 'Diajukan')
            ->latest()
            ->get()
            ->map(fn (ProdukUnggulan $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'description' => $p->description,
                'researcher' => $p->researcher,
                'team' => $p->team,
                'category' => $p->category,
                'price' => $p->price,
                'owner' => $p->owner?->name,
                'unit' => $p->owner?->unit_name ?? $p->owner?->institution,
                'phone' => $p->owner?->phone,
                'nip' => $p->owner?->nip,
                'jurusan' => $p->owner?->jurusan,
                'status' => $p->status,
                'documents' => $p->documents ?? [],
                'created_at' => optional($p->created_at)->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Rtpu/Verifikasi/Produk', [
            'products' => $products,
        ]);
    }

    /**
     * Admin RTPU approves Produk Unggulan proposal from P3M.
     */
    public function verify(Request $request, ProdukUnggulan $produk): RedirectResponse
    {
        $produk->setStatus(
            'Disetujui',
            'Disetujui oleh Admin RTPU untuk diteruskan ke Pimpinan RTPU.',
            Auth::user()->name
        );
        $produk->save();

        return back()->with('success', 'Produk unggulan disetujui dan diteruskan ke Pimpinan RTPU.');
    }

    /**
     * Admin RTPU rejects Produk Unggulan proposal from P3M.
     */
    public function reject(Request $request, ProdukUnggulan $produk): RedirectResponse
    {
        $data = $request->validate([
            'catatan' => 'nullable|string|max:1000',
            'reason' => 'nullable|string|max:1000',
        ]);

        $catatan = $data['catatan'] ?? $data['reason'] ?? null;
        if (empty($catatan)) {
            return back()->withErrors(['catatan' => 'Alasan atau catatan penolakan wajib diisi.']);
        }

        if ($produk->status !== 'Diajukan') {
            abort(422, 'Produk unggulan ini tidak dalam status yang dapat ditolak oleh RTPU.');
        }

        $produk->catatan = $catatan;
        $produk->setStatus('Ditolak', $catatan, Auth::user()->name);
        $produk->save();

        return back()->with('success', 'Produk unggulan ditolak dengan catatan.');
    }
}
