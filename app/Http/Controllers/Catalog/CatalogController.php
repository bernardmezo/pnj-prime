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
    /**
     * Landing for guests, shop homepage for customers, dashboard redirect
     * for staff (they have work to do, not marketing to read).
     */
    public function index()
    {
        $user = auth()->user();

        if ($user && $user->isStaff()) {
            return redirect()->route('dashboard');
        }

        $canSeeInternal = $user && $user->isCivitasPnj();

        $featuredQuery = Product::with([
            'category.parent',
            'owner',
            'opsi' => fn ($q) => $q->where('aktif', true)->urut(),
        ])
            ->withSum([
                'orderItems as sold_count' => fn ($q) => $q->whereHas('order', fn ($oq) => $oq->where('status', 'selesai')),
            ], 'quantity')
            ->where('curation_status', 'approved')
            ->where('is_active', true);

        if (! $canSeeInternal) {
            $featuredQuery->where('target_audience', 'publik');
        }

        $data = [
            'categories' => $this->categories(),
            'featured_products' => $featuredQuery->latest('approved_at')
                ->limit(8)
                ->get(),
        ];

        if ($user) {
            return Inertia::render('Customer/Home', $data);
        }

        return Inertia::render('Catalog/Index', $data);
    }

    /**
     * Full public catalog (filterable, paginated). The landing page
     * (index) only shows a 4-card preview linking here.
     */
    public function browse(Request $request): Response
    {
        $user = auth()->user();

        $canSeeInternal = $user && $user->isCivitasPnj();

        if ($user && in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true)) {
            $products = Product::where('owner_id', $user->id)
                ->with('category:id,name')
                ->addSelect(['sold_count' => \App\Models\Pengajuan::selectRaw('COALESCE(SUM(CAST(jumlah AS INTEGER)), 0)')
                    ->whereColumn('product_id', 'products.id')
                    ->whereIn('status', ['Lunas', 'Diproses', 'Dikirim', 'Selesai'])])
                ->latest()->get();

            return Inertia::render('Pengelola/Katalog', ['products' => $products]);
        }

        $query = Product::with([
            'category.parent',
            'owner:id,name,jurusan',
            'opsi' => fn ($q) => $q->where('aktif', true)->urut(),
        ])
            ->withSum([
                'orderItems as sold_count' => fn ($q) => $q->whereHas('order', fn ($oq) => $oq->where('status', 'selesai')),
            ], 'quantity')
            ->where('curation_status', 'approved')
            ->where('is_active', true);

        if (! $canSeeInternal) {
            $query->where('target_audience', 'publik');
        }

        // Jika yang login adalah admin jurusan / admin pengelola, filter produk berdasarkan jurusannya
        if ($user && in_array($user->role, ['admin_jurusan', 'admin_pengelola']) && $user->jurusan) {
            $query->whereHas('owner', function ($q) use ($user) {
                $q->where('jurusan', $user->jurusan);
            });
        }

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('short_description', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category')) {
            $slug = $request->string('category')->toString();
            $query->whereHas('category', fn ($c) => $c->where(fn ($q) => $q->where('slug', $slug)->orWhereHas('parent', fn ($parent) => $parent->where('slug', $slug))));
        }

        if (is_numeric($request->input('min_price'))) {
            $query->where('final_price', '>=', (int) $request->input('min_price'));
        }

        if (is_numeric($request->input('max_price'))) {
            $query->where('final_price', '<=', (int) $request->input('max_price'));
        }

        return Inertia::render('Catalog/Browse', [
            'products' => $query->latest('approved_at')->paginate(12)->withQueryString(),
            'categories' => $this->categories(),
            'filters' => $request->only(['q', 'category', 'min_price', 'max_price']),
        ]);
    }

    private function categories(): \Illuminate\Support\Collection
    {
        $categories = ProductCategory::with('parent:id,name')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'icon', 'parent_id']);
        $duplicates = $categories->countBy(fn ($category) => mb_strtolower(trim($category->name)));

        return $categories->reject(fn ($category) => mb_strtolower(trim($category->name)) === 'lainnya')->map(function ($category) use ($duplicates) {
            $category->display_name = $category->parent && $duplicates[mb_strtolower(trim($category->name))] > 1
                ? $category->name.' — '.$category->parent->name
                : $category->name;

            return $category;
        })->values();
    }

    public function show(Product $product): Response
    {
        $user = auth()->user();
        $isOwnerCatalog = $user && in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true);
        if ($isOwnerCatalog) {
            abort_unless($product->owner_id === $user->id, 404);
        }
        $canPreview = $user && ($user->role === 'admin_rtpu' || $isOwnerCatalog);

        $isPubliclyAvailable = $product->curation_status === 'approved' && $product->is_active;

        abort_if(! $isPubliclyAvailable && ! $canPreview, 404);

        if ($product->target_audience === 'internal_pnj' && ! $canPreview) {
            abort_unless($user && $user->isCivitasPnj(), 403, 'Produk ini khusus untuk sivitas akademika Politeknik Negeri Jakarta.');
        }

        return Inertia::render('Catalog/Show', [
            'product' => $product->load([
                'category.parent',
                'owner:id,name,jurusan,unit_name',
                'opsi' => fn ($q) => $q->where('aktif', true)->urut(),
            ]),
            'isPreview' => ! $isPubliclyAvailable,
        ]);
    }
}
