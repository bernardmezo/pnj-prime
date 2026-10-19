<?php

namespace App\Http\Controllers\P3M;

use App\Http\Controllers\Controller;
use App\Models\Opsi;
use App\Models\ProdukUnggulan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin P3M manages the options proposed on their own Produk Unggulan.
 * Produk Unggulan becomes a Produk fisik layanan, so only flat / per_unit
 * units are allowed. Authorization mirrors the sibling ProdukUnggulanController:
 * role:admin_p3m, the produk-unggulan permission, and own-record ownership.
 */
class OpsiController extends Controller
{
    public function index(ProdukUnggulan $produk): Response
    {
        $this->own($produk);

        return Inertia::render('P3M/ProdukUnggulan/Opsi', [
            'produk' => [
                'id' => $produk->id,
                'name' => $produk->name,
                'status' => $produk->status,
            ],
            'opsi' => $produk->opsi()->urut()->get()->map(fn (Opsi $o) => $this->serialize($o))->values(),
            'satuan' => Opsi::satuanUntukTipe('produk'),
            'jenis' => Opsi::JENIS,
        ]);
    }

    public function store(Request $request, ProdukUnggulan $produk)
    {
        $this->own($produk);
        $data = $this->validated($request, $produk);

        $produk->opsi()->create($this->attributes($data) + ['sumber' => 'usulan_p3m']);

        return back()->with('success', 'Usulan opsi ditambahkan.');
    }

    public function update(Request $request, Opsi $opsi)
    {
        $produk = $this->ownerProduk($opsi);
        $data = $this->validated($request, $produk, $opsi);

        $opsi->update($this->attributes($data));

        return back()->with('success', 'Usulan opsi diperbarui.');
    }

    public function destroy(Opsi $opsi)
    {
        $this->ownerProduk($opsi);

        $opsi->delete();

        return back()->with('success', 'Usulan opsi dihapus.');
    }

    private function own(ProdukUnggulan $produk): void
    {
        abort_if($produk->owner_id !== Auth::id(), 403);
    }

    private function ownerProduk(Opsi $opsi): ProdukUnggulan
    {
        $owner = $opsi->opsi;
        abort_unless($owner instanceof ProdukUnggulan, 404);
        $this->own($owner);

        return $owner;
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ProdukUnggulan $produk, ?Opsi $ignore = null): array
    {
        $unique = Rule::unique('opsi', 'nama')
            ->where('opsi_type', ProdukUnggulan::class)
            ->where('opsi_id', $produk->id)
            ->where('jenis', $request->input('jenis'));

        if ($ignore) {
            $unique->ignore($ignore->id);
        }

        return $request->validate([
            'jenis' => ['required', Rule::in(Opsi::JENIS)],
            'nama' => ['required', 'string', 'max:255', $unique],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'harga' => ['nullable', 'integer', 'min:0', 'max:10000000000'],
            'satuan' => ['required', Rule::in(Opsi::satuanUntukTipe('produk'))],
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
