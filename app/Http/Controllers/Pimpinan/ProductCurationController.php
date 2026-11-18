<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductCurationController extends Controller
{
    /**
     * Display a listing of verified products requiring Pimpinan approval.
     */
    public function index(): Response
    {
        $products = Product::with(['category', 'owner:id,name,phone,nip,jurusan,institution,unit_name', 'approver:id,name'])
            ->whereIn('curation_status', ['pending', 'verified'])
            ->latest()
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'category' => $p->category?->name,
                'target_audience' => $p->target_audience ?? 'publik',
                'owner' => $p->owner?->name,
                'phone' => $p->owner?->phone,
                'nip' => $p->owner?->nip,
                'jurusan' => $p->owner?->jurusan,
                'product_detail' => $p->only(['thumbnail', 'images', 'description', 'short_description', 'base_price', 'stock', 'meta']),
                'unit' => $p->owner?->unit_name ?? $p->owner?->institution,
                'base_price' => $p->base_price,
                'final_price' => $p->final_price,
                'curation_status' => $p->curation_status,
                'rejection_reason' => $p->rejection_reason,
                'is_active' => $p->is_active,
                'created_at' => optional($p->created_at)->format('Y-m-d H:i'),
                'approved_at' => optional($p->approved_at)->format('Y-m-d H:i'),
                'approver' => $p->approver?->name,
                'meta' => $p->meta ?? [],
            ]);

        return Inertia::render('Pimpinan/Verifikasi/Produk', [
            'products' => $products,
        ]);
    }

    /**
     * Step 2: Pimpinan RTPU approves the verified product to be active in the catalog.
     */
    public function approve(Request $request, Product $product): RedirectResponse
    {
        app(\App\Services\ApproveCatalogProduct::class)->handle($product, $request->user());

        return back()->with('success', 'Produk disetujui dan langsung aktif di katalog PNJ PRIME.');
    }

    /**
     * Pimpinan RTPU rejects the verified product.
     */
    public function reject(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'catatan' => 'nullable|string|max:1000',
            'reason' => 'nullable|string|max:1000',
        ]);

        $catatan = $data['catatan'] ?? $data['reason'] ?? null;
        if (empty($catatan)) {
            return back()->withErrors(['catatan' => 'Alasan atau catatan penolakan wajib diisi.']);
        }

        if (! in_array($product->curation_status, ['pending', 'verified'], true)) {
            abort(422, 'Hanya produk berstatus pending atau verified yang dapat ditolak Pimpinan.');
        }

        // Use transitionTo() for audit trail
        $product->rejection_reason = $catatan;
        $product->is_active = false;
        $product->transitionTo('rejected', Auth::user(), $catatan);

        return back()->with('success', 'Produk ditolak oleh Pimpinan.');
    }
}
