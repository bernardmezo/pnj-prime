<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanController extends Controller
{
    private function own(Pengajuan $p): Pengajuan
    {
        abort_if($p->buyer_id !== Auth::id(), 403);

        return $p;
    }

    private function serialize(Pengajuan $p): array
    {
        return [
            'id' => $p->id,
            'code' => $p->code,
            'type' => $p->tipe,
            'layanan' => $p->product?->name ?? ucfirst($p->tipe),
            'customer' => $p->buyer?->name,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
            'qty' => $p->jumlah,
            'need' => $p->keperluan,
            'tanggal' => optional($p->tanggal)->format('Y-m-d'),
            'total' => $p->total,
            'note' => $p->catatan_peninjau,
            'history' => $p->history ?? [],
        ];
    }

    public function index(): Response
    {
        $rows = Pengajuan::with(['product', 'buyer:id,name'])
            ->where('buyer_id', Auth::id())
            ->whereNotIn('status', Pengajuan::CLOSED)
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Customer/Pengajuan/Index', ['pengajuan' => $rows]);
    }

    public function create(Request $request): Response
    {
        $layanan = Product::with('category')
            ->where('curation_status', 'approved')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'category_id', 'final_price', 'thumbnail'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => str_contains($p->category?->slug ?? '', 'jasa') ? 'jasa'
                    : (str_contains($p->category?->slug ?? '', 'sewa') || str_contains($p->category?->slug ?? '', 'fasilitas') ? 'ruangan' : 'produk'),
                'price' => $p->final_price,
            ]);

        $selectedProduct = $request->integer('product_id')
            ? Product::with('category')->where('curation_status', 'approved')->where('is_active', true)->find($request->integer('product_id'))
            : null;

        return Inertia::render('Customer/Pengajuan/Create', [
            'layanan' => $layanan,
            'selected' => [
                'product_id' => $selectedProduct?->id,
                'tipe' => $request->string('tipe')->toString() ?: null,
                'name' => $selectedProduct?->name,
                'price' => $selectedProduct?->final_price,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipe' => 'required|in:jasa,ruangan,produk',
            'product_id' => 'nullable|exists:products,id',
            'keperluan' => 'nullable|string|max:2000',
            'jumlah' => 'nullable|string|max:100',
            'tanggal' => 'nullable|date|after_or_equal:today',
            'jam_mulai' => 'nullable|date_format:H:i',
            'jam_selesai' => 'nullable|date_format:H:i|after:jam_mulai',
            'peserta' => 'nullable|integer|min:1|max:10000',
            'metode_pengambilan' => 'nullable|string|max:100',
            'catatan' => 'nullable|string|max:2000',
            'dokumen' => 'nullable|array|max:5',
            'dokumen.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $docs = [];
        foreach ($request->file('dokumen', []) as $file) {
            $path = $file->store('dokumen-pengajuan', 'public');
            $docs[] = [
                'name' => $file->getClientOriginalName(),
                'size' => round($file->getSize() / 1024).' KB',
                'url' => '/storage/'.$path,
            ];
        }

        $pengajuan = new Pengajuan($data);
        $pengajuan->buyer_id = Auth::id();
        $pengajuan->dokumen = $docs;
        if ($pengajuan->product_id && ($product = Product::find($pengajuan->product_id))) {
            $qty = 1;
            if (preg_match('/^\d+/', (string) ($data['jumlah'] ?? ''), $m)) {
                $qty = max(1, (int) $m[0]);
            }
            $pengajuan->total = $product->final_price * $qty;
        }
        $pengajuan->code = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) (Pengajuan::max('id') + 1), 4, '0', STR_PAD_LEFT);
        $pengajuan->setStatus('Diajukan');
        $pengajuan->save();

        return redirect()->route('customer.pengajuan.show', $pengajuan)
            ->with('success', 'Pengajuan berhasil dikirim.');
    }

    public function show(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        $pengajuan->load(['product', 'buyer:id,name']);

        return Inertia::render('Customer/Pengajuan/Show', [
            'item' => $this->serialize($pengajuan),
        ]);
    }

    public function edit(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak'], true), 403);

        return Inertia::render('Customer/Pengajuan/Edit', [
            'item' => $this->serialize($pengajuan),
        ]);
    }

    public function update(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak'], true), 403);

        $data = $request->validate([
            'keperluan' => 'nullable|string|max:2000',
            'jumlah' => 'nullable|string|max:100',
            'tanggal' => 'nullable|date|after_or_equal:today',
            'jam_mulai' => 'nullable|date_format:H:i',
            'jam_selesai' => 'nullable|date_format:H:i|after:jam_mulai',
            'peserta' => 'nullable|integer|min:1|max:10000',
            'metode_pengambilan' => 'nullable|string|max:100',
            'catatan' => 'nullable|string|max:2000',
        ]);

        $pengajuan->fill($data);
        if ($pengajuan->status === 'Ditolak') {
            $pengajuan->setStatus('Diajukan', 'Diajukan ulang oleh pemohon.');
        }
        $pengajuan->save();

        return redirect()->route('customer.pengajuan.show', $pengajuan)
            ->with('success', 'Perubahan tersimpan.');
    }

    public function cancel(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak', 'Menunggu Pembayaran'], true), 403);

        $request->validate(['alasan' => 'nullable|string|max:500']);

        $pengajuan->setStatus('Dibatalkan', $request->alasan ?? 'Dibatalkan oleh pemohon.');
        $pengajuan->save();

        if ($pengajuan->order && $pengajuan->order->status === 'menunggu_pembayaran') {
            $pengajuan->order->update(['status' => 'dibatalkan']);
        }

        return redirect()->route('customer.pengajuan.index')
            ->with('success', 'Pengajuan dibatalkan.');
    }

    public function bayar(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        abort_unless($pengajuan->status === 'Menunggu Pembayaran', 403);
        $pengajuan->load('order');

        $order = $pengajuan->order;
        $subtotal = (int) ($order?->subtotal ?? $pengajuan->total ?? 0);
        $ppn = (int) ($order?->tax_amount ?? 0);

        return Inertia::render('Customer/Pembayaran', [
            'item' => $this->serialize($pengajuan),
            'tagihan' => [
                'subtotal' => $subtotal,
                'ppn' => $ppn,
                'total' => (int) ($order?->total ?? ($subtotal + $ppn)),
            ],
            'metode' => MetodePembayaran::where('aktif', true)
                ->orderBy('nama')
                ->get(['id', 'nama as name', 'tipe as type', 'rekening as account', 'holder', 'instruksi as instructions']),
        ]);
    }

    public function proof(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless($pengajuan->status === 'Menunggu Pembayaran', 403);

        $request->validate([
            'metode_id' => 'required|exists:metode_pembayaran,id',
            'bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $order = $pengajuan->order()->where('status', 'menunggu_pembayaran')->first();
        if (! $order) {
            $order = $pengajuan->order()->create([
                'order_number' => $this->orderNumber($pengajuan),
                'buyer_id' => $pengajuan->buyer_id,
                'subtotal' => $pengajuan->total ?? 0,
                'total' => $pengajuan->total ?? 0,
                'status' => 'menunggu_pembayaran',
            ]);
        }

        $file = $request->file('bukti');
        $path = $file->store('bukti', 'public');

        PaymentProof::create([
            'order_id' => $order->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'notes' => 'Metode ID: '.$request->metode_id,
        ]);

        $pengajuan->setStatus('Menunggu Verifikasi Pembayaran');
        $pengajuan->save();
        $order->update(['status' => 'menunggu_verifikasi']);

        return redirect()->route('customer.pengajuan.show', $pengajuan)
            ->with('success', 'Bukti pembayaran terkirim, menunggu verifikasi.');
    }

    private function orderNumber(Pengajuan $pengajuan): string
    {
        $base = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) $pengajuan->id, 4, '0', STR_PAD_LEFT);
        $n = $base;
        $i = 1;
        while (Order::where('order_number', $n)->exists()) {
            $n = $base.'-'.(++$i);
        }

        return $n;
    }
}
