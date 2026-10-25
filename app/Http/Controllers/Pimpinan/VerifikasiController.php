<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Services\PengajuanWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class VerifikasiController extends Controller
{
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
            'date' => optional($p->created_at)->format('Y-m-d H:i'),
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
        $rows = ProdukUnggulan::where('status', 'Diajukan')
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Pimpinan/Verifikasi', [
            'antrean' => $rows,
            'selected' => $rows->first(),
        ]);
    }

    public function approve(ProdukUnggulan $produk)
    {
        abort_unless($produk->status === 'Diajukan', 403);

        DB::transaction(function () use ($produk) {
            $layanan = Product::where('produk_unggulan_id', $produk->id)->first();

            if (! $layanan) {
                $category = ProductCategory::where('slug', 'produk-fisik')->where('is_active', true)->first()
                    ?? ProductCategory::where('is_active', true)->orderBy('sort_order')->firstOrFail();

                $docLines = collect($produk->documents ?? [])
                    ->map(fn ($d) => '- '.($d['name'] ?? 'dokumen'))
                    ->implode("\n");

                $layanan = Product::create([
                    'owner_id' => $produk->owner_id,
                    'category_id' => $category->id,
                    'name' => $produk->name,
                    'slug' => Str::slug($produk->name).'-pu-'.$produk->id,
                    'short_description' => Str::limit($produk->description ?? '', 255),
                    'description' => trim(($produk->description ?? '')."\n\nDokumen pendukung:\n".$docLines),
                    'base_price' => (int) ($produk->price ?? 0),
                    'final_price' => (int) ($produk->price ?? 0),
                    'stock' => 0,
                    'is_active' => false,
                    'curation_status' => 'draft',
                    'produk_unggulan_id' => $produk->id,
                    'meta' => ['category' => $produk->category, 'team' => $produk->team, 'researcher' => $produk->researcher],
                ]);

                // Carry the options proposed with the Produk Unggulan onto the
                // new (inactive) Layanan, tagged as a P3M proposal for RTPU review.
                foreach ($produk->opsi()->urut()->get() as $opsi) {
                    $layanan->opsi()->create([
                        'jenis' => $opsi->jenis,
                        'nama' => $opsi->nama,
                        'deskripsi' => $opsi->deskripsi,
                        'harga' => $opsi->harga,
                        'satuan' => $opsi->satuan,
                        'qty_min' => $opsi->qty_min,
                        'qty_max' => $opsi->qty_max,
                        'stok' => $opsi->stok,
                        'aktif' => $opsi->aktif,
                        'urutan' => $opsi->urutan,
                        'sumber' => 'usulan_p3m',
                    ]);
                }
            }

            $produk->setStatus(
                'Disetujui',
                "Layanan Produk #{$layanan->id} dibuat (nonaktif) untuk review Admin RTPU.",
                Auth::user()->name
            );
            $produk->save();
        });

        return back()->with('success', 'Pengajuan produk unggulan disetujui. Layanan dibuat nonaktif untuk review Admin RTPU.');
    }

    public function reject(Request $request, ProdukUnggulan $produk)
    {
        abort_unless($produk->status === 'Diajukan', 403);

        $request->validate(['catatan' => 'required|string|max:1000']);

        $produk->catatan = $request->catatan;
        $produk->setStatus('Ditolak', $request->catatan, Auth::user()->name);
        $produk->save();

        return back()->with('success', 'Pengajuan ditolak dengan catatan.');
    }

    public function monitor(): Response
    {
        $rows = ProdukUnggulan::latest()->get()->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Pimpinan/Pemantauan', ['produk' => $rows]);
    }

    public function __construct(
        protected PengajuanWorkflow $workflow = new PengajuanWorkflow
    ) {}

    public function pengajuan(): Response
    {
        $rows = Pengajuan::with(['product', 'buyer:id,name', 'opsi'])
            ->where('status', 'Menunggu Persetujuan Pimpinan')
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->tipe,
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'customer' => $p->buyer?->name,
                'date' => optional($p->created_at)->format('Y-m-d H:i'),
                'status' => $p->status,
                'qty' => $p->jumlah,
                'need' => $p->keperluan,
                'total' => $p->total,
                'tanggal' => optional($p->tanggal)->format('Y-m-d'),
                'jam_mulai' => $p->jam_mulai,
                'jam_selesai' => $p->jam_selesai,
                'note' => $p->catatan_peninjau,
                'history' => $p->history ?? [],
            ]);

        return Inertia::render('Pimpinan/Pengajuan', [
            'antrean' => $rows,
            'selected' => $rows->first(),
        ]);
    }

    public function approvePengajuan(Pengajuan $pengajuan)
    {
        $this->workflow->transition(
            $pengajuan,
            'Menunggu Pembayaran',
            'Disetujui oleh Pimpinan RTPU',
            Auth::user()->name
        );

        return back()->with('success', 'Pemesanan ruangan/alat disetujui, tagihan diterbitkan.');
    }

    public function rejectPengajuan(Request $request, Pengajuan $pengajuan)
    {
        $request->validate(['catatan' => 'required|string|max:1000']);

        $this->workflow->transition(
            $pengajuan,
            'Ditolak',
            $request->catatan,
            Auth::user()->name
        );

        return back()->with('success', 'Pemesanan ruangan/alat ditolak.');
    }

    public function riwayat(): Response
    {
        $rows = ProdukUnggulan::latest()->get()->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Pimpinan/Riwayat', ['produk' => $rows]);
    }
}
