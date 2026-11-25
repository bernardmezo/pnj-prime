<?php

namespace App\Http\Controllers\Pengelola;

use App\Http\Controllers\Controller;
use App\Models\Opsi;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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

        $meta = $existing;

        if ($tipe === 'sewa') {
            $meta['satuan'] = $data['satuan'] ?? $meta['satuan'] ?? 'hari';
            $meta['capacity'] = array_key_exists('capacity', $data) ? $data['capacity'] : ($meta['capacity'] ?? null);
            $meta['location'] = array_key_exists('location', $data) ? $data['location'] : ($meta['location'] ?? null);
        }

        if (in_array($tipe, ['sewa', 'jasa'], true)) {
            $meta['operational_days'] = array_values(array_map('intval', $data['operational_days'] ?? [1, 2, 3, 4, 5]));
            $meta['operational_start'] = $data['operational_start'] ?? '08:00';
            $meta['operational_end'] = $data['operational_end'] ?? '16:00';
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
            'cost_price' => 'nullable|integer|min:0',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:5000',
            'stock' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'produk' && $request->input('availability_status', 'tersedia') === 'tersedia'), 'nullable', 'integer', 'min:0'],
            'satuan' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'sewa'), 'nullable', 'in:hari,jam'],
            'capacity' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'operational_days' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'array', 'min:1'],
            'operational_days.*' => 'integer|between:1,7',
            'operational_start' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'date_format:H:i'],
            'operational_end' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'date_format:H:i', 'after:operational_start'],
            'thumbnail' => 'nullable|image|max:2048',
            'images.*' => 'nullable|image|max:2048',
            'existing_images' => 'nullable|array',
            'opsi' => 'sometimes|array|max:40',
            'opsi.*.id' => 'nullable|integer',
            'opsi.*.jenis' => 'required|in:termasuk,addon',
            'opsi.*.nama' => 'required|string|max:255',
            'opsi.*.deskripsi' => 'nullable|string|max:2000',
            'opsi.*.foto' => 'nullable|image|max:2048',
            'opsi.*.harga' => 'nullable|integer|min:0|max:10000000000',
            'opsi.*.satuan' => 'required|in:flat,per_hari,per_jam,per_orang,per_unit',
            'opsi.*.qty_min' => 'nullable|integer|min:1',
            'opsi.*.qty_max' => 'nullable|integer|min:1',
            'opsi.*.stok' => 'nullable|integer|min:0',
            'opsi.*.aktif' => 'nullable|boolean',
            'opsi.*.urutan' => 'nullable|integer|min:0',
            'video_url' => 'nullable|url|max:255',
            'video_file' => 'nullable|mimes:mp4,mov,avi,wmv|max:51200',
            'existing_video_path' => 'nullable|string',
        ], [
            'video_file.mimes' => 'Format video tidak didukung. Gunakan MP4, MOV, AVI, atau WMV.',
            'video_file.max'   => 'Ukuran video maksimal 50 MB. Kompres video Anda sebelum mengunggah.',
        ]);

        // Validasi harga add-on tidak boleh Rp 0
        if ($request->has('opsi')) {
            foreach ($request->input('opsi', []) as $index => $opsi) {
                if (($opsi['jenis'] ?? '') === 'addon') {
                    $harga = (int) ($opsi['harga'] ?? 0);
                    if ($harga < 1000) {
                        throw ValidationException::withMessages([
                            "opsi.{$index}.harga" => 'Harga add-on minimal Rp 1.000.',
                        ]);
                    }
                }
            }
        }

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

        $product = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $request, $slug, $thumbnailPath, $imagePaths, $videoPath) {
        $product = Product::create([
            'owner_id' => Auth::id(),
            'category_id' => $data['category_id'],
            'target_audience' => $data['target_audience'] ?? 'publik',
            'name' => $data['name'],
            'slug' => $slug,
            'base_price' => $data['base_price'],
            'cost_price' => $data['cost_price'] ?? 0,
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

        if ($request->has('opsi') || $request->boolean('opsi_present')) {
            $this->syncOpsi($product, $data['opsi'] ?? [], $request);
        }

        return $product;
        });

        return redirect()->route('pengelola.produk.index')
            ->with('success', "Draft produk {$product->name} berhasil disimpan.");
    }

    /**
     * Show form for editing an existing product.
     */
    public function edit(Product $product): Response|RedirectResponse
    {
        $this->authorizeOwner($product);

        if (! in_array($product->curation_status, ['draft', 'rejected', 'approved'], true)) {
            return redirect()->route('pengelola.produk.index')
                ->with('error', 'Produk hanya dapat diubah saat berstatus draft, ditolak, atau disetujui.');
        }

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
            'item' => [
                ...$product->toArray(),
                'cost_price' => $product->cost_price,
                'opsi' => $product->opsi()->urut()->get()->map(fn (Opsi $o) => [
                    'id' => $o->id,
                    'jenis' => $o->jenis,
                    'nama' => $o->nama,
                    'deskripsi' => $o->deskripsi,
                    'foto' => $o->foto,
                    'harga' => $o->harga,
                    'satuan' => $o->satuan,
                    'qty_min' => $o->qty_min,
                    'qty_max' => $o->qty_max,
                    'stok' => $o->stok,
                    'aktif' => (bool) $o->aktif,
                    'urutan' => $o->urutan,
                ])->values(),
            ],
        ]);
    }

    /**
     * Update a draft, rejected, or approved product.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->authorizeOwner($product);

        if (! in_array($product->curation_status, ['draft', 'rejected', 'approved'], true)) {
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
            'cost_price' => 'nullable|integer|min:0',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:5000',
            'stock' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'produk' && $request->input('availability_status', 'tersedia') === 'tersedia'), 'nullable', 'integer', 'min:0'],
            'satuan' => [\Illuminate\Validation\Rule::requiredIf(fn () => $this->tipeKategori($request->input('category_id')) === 'sewa'), 'nullable', 'in:hari,jam'],
            'capacity' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'operational_days' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'array', 'min:1'],
            'operational_days.*' => 'integer|between:1,7',
            'operational_start' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'date_format:H:i'],
            'operational_end' => [\Illuminate\Validation\Rule::requiredIf(fn () => in_array($this->tipeKategori($request->input('category_id')), ['sewa', 'jasa'], true)), 'date_format:H:i', 'after:operational_start'],
            'thumbnail' => 'nullable|image|max:2048',
            'images.*' => 'nullable|image|max:2048',
            'existing_images' => 'nullable|array',
            'opsi' => 'sometimes|array|max:40',
            'opsi.*.id' => 'nullable|integer',
            'opsi.*.jenis' => 'required|in:termasuk,addon',
            'opsi.*.nama' => 'required|string|max:255',
            'opsi.*.deskripsi' => 'nullable|string|max:2000',
            'opsi.*.foto' => 'nullable|image|max:2048',
            'opsi.*.harga' => 'nullable|integer|min:0|max:10000000000',
            'opsi.*.satuan' => 'required|in:flat,per_hari,per_jam,per_orang,per_unit',
            'opsi.*.qty_min' => 'nullable|integer|min:1',
            'opsi.*.qty_max' => 'nullable|integer|min:1',
            'opsi.*.stok' => 'nullable|integer|min:0',
            'opsi.*.aktif' => 'nullable|boolean',
            'opsi.*.urutan' => 'nullable|integer|min:0',
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

        $imagePaths = $data['existing_images'] ?? ($request->boolean('existing_images_present') ? [] : ($product->images ?? []));
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $imagePaths[] = $img->store('products', 'public');
            }
        }

        $videoPath = array_key_exists('existing_video_path', $data) ? $data['existing_video_path'] : $product->video_path;
        if ($request->hasFile('video_file')) {
            $videoPath = $request->file('video_file')->store('products/videos', 'public');
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($product, $data, $request, $thumbnailPath, $imagePaths, $videoPath) {
        $product->update([
            'category_id' => $data['category_id'],
            'target_audience' => $data['target_audience'] ?? $product->target_audience ?? 'publik',
            'name' => $data['name'],
            'base_price' => $data['base_price'],
            'cost_price' => $data['cost_price'] ?? $product->cost_price,
            'final_price' => $data['base_price'],
            'short_description' => array_key_exists('short_description', $data) ? $data['short_description'] : $product->short_description,
            'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
            'thumbnail' => $thumbnailPath ?? ($imagePaths[0] ?? $product->thumbnail),
            'images' => $imagePaths,
            'video_url' => array_key_exists('video_url', $data) ? $data['video_url'] : $product->video_url,
            'video_path' => $videoPath,
            'stock' => ($this->tipeKategori($data['category_id']) !== 'produk' || ($data['availability_status'] ?? 'tersedia') === 'preorder') ? 0 : ($data['stock'] ?? 0),
            'meta' => $this->buildMeta($data, $product->meta ?? []),
        ]);

        if ($request->has('opsi') || $request->boolean('opsi_present')) {
            $this->syncOpsi($product, $data['opsi'] ?? [], $request);
        }
        });

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


    /**
     * Sync usulan opsi/add-on dari Pengelola. Hapus opsi yang belum tersimpan.
     */
    private function syncOpsi(Product $product, array $rows, Request $request): void
    {
        $owned = $product->opsi()->get()->keyBy('id');
        $seen = [];
        $keep = [];
        $updates = [];
        $creates = [];

        foreach ($rows as $index => $row) {
            $key = $row['jenis'].'|'.$row['nama'];
            if (isset($seen[$key])) {
                throw ValidationException::withMessages([
                    "opsi.{$index}.nama" => 'Nama opsi tidak boleh sama dalam satu jenis.',
                ]);
            }
            $seen[$key] = true;

            $id = (int) ($row['id'] ?? 0);
            if ($id > 0 && $owned->has($id)) {
                $updates[] = [$id, $row, $index];
                $keep[] = $id;
            } elseif ($id === 0) {
                $creates[] = [$row, $index];
            }
        }

        foreach ($updates as [$id, $row, $index]) {
            $owned->get($id)->update($this->opsiAttributes($row, $index, $request));
        }

        $product->opsi()->whereNotIn('id', $keep)->get()->each->delete();

        foreach ($creates as [$row, $index]) {
            $product->opsi()->create($this->opsiAttributes($row, $index, $request) + ['sumber' => 'pengelola']);
        }
    }

    private function opsiAttributes(array $row, int $index, Request $request): array
    {
        $jenis = $row['jenis'];
        
        // Handle foto upload untuk add-on
        $fotoPath = null;
        if ($request->hasFile("opsi.{$index}.foto")) {
            $fotoPath = $request->file("opsi.{$index}.foto")->store('products/opsi', 'public');
        }
        
        $attributes = [
            'jenis' => $jenis,
            'nama' => $row['nama'],
            'deskripsi' => $row['deskripsi'] ?? null,
            'harga' => $jenis === 'termasuk' ? 0 : (int) ($row['harga'] ?? 0),
            'satuan' => $row['satuan'],
            'qty_min' => (int) ($row['qty_min'] ?? 1),
            'qty_max' => isset($row['qty_max']) && $row['qty_max'] !== '' && $row['qty_max'] !== null ? (int) $row['qty_max'] : null,
            'stok' => isset($row['stok']) && $row['stok'] !== '' && $row['stok'] !== null ? (int) $row['stok'] : null,
            'aktif' => (bool) ($row['aktif'] ?? true),
            'urutan' => (int) ($row['urutan'] ?? 0),
        ];
        
        if ($fotoPath !== null) {
            $attributes['foto'] = $fotoPath;
        }
        
        return $attributes;
    }

}