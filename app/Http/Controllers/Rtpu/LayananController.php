<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Opsi;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LayananController extends Controller
{
    private const TIPE_CATEGORY = [
        'jasa' => 'jasa-layanan',
        'ruangan' => 'sewa-fasilitas',
        'produk' => 'produk-fisik',
    ];

    /**
     * Starter options offered as "Tambah dari saran" chips in the form.
     *
     * @var array<string, array<int, array<string, mixed>>>
     */
    private const SUGGESTIONS = [
        'ruangan' => [
            ['nama' => 'Proyektor', 'harga' => 0, 'satuan' => 'flat', 'jenis' => 'termasuk'],
            ['nama' => 'Sound system', 'harga' => 150000, 'satuan' => 'flat', 'jenis' => 'addon'],
            ['nama' => 'Snack peserta', 'harga' => 25000, 'satuan' => 'per_orang', 'jenis' => 'addon'],
            ['nama' => 'Petugas kebersihan', 'harga' => 200000, 'satuan' => 'per_hari', 'jenis' => 'addon'],
        ],
        'jasa' => [
            ['nama' => 'Alat pelindung diri', 'harga' => 0, 'satuan' => 'flat', 'jenis' => 'termasuk'],
            ['nama' => 'Pengambilan sampel', 'harga' => 100000, 'satuan' => 'flat', 'jenis' => 'addon'],
            ['nama' => 'Laporan tambahan', 'harga' => 50000, 'satuan' => 'per_unit', 'jenis' => 'addon'],
        ],
        'produk' => [
            ['nama' => 'Kotak kemasan', 'harga' => 0, 'satuan' => 'flat', 'jenis' => 'termasuk'],
            ['nama' => 'Instalasi', 'harga' => 100000, 'satuan' => 'flat', 'jenis' => 'addon'],
            ['nama' => 'Garansi tambahan', 'harga' => 150000, 'satuan' => 'per_unit', 'jenis' => 'addon'],
        ],
    ];

    private function serialize(Product $p): array
    {
        $type = $p->layananTipe();

        return [
            'id' => $p->id,
            'code' => 'PNJ-'.strtoupper(substr($type, 0, 3)).'-'.str_pad((string) $p->id, 4, '0', STR_PAD_LEFT),
            'name' => $p->name,
            'type' => $type,
            'price' => $p->final_price,
            'status' => $p->is_active ? 'Aktif' : 'Nonaktif',
            'dari_pu' => (bool) $p->produk_unggulan_id,
            // Data lengkap untuk form edit
            'desc' => $p->short_description,
            'description' => $p->description,
            'photo' => $p->thumbnail ?? ($p->meta['photo'] ?? null),
            'images' => $p->images ?? [],
            'video_url' => $p->video_url,
            'video_path' => $p->video_path,
            'location' => $p->meta['location'] ?? null,
            'capacity' => $p->meta['capacity'] ?? null,
            'facilities' => $p->meta['facilities'] ?? null,
            'category' => $p->meta['category'] ?? null,
            'stock' => $p->stock,
            'specs' => $p->meta['specs'] ?? null,
            'satuan' => $p->meta['satuan'] ?? 'hari',
            'owner_id' => $p->owner_id,
            'cost_price' => $p->cost_price,
        ];
    }

    public function index(): Response
    {
        $rows = Product::with('category.parent')->latest()->get()->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Rtpu/Layanan/Index', ['layanan' => $rows]);
    }

    public function create(Request $request): Response
    {
        $tipe = $request->string('tipe')->toString() ?: 'jasa';

        return Inertia::render('Rtpu/Layanan/Form', [
            'tipe' => $tipe,
            'initial' => null,
            'categories' => $this->categories($tipe),
            'suggestions' => self::SUGGESTIONS[$tipe] ?? self::SUGGESTIONS['jasa'],
        ]);
    }

    public function store(Request $request)
    {
        $tipe = $request->string('tipe')->toString();
        $data = $request->validate($this->layananRules() + $this->opsiRules($tipe));

        // Rule 10: Tarif dan satuan wajib untuk Sewa (ruangan/alat)
        if (in_array($tipe, ['ruangan', 'alat'], true)) {
            $request->validate([
                'satuan' => 'required|in:hari,jam',
            ]);
        }

        $category = isset($data['category_id']) ? ProductCategory::findOrFail($data['category_id']) : ProductCategory::where('slug', self::TIPE_CATEGORY[$data['tipe']])->firstOrFail();
        $this->assertCategoryType($category, $data['tipe']);

        DB::transaction(function () use ($data, $category, $request) {
            $photo = $request->hasFile('photo') ? $request->file('photo')->store('products', 'public') : null;
            $images = array_map(fn ($file) => $file->store('products', 'public'), $request->file('images', []));
            $video = $request->hasFile('video_file') ? $request->file('video_file')->store('products/videos', 'public') : null;
            $product = Product::create([
                'owner_id' => Auth::id(),
                'category_id' => $category->id,
                'name' => $data['name'],
                'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(6)),
                'short_description' => $data['desc'] ?? null,
                'description' => $data['description'] ?? $data['desc'] ?? null,
                'target_audience' => $data['target_audience'] ?? 'publik',
                'base_price' => $data['price'],
                'final_price' => $data['price'],
                'cost_price' => $data['cost_price'] ?? 0,
                'stock' => $data['stock'] ?? null,
                'is_active' => (bool) ($data['active'] ?? true),
                'curation_status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id(),
                'thumbnail' => $photo,
                'images' => $images,
                'video_url' => $data['video_url'] ?? null,
                'video_path' => $video,
                'meta' => array_merge(array_intersect_key($data, array_flip(['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height', 'operational_days', 'operational_start', 'operational_end'])), [
                    'location' => $data['location'] ?? null,
                    'capacity' => $data['capacity'] ?? null,
                    'facilities' => $data['facilities'] ?? null,
                    'category' => $data['category'] ?? null,
                    'specs' => $data['specs'] ?? null,
                    'photo' => $photo,
                    'satuan' => $data['satuan'] ?? 'hari',
                ]),
            ]);

            // Only touch options when the form actually submits an `opsi` key,
            // so legacy/partial updates never wipe existing options.
            if ($request->has('opsi') || $request->boolean('opsi_present')) {
                $this->syncOpsi($product, $data['opsi'] ?? []);
            }
        });

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan ditambahkan.');
    }

    public function edit(Product $product): Response
    {
        $product->load('category.parent');

        return Inertia::render('Rtpu/Layanan/Form', [
            'tipe' => $this->serialize($product)['type'],
            'categories' => $this->categories($product->layananTipe(), $product->category_id),
            'initial' => array_merge($this->serialize($product), [
                'category_id' => $product->category_id,
                'operational_days' => $product->meta['operational_days'] ?? null,
                'operational_start' => $product->meta['operational_start'] ?? null,
                'operational_end' => $product->meta['operational_end'] ?? null,
                'owner_id' => $product->owner_id,
                'cost_price' => $product->cost_price,
                'category_name' => $product->category?->name,
                'category_parent_name' => $product->category?->parent?->name,
                'target_audience' => $product->target_audience,
                'base_price' => $product->base_price,
                'availability_status' => $product->meta['availability_status'] ?? null,
                'preorder_duration' => $product->meta['preorder_duration'] ?? null,
                'weight' => $product->meta['weight'] ?? null,
                'length' => $product->meta['length'] ?? null,
                'width' => $product->meta['width'] ?? null,
                'height' => $product->meta['height'] ?? null,
                'desc' => $product->short_description,
                'location' => $product->meta['location'] ?? null,
                'capacity' => $product->meta['capacity'] ?? null,
                'facilities' => $product->meta['facilities'] ?? null,
                'category' => $product->meta['category'] ?? null,
                'stock' => $product->stock,
                'specs' => $product->meta['specs'] ?? null,
                'photo' => $product->thumbnail ?? $product->meta['photo'] ?? null,
                'satuan' => $product->meta['satuan'] ?? 'hari',
                'opsi' => $product->opsi()->urut()->get()->map(fn (Opsi $o) => $this->opsiPayload($o))->values(),
            ]),
            'suggestions' => self::SUGGESTIONS[$this->serialize($product)['type']] ?? [],
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $tipe = $product->layananTipe();
        $data = $request->validate($this->layananRules() + $this->opsiRules($tipe));
        if ($data['tipe'] !== $tipe) {
            throw ValidationException::withMessages(['tipe' => 'Tipe layanan tidak sesuai.']);
        }
        if (in_array($tipe, ['ruangan', 'alat'], true) && $request->exists('satuan')) {
            $request->validate(['satuan' => 'required|in:hari,jam']);
        }
        if (isset($data['category_id'])) {
            $this->assertCategoryType(ProductCategory::findOrFail($data['category_id']), $tipe);
        }

        if (isset($data['existing_images']) && array_diff($data['existing_images'], $product->images ?? [])) {
            throw ValidationException::withMessages(['existing_images' => 'Foto galeri tidak sesuai dengan layanan ini.']);
        }

        DB::transaction(function () use ($product, $data, $request) {
            $isActivating = ! empty($data['active']) && ! $product->is_active;
            $metaFields = match ($product->layananTipe()) {
                'jasa' => ['location', 'photo'],
                'ruangan' => ['location', 'capacity', 'facilities', 'photo', 'satuan'],
                default => ['category', 'specs', 'photo'],
            };
            $metaFields = array_merge($metaFields, ['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height', 'operational_days', 'operational_start', 'operational_end']);
            $photo = $request->hasFile('photo') ? $request->file('photo')->store('products', 'public') : null;
            if ($photo !== null) {
                $data['photo'] = $photo;
            } else {
                unset($data['photo']);
            }
            $images = $data['existing_images'] ?? ($request->boolean('existing_images_present') ? [] : ($product->images ?? []));
            foreach ($request->file('images', []) as $image) {
                $images[] = $image->store('products', 'public');
            }
            $video = $request->hasFile('video_file') ? $request->file('video_file')->store('products/videos', 'public') : ($request->boolean('remove_video') ? null : $product->video_path);
            $updates = [
                'name' => $data['name'],
                'category_id' => $data['category_id'] ?? $product->category_id,
                'target_audience' => array_key_exists('target_audience', $data) ? $data['target_audience'] : $product->target_audience,
                'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
                'short_description' => array_key_exists('desc', $data) ? $data['desc'] : $product->short_description,
                'stock' => array_key_exists('stock', $data) ? $data['stock'] : $product->stock,
                'is_active' => array_key_exists('active', $data) ? (bool) $data['active'] : $product->is_active,
                'meta' => array_merge($product->meta ?? [], array_intersect_key($data, array_flip($metaFields))),
                'thumbnail' => $photo ?? $product->thumbnail,
                'images' => $images,
                'video_url' => array_key_exists('video_url', $data) ? $data['video_url'] : $product->video_url,
                'video_path' => $video,
            ];

            // Only Admin RTPU can update price. Admin Pengelola can only update info.
            if (Auth::user()->role === 'admin_rtpu') {
                $updates['final_price'] = $data['price'];
                // Harga modal hanya bisa diubah oleh pemilik produk (pengelola yang mengajukannya).
                // Jika admin_rtpu ini bukan pemilik, biarkan cost_price tetap seperti sebelumnya.
                if ($product->owner_id === Auth::id()) {
                    $updates['cost_price'] = $data['cost_price'] ?? $product->cost_price;
                }
            }

            // If this product was spawned from a Produk Unggulan and is now
            // being activated, promote it from 'draft' to 'approved' so it appears
            // in the public catalog.
            if ($product->produk_unggulan_id && $isActivating) {
                $updates['curation_status'] = 'approved';
                $updates['approved_at'] = now();
                $updates['approved_by'] = Auth::id();
            }

            $product->update($updates);

            if ($request->has('opsi') || $request->boolean('opsi_present')) {
                $this->syncOpsi($product, $data['opsi'] ?? []);
            }
        });

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan diperbarui.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan dihapus.');
    }

    private function categories(string $tipe, ?int $currentId = null)
    {
        $slug = self::TIPE_CATEGORY[$tipe] ?? self::TIPE_CATEGORY['jasa'];

        return ProductCategory::query()->with('parent')
            ->where(fn ($q) => $q->where('is_active', true)->orWhere('id', $currentId))
            ->where(fn ($q) => $q->where('slug', $slug)->orWhereHas('parent', fn ($parent) => $parent->where('slug', $slug)))
            ->orderBy('name')->get()->map(fn ($category) => [
                'id' => $category->id, 'name' => $category->name, 'parent_name' => $category->parent?->name,
            ]);
    }

    private function assertCategoryType(ProductCategory $category, string $tipe): void
    {
        if (($category->parent?->slug ?? $category->slug) !== self::TIPE_CATEGORY[$tipe]) {
            throw ValidationException::withMessages(['category_id' => 'Kategori tidak sesuai tipe layanan.']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function layananRules(): array
    {
        return [
            'tipe' => 'required|in:jasa,ruangan,produk',
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:5000',
            'description' => 'nullable|string|max:5000',
            'category_id' => 'sometimes|required|integer|exists:product_categories,id',
            'target_audience' => 'nullable|in:publik,internal_pnj',
            'availability_status' => 'nullable|in:tersedia,preorder',
            'preorder_duration' => 'nullable|string|max:100',
            'weight' => 'nullable|integer|min:1',
            'length' => 'nullable|integer|min:1',
            'width' => 'nullable|integer|min:1',
            'height' => 'nullable|integer|min:1',
            'operational_days' => 'sometimes|required|array|min:1|max:7',
            'operational_days.*' => 'integer|between:1,7|distinct',
            'operational_start' => 'sometimes|required|date_format:H:i',
            'operational_end' => 'sometimes|required|date_format:H:i|after:operational_start',
            'price' => 'required|integer|min:0|max:10000000000',
            'cost_price' => 'nullable|integer|min:0|max:10000000000',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'facilities' => 'nullable|string|max:2000',
            'category' => 'nullable|string|max:100',
            'stock' => 'nullable|integer|min:0',
            'specs' => 'nullable|string|max:5000',
            'photo' => 'nullable|image|max:2048',
            'images' => 'sometimes|array|max:20',
            'images.*' => 'required|image|max:2048',
            'existing_images' => 'sometimes|array|max:20',
            'existing_images.*' => 'required|string',
            'existing_images_present' => 'sometimes|boolean',
            'video_url' => 'nullable|url:http,https|max:255',
            'video_file' => 'nullable|mimes:mp4,mov,avi,wmv|max:51200',
            'remove_video' => 'sometimes|boolean',
            'active' => 'nullable|boolean',
            'satuan' => 'nullable|in:hari,jam',
        ];
    }

    /**
     * Validation for the submitted option rows. Units are limited by layanan tipe.
     *
     * @return array<string, mixed>
     */
    private function opsiRules(string $tipe): array
    {
        return [
            'opsi' => 'sometimes|array|max:40',
            'opsi.*.id' => 'nullable|integer',
            'opsi.*.foto' => 'nullable|image|max:2048',
            'opsi.*.jenis' => 'required|in:'.implode(',', Opsi::JENIS),
            'opsi.*.nama' => 'required|string|max:255',
            'opsi.*.deskripsi' => 'nullable|string|max:2000',
            'opsi.*.harga' => 'nullable|integer|min:0|max:10000000000',
            'opsi.*.satuan' => 'required|in:'.implode(',', Opsi::satuanUntukTipe($tipe)),
            'opsi.*.qty_min' => 'nullable|integer|min:1',
            'opsi.*.qty_max' => 'nullable|integer|min:1',
            'opsi.*.stok' => 'nullable|integer|min:0',
            'opsi.*.aktif' => 'nullable|boolean',
            'opsi.*.urutan' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Create/update/delete diff for a layanan's options, scoped to this owner.
     * Rows with an `id` that belongs to another option are ignored, so a
     * tampered payload can never touch a foreign listing.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function syncOpsi(Product $product, array $rows): void
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
                $updates[] = [$id, $row];
                $keep[] = $id;
            } elseif ($id === 0) {
                $creates[] = $row;
            }
            // A non-zero, non-owned id is silently skipped (owner-scoped).
        }

        foreach ($updates as [$id, $row]) {
            $owned->get($id)->update($this->opsiAttributes($row));
        }

        $product->opsi()->whereNotIn('id', $keep)->get()->each->delete();

        foreach ($creates as $row) {
            $product->opsi()->create($this->opsiAttributes($row) + ['sumber' => 'admin']);
        }
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function opsiAttributes(array $row): array
    {
        $jenis = $row['jenis'];

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
        if (($row['foto'] ?? null) instanceof \Illuminate\Http\UploadedFile) {
            $attributes['foto'] = $row['foto']->store('products/opsi', 'public');
        }

        return $attributes;
    }

    /**
     * @return array<string, mixed>
     */
    private function opsiPayload(Opsi $o): array
    {
        return [
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
        ];
    }
}
