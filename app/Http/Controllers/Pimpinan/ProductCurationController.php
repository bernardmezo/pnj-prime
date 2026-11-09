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
        $products = Product::with(['category', 'owner:id,name,institution,unit_name', 'approver:id,name'])
            ->whereIn('curation_status', ['verified', 'approved', 'rejected'])
            ->latest()
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'category' => $p->category?->name,
                'owner' => $p->owner?->name,
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
        if ($product->curation_status !== 'verified') {
            abort(422, 'Hanya produk berstatus verified yang dapat disetujui Pimpinan.');
        }

        $meta = $product->meta ?? [];
        $meta['pimpinan_approved_at'] = now()->toIso8601String();
        $meta['pimpinan_approver_id'] = Auth::id();
        $meta['pimpinan_approver_name'] = Auth::user()->name;

        $product->curation_status = 'approved';
        $product->is_active = true;
        $product->approved_at = now();
        $product->approved_by = Auth::id();
        $product->rejection_reason = null;
        $product->meta = $meta;
        $product->save();

        return back()->with('success', 'Produk disetujui dan resmi aktif di katalog PNJ PRIME.');
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

        if ($product->curation_status !== 'verified') {
            abort(422, 'Hanya produk berstatus verified yang dapat ditolak Pimpinan.');
        }

        $meta = $product->meta ?? [];
        $meta['pimpinan_rejected_at'] = now()->toIso8601String();
        $meta['pimpinan_rejecter_name'] = Auth::user()->name;

        $product->curation_status = 'rejected';
        $product->is_active = false;
        $product->rejection_reason = $catatan;
        $product->meta = $meta;
        $product->save();

        return back()->with('success', 'Produk ditolak oleh Pimpinan.');
    }
}
