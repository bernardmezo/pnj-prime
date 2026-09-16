<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Catalog/Index', [
            'categories'        => ProductCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon']),
            'featured_products' => Product::with(['category', 'owner'])
                ->where('curation_status', 'approved')
                ->where('is_active', true)
                ->latest('approved_at')
                ->limit(8)
                ->get(),
        ]);
    }

    public function show(Product $product): Response
    {
        abort_if(
            $product->curation_status !== 'approved' || ! $product->is_active,
            404
        );

        return Inertia::render('Catalog/Show', [
            'product' => $product->load(['category', 'owner:id,name']),
        ]);
    }
}
