<?php

namespace App\Http\Controllers\P3M;

use App\Http\Controllers\Controller;
use App\Models\Opsi;
use App\Models\ProdukUnggulan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProdukUnggulanController extends Controller
{
    /**
     * Starter options offered as "Tambah dari saran" chips on the P3M form.
     * A Produk Unggulan becomes a Produk fisik, so only flat / per_unit.
     *
     * @var array<int, array<string, mixed>>
     */
    private const SUGGESTIONS = [
        ['nama' => 'Kotak kemasan', 'harga' => 0, 'satuan' => 'flat', 'jenis' => 'termasuk'],
        ['nama' => 'Instalasi', 'harga' => 100000, 'satuan' => 'flat', 'jenis' => 'addon'],
        ['nama' => 'Garansi tambahan', 'harga' => 150000, 'satuan' => 'per_unit', 'jenis' => 'addon'],
    ];

    private function own(ProdukUnggulan $p): ProdukUnggulan
    {
        abort_if($p->owner_id !== Auth::id(), 403);

        return $p;
    }

    private function serialize(ProdukUnggulan $p): array
    {
        return [
            'id' => $p->id,
            'code' => $p->code,
            'name' => $p->name,
            'desc' => $p->description,
            'researcher' => $p->researcher,
            'team' => $p->team,
            'category' => $p->category,
            'price' => $p->price,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
            'note' => $p->catatan,
            'documents' => collect($p->documents ?? [])->map(fn ($d, $i) => [
                'name' => $d['name'] ?? 'dokumen',
                'size' => $d['size'] ?? '-',
                'url' => route('berkas.show', ['kind' => 'produk-dokumen', 'id' => $p->id, 'index' => $i]),
            ])->values(),
            'history' => $p->history ?? [],
        ];
    }

    /**
     * Validation for the inline option rows. Units are limited to what a
     * Produk fisik may use (flat / per_unit).
     *
     * @return array<string, mixed>
     */
    private function opsiRules(): array
    {
        return [
            'opsi' => 'sometimes|array|max:40',
            'opsi.*.id' => 'nullable|integer',
            'opsi.*.jenis' => 'required|in:'.implode(',', Opsi::JENIS),
            'opsi.*.nama' => 'required|string|max:255',
            'opsi.*.deskripsi' => 'nullable|string|max:2000',
            'opsi.*.harga' => 'nullable|integer|min:0|max:10000000000',
            'opsi.*.satuan' => 'required|in:'.implode(',', Opsi::satuanUntukTipe('produk')),
            'opsi.*.qty_min' => 'nullable|integer|min:1',
            'opsi.*.qty_max' => 'nullable|integer|min:1',
            'opsi.*.stok' => 'nullable|integer|min:0',
            'opsi.*.aktif' => 'nullable|boolean',
            'opsi.*.urutan' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Create/update/delete diff for a produk unggulan's proposed options,
     * scoped to this record. Foreign ids are silently skipped (owner-scoped).
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function syncOpsi(ProdukUnggulan $produk, array $rows): void
    {
        $owned = $produk->opsi()->get()->keyBy('id');
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
        }

        foreach ($updates as [$id, $row]) {
            $owned->get($id)->update($this->opsiAttributes($row));
        }

        $produk->opsi()->whereNotIn('id', $keep)->get()->each->delete();

        foreach ($creates as $row) {
            $produk->opsi()->create($this->opsiAttributes($row) + ['sumber' => 'usulan_p3m']);
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

    public function index(): Response
    {
        $rows = ProdukUnggulan::where('owner_id', Auth::id())
            ->whereNotIn('status', ['Disetujui', 'Ditolak', 'Dibatalkan'])
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('P3M/ProdukUnggulan/Index', ['daftar' => $rows]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:5000',
            'researcher' => 'nullable|string|max:255',
            'team' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'price' => 'nullable|integer|min:0|max:10000000000',
            'dokumen' => 'nullable|array|max:5',
            'dokumen.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ] + $this->opsiRules());

        $docs = [];
        foreach ($request->file('dokumen', []) as $file) {
            $path = $file->store('dokumen', 'public');
            $docs[] = [
                'name' => $file->getClientOriginalName(),
                'size' => round($file->getSize() / 1024).' KB',
                'url' => '/storage/'.$path,
            ];
        }

        $item = null;
        DB::transaction(function () use ($data, $docs, $request, &$item) {
            $item = new ProdukUnggulan([
                'owner_id' => Auth::id(),
                'name' => $data['name'],
                'description' => $data['desc'] ?? null,
                'researcher' => $data['researcher'] ?? null,
                'team' => $data['team'] ?? null,
                'category' => $data['category'] ?? null,
                'price' => $data['price'] ?? null,
                'documents' => $docs,
            ]);
            $item->code = 'PNJ-PU-'.now()->format('Ymd').'-'.str_pad((string) (ProdukUnggulan::max('id') + 1), 4, '0', STR_PAD_LEFT);
            $item->setStatus('Diajukan');
            $item->save();

            if ($request->has('opsi')) {
                $this->syncOpsi($item, $data['opsi'] ?? []);
            }
        });

        return redirect()->route('p3m.produk.show', $item)
            ->with('success', 'Pengajuan produk unggulan terkirim.');
    }

    public function show(ProdukUnggulan $produk): Response
    {
        $this->own($produk);

        return Inertia::render('P3M/ProdukUnggulan/Show', [
            'item' => $this->serialize($produk),
        ]);
    }

    public function edit(ProdukUnggulan $produk): Response
    {
        $this->own($produk);
        abort_unless(in_array($produk->status, ['Diajukan', 'Ditolak'], true), 403);

        return Inertia::render('P3M/ProdukUnggulan/Edit', [
            'item' => array_merge($this->serialize($produk), [
                'opsi' => $produk->opsi()->urut()->get()->map(fn (Opsi $o) => $this->opsiPayload($o))->values(),
            ]),
            'suggestions' => self::SUGGESTIONS,
        ]);
    }

    public function update(Request $request, ProdukUnggulan $produk)
    {
        $this->own($produk);
        abort_unless(in_array($produk->status, ['Diajukan', 'Ditolak'], true), 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:5000',
            'researcher' => 'nullable|string|max:255',
            'team' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'price' => 'nullable|integer|min:0|max:10000000000',
        ] + $this->opsiRules());

        DB::transaction(function () use ($produk, $data, $request) {
            $produk->fill([
                'name' => $data['name'],
                'description' => $data['desc'] ?? null,
                'researcher' => $data['researcher'] ?? null,
                'team' => $data['team'] ?? null,
                'category' => $data['category'] ?? null,
                'price' => $data['price'] ?? null,
            ]);
            if ($produk->status === 'Ditolak') {
                $produk->setStatus('Diajukan', 'Diajukan ulang oleh Admin P3M.');
            }
            $produk->save();

            if ($request->has('opsi')) {
                $this->syncOpsi($produk, $data['opsi'] ?? []);
            }
        });

        return redirect()->route('p3m.produk.show', $produk)
            ->with('success', 'Perubahan tersimpan.');
    }

    public function cancel(Request $request, ProdukUnggulan $produk)
    {
        $this->own($produk);
        abort_unless(in_array($produk->status, ['Diajukan', 'Ditolak'], true), 403);

        $request->validate(['alasan' => 'nullable|string|max:500']);

        $produk->setStatus('Dibatalkan', $request->alasan ?? 'Dibatalkan oleh pengaju.');
        $produk->save();

        return redirect()->route('p3m.produk.index')
            ->with('success', 'Pengajuan dibatalkan.');
    }

    public function riwayat(): Response
    {
        $rows = ProdukUnggulan::where('owner_id', Auth::id())
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('P3M/Riwayat', ['riwayat' => $rows]);
    }
}
