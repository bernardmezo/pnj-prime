<?php

namespace App\Http\Controllers\P3M;

use App\Http\Controllers\Controller;
use App\Models\ProdukUnggulan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProdukUnggulanController extends Controller
{
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

    public function index(): Response
    {
        $rows = ProdukUnggulan::where('owner_id', Auth::id())
            ->whereNotIn('status', ['Disetujui', 'Ditolak', 'Dibatalkan'])
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('P3M/ProdukUnggulan/Index', ['daftar' => $rows]);
    }

    public function create(): Response
    {
        return Inertia::render('P3M/ProdukUnggulan/Create');
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
        ]);

        $docs = [];
        foreach ($request->file('dokumen', []) as $file) {
            $path = $file->store('dokumen', 'public');
            $docs[] = [
                'name' => $file->getClientOriginalName(),
                'size' => round($file->getSize() / 1024).' KB',
                'url' => '/storage/'.$path,
            ];
        }

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
            'item' => $this->serialize($produk),
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
        ]);

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
