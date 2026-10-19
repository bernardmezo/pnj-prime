<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Opsi;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin RTPU manages the "termasuk" / "addon" options attached to a Layanan.
 * Authorization mirrors the sibling LayananController: role:admin_rtpu plus
 * the katalog permission per action.
 */
class OpsiController extends Controller
{
    public function index(Product $product): Response
    {
        $product->load('category');

        return Inertia::render('Rtpu/Layanan/Opsi', [
            'layanan' => [
                'id' => $product->id,
                'name' => $product->name,
                'tipe' => $product->layananTipe(),
            ],
            'opsi' => $product->opsi()->urut()->get()->map(fn (Opsi $o) => $this->serialize($o))->values(),
            'satuan' => Opsi::satuanUntukTipe($product->layananTipe()),
            'jenis' => Opsi::JENIS,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $data = $this->validated($request, $product);

        $product->opsi()->create($this->attributes($data) + ['sumber' => 'admin']);

        return back()->with('success', 'Opsi ditambahkan.');
    }

    public function update(Request $request, Opsi $opsi)
    {
        $product = $this->ownerProduct($opsi);
        $data = $this->validated($request, $product, $opsi);

        $opsi->update($this->attributes($data));

        return back()->with('success', 'Opsi diperbarui.');
    }

    public function destroy(Opsi $opsi)
    {
        $this->ownerProduct($opsi);

        // pengajuan_opsi keeps its price/name snapshot (nullOnDelete FK).
        $opsi->delete();

        return back()->with('success', 'Opsi dihapus.');
    }

    private function ownerProduct(Opsi $opsi): Product
    {
        $owner = $opsi->opsi;
        abort_unless($owner instanceof Product, 404);

        return $owner;
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, Product $product, ?Opsi $ignore = null): array
    {
        $unique = Rule::unique('opsi', 'nama')
            ->where('opsi_type', Product::class)
            ->where('opsi_id', $product->id)
            ->where('jenis', $request->input('jenis'));

        if ($ignore) {
            $unique->ignore($ignore->id);
        }

        return $request->validate([
            'jenis' => ['required', Rule::in(Opsi::JENIS)],
            'nama' => ['required', 'string', 'max:255', $unique],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'harga' => ['nullable', 'integer', 'min:0', 'max:10000000000'],
            'satuan' => ['required', Rule::in(Opsi::satuanUntukTipe($product->layananTipe()))],
            'qty_min' => ['nullable', 'integer', 'min:1'],
            'qty_max' => ['nullable', 'integer', 'gte:qty_min'],
            'stok' => ['nullable', 'integer', 'min:0'],
            'aktif' => ['nullable', 'boolean'],
            'urutan' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        return [
            'jenis' => $data['jenis'],
            'nama' => $data['nama'],
            'deskripsi' => $data['deskripsi'] ?? null,
            'harga' => $data['jenis'] === 'termasuk' ? 0 : (int) ($data['harga'] ?? 0),
            'satuan' => $data['satuan'],
            'qty_min' => (int) ($data['qty_min'] ?? 1),
            'qty_max' => isset($data['qty_max']) ? (int) $data['qty_max'] : null,
            'stok' => isset($data['stok']) ? (int) $data['stok'] : null,
            'aktif' => (bool) ($data['aktif'] ?? true),
            'urutan' => (int) ($data['urutan'] ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Opsi $opsi): array
    {
        return [
            'id' => $opsi->id,
            'jenis' => $opsi->jenis,
            'nama' => $opsi->nama,
            'deskripsi' => $opsi->deskripsi,
            'harga' => $opsi->harga,
            'satuan' => $opsi->satuan,
            'qty_min' => $opsi->qty_min,
            'qty_max' => $opsi->qty_max,
            'stok' => $opsi->stok,
            'aktif' => (bool) $opsi->aktif,
            'urutan' => $opsi->urutan,
            'sumber' => $opsi->sumber,
        ];
    }
}
