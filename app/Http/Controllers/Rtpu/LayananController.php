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
        $tipe = $request->string('tipe')->toString() ?: 'jasa';

        return Inertia::render('Rtpu/Layanan/Form', [
            'tipe' => $tipe,
            'initial' => null,
            'suggestions' => self::SUGGESTIONS[$tipe] ?? self::SUGGESTIONS['jasa'],
        ]);
    }

    public function store(Request $request)
    {
        $tipe = $request->string('tipe')->toString();
        $data = $request->validate($this->layananRules() + $this->opsiRules($tipe));

        $category = ProductCategory::where('slug', self::TIPE_CATEGORY[$data['tipe']])->firstOrFail();

        DB::transaction(function () use ($data, $category, $request) {
            $product = Product::create([
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
                    'satuan' => $data['satuan'] ?? 'hari',
                ],
            ]);

            // Only touch options when the form actually submits an `opsi` key,
            // so legacy/partial updates never wipe existing options.
            if ($request->has('opsi')) {
                $this->syncOpsi($product, $data['opsi'] ?? []);
            }
        });

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

        DB::transaction(function () use ($product, $data, $request) {
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
                    'satuan' => $data['satuan'] ?? 'hari',
                ],
            ]);

            if ($request->has('opsi')) {
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

    /**
     * @return array<string, mixed>
     */
    private function layananRules(): array
    {
        return [
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

        return [
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
