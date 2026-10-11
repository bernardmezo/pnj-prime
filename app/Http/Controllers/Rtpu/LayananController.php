<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LayananController extends Controller
{
    private const TIPE_CATEGORY = [
        'jasa' => 'jasa-layanan',
        'ruangan' => 'sewa-fasilitas',
        'produk' => 'produk-fisik',
    ];

    private function serialize(Product $p): array
    {
        $slug = $p->category?->slug ?? '';
        $type = str_contains($slug, 'jasa') ? 'jasa'
            : (str_contains($slug, 'sewa') || str_contains($slug, 'fasilitas') ? 'ruangan' : 'produk');

        return [
            'id' => $p->id,
            'code' => 'PNJ-'.strtoupper(substr($type, 0, 3)).'-'.str_pad((string) $p->id, 4, '0', STR_PAD_LEFT),
            'name' => $p->name,
            'type' => $type,
            'price' => $p->final_price,
            'status' => $p->is_active ? 'Aktif' : 'Nonaktif',
            'dari_pu' => (bool) $p->produk_unggulan_id,
        ];
    }

    public function index(): Response
    {
        $rows = Product::with('category')->latest()->get()->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Rtpu/Layanan/Index', ['layanan' => $rows]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Rtpu/Layanan/Form', [
            'tipe' => $request->string('tipe')->toString() ?: 'jasa',
            'initial' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipe' => 'required|in:jasa,ruangan,produk',
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:5000',
            'price' => 'required|integer|min:0|max:10000000000',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'facilities' => 'nullable|string|max:2000',
            'category' => 'nullable|string|max:100',
            'stock' => 'nullable|integer|min:0',
            'specs' => 'nullable|string|max:5000',
            'photo' => 'nullable|string|max:500',
            'active' => 'nullable|boolean',
        ]);

        $category = ProductCategory::where('slug', self::TIPE_CATEGORY[$data['tipe']])->firstOrFail();

        Product::create([
            'owner_id' => Auth::id(),
            'category_id' => $category->id,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(6)),
            'short_description' => $data['desc'] ?? null,
            'description' => $data['desc'] ?? null,
            'base_price' => $data['price'],
            'final_price' => $data['price'],
            'stock' => $data['stock'] ?? null,
            'is_active' => (bool) ($data['active'] ?? true),
            'curation_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
            'meta' => [
                'location' => $data['location'] ?? null,
                'capacity' => $data['capacity'] ?? null,
                'facilities' => $data['facilities'] ?? null,
                'category' => $data['category'] ?? null,
                'specs' => $data['specs'] ?? null,
                'photo' => $data['photo'] ?? null,
            ],
        ]);

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan ditambahkan.');
    }

    public function edit(Product $product): Response
    {
        $product->load('category');

        return Inertia::render('Rtpu/Layanan/Form', [
            'tipe' => $this->serialize($product)['type'],
            'initial' => array_merge($this->serialize($product), [
                'desc' => $product->short_description,
                'location' => $product->meta['location'] ?? null,
                'capacity' => $product->meta['capacity'] ?? null,
                'facilities' => $product->meta['facilities'] ?? null,
                'category' => $product->meta['category'] ?? null,
                'stock' => $product->stock,
                'specs' => $product->meta['specs'] ?? null,
                'photo' => $product->meta['photo'] ?? null,
            ]),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:5000',
            'price' => 'required|integer|min:0|max:10000000000',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'facilities' => 'nullable|string|max:2000',
            'category' => 'nullable|string|max:100',
            'stock' => 'nullable|integer|min:0',
            'specs' => 'nullable|string|max:5000',
            'photo' => 'nullable|string|max:500',
            'active' => 'nullable|boolean',
        ]);

        $product->update([
            'name' => $data['name'],
            'short_description' => $data['desc'] ?? null,
            'description' => $data['desc'] ?? null,
            'base_price' => $data['price'],
            'final_price' => $data['price'],
            'stock' => $data['stock'] ?? null,
            'is_active' => (bool) ($data['active'] ?? true),
            'meta' => [
                'location' => $data['location'] ?? null,
                'capacity' => $data['capacity'] ?? null,
                'facilities' => $data['facilities'] ?? null,
                'category' => $data['category'] ?? null,
                'specs' => $data['specs'] ?? null,
                'photo' => $data['photo'] ?? null,
            ],
        ]);

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan diperbarui.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('rtpu.layanan')->with('success', 'Layanan dihapus.');
    }
}
