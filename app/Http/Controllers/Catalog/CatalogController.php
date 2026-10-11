<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
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

    /**
     * Full public catalog (filterable, paginated). The landing page
     * (index) only shows a 4-card preview linking here.
     */
    public function browse(Request $request): Response
    {
        $query = Product::with(['category', 'owner:id,name'])
            ->where('curation_status', 'approved')
            ->where('is_active', true);

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('short_description', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category')) {
            $slug = $request->string('category')->toString();
            $query->whereHas('category', fn ($c) => $c->where('slug', $slug));
        }

        if (is_numeric($request->input('min_price'))) {
            $query->where('final_price', '>=', (int) $request->input('min_price'));
        }

        if (is_numeric($request->input('max_price'))) {
            $query->where('final_price', '<=', (int) $request->input('max_price'));
        }

        return Inertia::render('Catalog/Browse', [
            'products'   => $query->latest('approved_at')->paginate(12)->withQueryString(),
            'categories' => ProductCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon']),
            'filters'    => $request->only(['q', 'category', 'min_price', 'max_price']),
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
