<?php

namespace App\Http\Controllers\Pengelola;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products owned by the authenticated admin pengelola.
     */
    public function index(): Response
    {
        $products = Product::with('category')
            ->where('owner_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('Pengelola/Produk/Index', [
            'products' => $products,
        ]);
    }

    /**
     * Tipe item berdasarkan kategori (induk bila sub-kategori): produk | jasa | sewa.
     */
    private function tipeKategori(mixed $categoryId): string
    {
        $category = ProductCategory::with('parent')->find($categoryId);
        $slug = $category?->parent?->slug ?? $category?->slug ?? '';

        return str_contains($slug, 'jasa') ? 'jasa'
            : (str_contains($slug, 'sewa') || str_contains($slug, 'fasilitas') ? 'sewa' : 'produk');
    }

    private function requiredForProduk(Request $request): \Illuminate\Validation\Rules\RequiredIf
    {
        return \Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'produk');
    }

    /**
     * Susun meta sesuai tipe item. Produk: ketersediaan, berat, dimensi.
     * Jasa: tanpa atribut fisik. Sewa: satuan tarif, kapasitas, lokasi.
     */
    private function buildMeta(array $data, array $existing): array
    {
        $tipe = $this->tipeKategori($data['category_id']);

        if ($tipe === 'produk') {
            return array_merge($existing, [
                'availability_status' => $data['availability_status'] ?? 'tersedia',
                'preorder_duration' => $data['preorder_duration'] ?? null,
                'weight' => $data['weight'] ?? 1000,
                'length' => $data['length'] ?? 10,
                'width' => $data['width'] ?? 10,
                'height' => $data['height'] ?? 10,
            ]);
        }

        // Jasa dan sewa: buang atribut fisik/ketersediaan yang tersisa dari tipe sebelumnya.
        $meta = array_diff_key($existing, array_flip(['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height']));

        if ($tipe === 'sewa') {
            $meta['satuan'] = $data['satuan'] ?? 'hari';
            $meta['capacity'] = $data['capacity'] ?? null;
            $meta['location'] = $data['location'] ?? null;
        }

        return $meta;
    }

    /**
     * Show form for creating a new product.
     */
    public function create(): Response
    {
        return Inertia::render('Pengelola/Produk/Form', [
            'categories' => ProductCategory::with('parent')
                ->whereNotNull('parent_id')
                ->where('is_active', true)
                ->orderBy('parent_id')
                ->orderBy('sort_order')
                ->get()
                ->map(fn($c) => [
                    'id'          => $c->id,
                    'name'        => $c->name,
                    'slug'        => $c->slug,
                    'parent_id'   => $c->parent_id,
                    'parent_name' => $c->parent?->name,
                    'parent_slug' => $c->parent?->slug,
                ]),
            'item' => null,
        ]);
    }

    /**
     * Store a newly created product in draft status.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'target_audience' => 'nullable|string|in:publik,internal_pnj',
            'availability_status' => [$this->requiredForProduk($request), 'nullable', 'string', 'in:tersedia,preorder'],
            'preorder_duration' => 'nullable|string|max:100',
            'weight' => [$this->requiredForProduk($request), 'nullable', 'integer', 'min:1'],
            'length' => 'nullable|integer|min:1',
            'width' => 'nullable|integer|min:1',
            'height' => 'nullable|integer|min:1',
            'base_price' => 'required|integer|min:0',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:5000',
            'stock' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'produk' && $request->input('availability_status', 'tersedia') === 'tersedia'), 'nullable', 'integer', 'min:0'],
            'satuan' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'sewa'), 'nullable', 'in:hari,jam'],
            'capacity' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|image|max:2048',
            'images.*' => 'nullable|image|max:2048',
            'existing_images' => 'nullable|array',
            'video_url' => 'nullable|url|max:255',
            'video_file' => 'nullable|mimes:mp4,mov,avi,wmv|max:51200',
            'existing_video_path' => 'nullable|string',
        ], [
            'video_file.mimes' => 'Format video tidak didukung. Gunakan MP4, MOV, AVI, atau WMV.',
            'video_file.max'   => 'Ukuran video maksimal 50 MB. Kompres video Anda sebelum mengunggah.',
        ]);

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('products', 'public');
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('products', 'public');
            }
        }

        $videoPath = null;
        if ($request->hasFile('video_file')) {
            $videoPath = $request->file('video_file')->store('products/videos', 'public');
        }

        $slugBase = Str::slug($data['name']);
        $slug = $slugBase;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $slugBase.'-'.(++$counter);
        }

        $product = Product::create([
            'owner_id' => Auth::id(),
            'category_id' => $data['category_id'],
            'target_audience' => $data['target_audience'] ?? 'publik',
            'name' => $data['name'],
            'slug' => $slug,
            'base_price' => $data['base_price'],
            'final_price' => $data['base_price'],
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'thumbnail' => $thumbnailPath ?? ($imagePaths[0] ?? null),
            'images' => $imagePaths,
            'video_url' => $data['video_url'] ?? null,
            'video_path' => $videoPath,
            'stock' => ($this->tipeKategori($data['category_id']) !== 'produk' || ($data['availability_status'] ?? 'tersedia') === 'preorder') ? 0 : ($data['stock'] ?? 0),
            'meta' => $this->buildMeta($data, []),
            'curation_status' => 'draft',
            'is_active' => false,
        ]);

        return redirect()->route('pengelola.produk.index')
            ->with('success', "Draft produk {$product->name} berhasil disimpan.");
    }

    /**
     * Show form for editing an existing product.
     */
    public function edit(Product $product): Response
    {
        $this->authorizeOwner($product);

        return Inertia::render('Pengelola/Produk/Form', [
            'categories' => ProductCategory::with('parent')
                ->whereNotNull('parent_id')
                ->where('is_active', true)
                ->orderBy('parent_id')
                ->orderBy('sort_order')
                ->get()
                ->map(fn($c) => [
                    'id'          => $c->id,
                    'name'        => $c->name,
                    'slug'        => $c->slug,
                    'parent_id'   => $c->parent_id,
                    'parent_name' => $c->parent?->name,
                    'parent_slug' => $c->parent?->slug,
                ]),
            'item' => $product,
        ]);
    }

    /**
     * Update an existing product (only if draft or rejected).
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->authorizeOwner($product);

        if (! in_array($product->curation_status, ['draft', 'rejected'], true)) {
            abort(422, 'Produk yang sedang dalam proses kurasi tidak dapat diubah.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'target_audience' => 'nullable|string|in:publik,internal_pnj',
            'availability_status' => [$this->requiredForProduk($request), 'nullable', 'string', 'in:tersedia,preorder'],
            'preorder_duration' => 'nullable|string|max:100',
            'weight' => [$this->requiredForProduk($request), 'nullable', 'integer', 'min:1'],
            'length' => 'nullable|integer|min:1',
            'width' => 'nullable|integer|min:1',
            'height' => 'nullable|integer|min:1',
            'base_price' => 'required|integer|min:0',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:5000',
            'stock' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'produk' && $request->input('availability_status', 'tersedia') === 'tersedia'), 'nullable', 'integer', 'min:0'],
            'satuan' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'sewa'), 'nullable', 'in:hari,jam'],
            'capacity' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'thumbnail' => 'nullable|image|max:2048',
            'images.*' => 'nullable|image|max:2048',
            'existing_images' => 'nullable|array',
            'video_url' => 'nullable|url|max:255',
            'video_file' => 'nullable|mimes:mp4,mov,avi,wmv|max:51200',
            'existing_video_path' => 'nullable|string',
        ], [
            'video_file.mimes' => 'Format video tidak didukung. Gunakan MP4, MOV, AVI, atau WMV.',
            'video_file.max'   => 'Ukuran video maksimal 50 MB. Kompres video Anda sebelum mengunggah.',
        ]);

        $thumbnailPath = $product->thumbnail;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('products', 'public');
        }

        $imagePaths = $data['existing_images'] ?? [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('products', 'public');
            }
        }

        $videoPath = $data['existing_video_path'] ?: null;
        if ($request->hasFile('video_file')) {
            $videoPath = $request->file('video_file')->store('products/videos', 'public');
        }

        $product->update([
            'category_id' => $data['category_id'],
            'target_audience' => $data['target_audience'] ?? $product->target_audience ?? 'publik',
            'name' => $data['name'],
            'base_price' => $data['base_price'],
            'final_price' => $data['base_price'],
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'thumbnail' => $thumbnailPath ?? ($imagePaths[0] ?? $product->thumbnail),
            'images' => $imagePaths,
            'video_url' => $data['video_url'] ?? null,
            'video_path' => $videoPath,
            'stock' => ($this->tipeKategori($data['category_id']) !== 'produk' || ($data['availability_status'] ?? 'tersedia') === 'preorder') ? 0 : ($data['stock'] ?? 0),
            'meta' => $this->buildMeta($data, $product->meta ?? []),
        ]);

        return redirect()->route('pengelola.produk.index')
            ->with('success', "Produk {$product->name} berhasil diperbarui.");
    }

    /**
     * Submit a draft or rejected product for curation.
     */
    public function submit(Product $product): RedirectResponse
    {
        $this->authorizeOwner($product);

        if (! in_array($product->curation_status, ['draft', 'rejected'], true)) {
            abort(422, 'Hanya produk draft atau ditolak yang dapat diajukan untuk kurasi.');
        }

        $product->update([
            'curation_status' => 'pending',
            'rejection_reason' => null,
        ]);

        return back()->with('success', "Produk {$product->name} berhasil diajukan untuk verifikasi RTPU.");
    }

    /**
     * Delete a draft or rejected product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $this->authorizeOwner($product);

        if (! in_array($product->curation_status, ['draft', 'rejected'], true)) {
            abort(422, 'Produk yang sudah diverifikasi tidak dapat dihapus.');
        }

        $product->delete();

        return redirect()->route('pengelola.produk.index')
            ->with('success', 'Produk berhasil dihapus.');
    }

    private function authorizeOwner(Product $product): void
    {
        // Use Policy instead of manual check
        $this->authorize('view', $product);
    }
}
