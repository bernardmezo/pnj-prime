<?php

namespace App\Http\Controllers\Rtpu;

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
     * Display a listing of products requiring curation by Admin RTPU.
     */
    public function index(): Response
    {
        $products = Product::with(['category', 'owner:id,name,institution,unit_name'])
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
                'unit' => $p->owner?->unit_name ?? $p->owner?->institution,
                'base_price' => $p->base_price,
                'final_price' => $p->final_price,
                'curation_status' => $p->curation_status,
                'rejection_reason' => $p->rejection_reason,
                'created_at' => optional($p->created_at)->format('Y-m-d H:i'),
                'meta' => $p->meta ?? [],
            ]);

        return Inertia::render('Rtpu/Verifikasi/Produk', [
            'products' => $products,
        ]);
    }

    /**
     * Show detailed product view for Admin RTPU verification (dedicated page).
     */
    public function show(Product $product): Response
    {
        // Load owner full data for verification
        $product->load(['category', 'owner:id,name,email,phone,institution,unit_name,nip,jurusan']);

        $data = [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'category' => $product->category?->name,
            'category_slug' => $product->category?->slug,
            'target_audience' => $product->target_audience ?? 'publik',
            'base_price' => $product->base_price,
            'final_price' => $product->final_price,
            'curation_status' => $product->curation_status,
            'rejection_reason' => $product->rejection_reason,
            'photos' => $product->photos ?? [],
            'documents' => $product->documents ?? [],
            'meta' => $product->meta ?? [],
            'created_at' => optional($product->created_at)->format('d M Y, H:i'),
            'owner_detail' => [
                'name' => $product->owner?->name,
                'email' => $product->owner?->email,
                'phone' => $product->owner?->phone,
                'institution' => $product->owner?->institution,
                'unit_name' => $product->owner?->unit_name,
                'nip' => $product->owner?->nip,
                'jurusan' => $product->owner?->jurusan,
            ],
        ];

        return Inertia::render('Rtpu/Verifikasi/ProdukDetail', [
            'product' => $data,
        ]);
    }

    /**
     * Step 1: Admin RTPU verifies product catalog from unit/P3M.
     */
    public function verify(Request $request, Product $product): RedirectResponse
    {
        app(\App\Services\ApproveCatalogProduct::class)->handle($product, $request->user());

        return back()->with('success', 'Produk disetujui dan langsung aktif di katalog PNJ PRIME.');
    }

    /**
     * Admin RTPU rejects the submitted product catalog.
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
            abort(422, 'Produk ini tidak dalam status yang dapat ditolak oleh RTPU.');
        }

        // Use transitionTo() for audit trail
        $product->rejection_reason = $catatan;
        $product->transitionTo('rejected', Auth::user(), $catatan);

        return back()->with('success', 'Produk ditolak dengan catatan.');
    }
}
