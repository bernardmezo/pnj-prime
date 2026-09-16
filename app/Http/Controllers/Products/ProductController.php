<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $user  = Auth::user();
        $query = Product::with(['category'])->latest();

        if (! $user->isAdminRtpu()) {
            $query->where('owner_id', $user->id);
        }

        return Inertia::render('Products/Index', [
            'products' => $query->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', [
            'categories' => ProductCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request)
    {
        return redirect()->route('products.index');
    }

    public function show(Product $product): Response
    {
        return Inertia::render('Products/Show', [
            'product' => $product->load(['category', 'owner']),
        ]);
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Edit', [
            'product'    => $product->load('category'),
            'categories' => ProductCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        return redirect()->route('products.index');
    }

    public function destroy(Product $product)
    {
        return redirect()->route('products.index');
    }
}
