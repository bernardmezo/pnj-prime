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
            ->whereIn('curation_status', ['pending', 'verified', 'rejected'])
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
                'created_at' => optional($p->created_at)->format('Y-m-d H:i'),
                'meta' => $p->meta ?? [],
            ]);

        return Inertia::render('Rtpu/Verifikasi/Produk', [
            'products' => $products,
        ]);
    }

    /**
     * Step 1: Admin RTPU verifies product catalog from unit/P3M.
     */
    public function verify(Request $request, Product $product): RedirectResponse
    {
        if ($product->curation_status !== 'pending') {
            abort(422, 'Hanya produk berstatus pending yang dapat diverifikasi RTPU.');
        }

        $meta = $product->meta ?? [];
        $meta['rtpu_verified_at'] = now()->toIso8601String();
        $meta['rtpu_verifier_id'] = Auth::id();
        $meta['rtpu_verifier_name'] = Auth::user()->name;

        $product->curation_status = 'verified';
        $product->meta = $meta;
        $product->rejection_reason = null;
        $product->save();

        return back()->with('success', 'Produk berhasil diverifikasi dan diteruskan ke Pimpinan RTPU.');
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

        $meta = $product->meta ?? [];
        $meta['rtpu_rejected_at'] = now()->toIso8601String();
        $meta['rtpu_rejecter_name'] = Auth::user()->name;

        $product->curation_status = 'rejected';
        $product->rejection_reason = $catatan;
        $product->meta = $meta;
        $product->save();

        return back()->with('success', 'Produk ditolak dengan catatan.');
    }
}
