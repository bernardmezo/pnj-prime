<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CurationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Curation/Index', [
            'pending_products' => Product::with(['owner', 'category'])
                ->where('curation_status', 'pending')
                ->latest()
                ->paginate(15),
            'stats' => [
                'pending'  => Product::where('curation_status', 'pending')->count(),
                'approved' => Product::where('curation_status', 'approved')->count(),
                'rejected' => Product::where('curation_status', 'rejected')->count(),
            ],
        ]);
    }

    public function approve(Request $request, Product $product)
    {
        $product->update([
            'curation_status'  => 'approved',
            'approved_at'      => now(),
            'approved_by'      => Auth::id(),
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Produk berhasil disetujui.');
    }

    public function reject(Request $request, Product $product)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $product->update([
            'curation_status'  => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_at'      => null,
            'approved_by'      => null,
        ]);

        return back()->with('success', 'Produk ditolak.');
    }
}
