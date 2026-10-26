<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanController extends Controller
{
    public function __construct(private PricingService $pricing) {}

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
            'product_id' => $p->product_id,
            'layanan' => $p->product?->name ?? ucfirst($p->tipe),
            'customer' => $p->buyer?->name,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
            'qty' => $p->jumlah,
            'jumlah' => $p->jumlah,
            'need' => $p->keperluan,
            'keperluan' => $p->keperluan,
            'tanggal' => optional($p->tanggal)->format('Y-m-d'),
            'peserta' => $p->peserta,
            'jam_mulai' => $p->jam_mulai,
            'jam_selesai' => $p->jam_selesai,
            'metode_pengambilan' => $p->metode_pengambilan,
            'catatan' => $p->catatan,
            'total' => $p->total,
            'note' => $p->catatan_peninjau,
            'history' => $p->history ?? [],
            'opsi' => collect($p->opsi)->map(fn ($o) => [
                'opsi_id' => $o->opsi_id,
                'jenis' => $o->jenis,
                'nama' => $o->nama,
                'harga' => $o->harga,
                'satuan' => $o->satuan,
                'qty' => $o->qty,
                'subtotal' => $o->subtotal,
            ])->values(),
        ];
    }

    public function index(): Response
    {
        $rows = Pengajuan::with(['product', 'buyer:id,name', 'opsi'])
            ->where('buyer_id', Auth::id())
            ->whereNotIn('status', Pengajuan::CLOSED)
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serialize($p));

        return Inertia::render('Customer/Pengajuan/Index', ['pengajuan' => $rows]);
    }

    public function create(Request $request): Response
    {
        $layanan = Product::with(['category', 'opsi' => fn ($q) => $q->where('aktif', true)->urut()])
            ->where('curation_status', 'approved')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'category_id', 'final_price', 'thumbnail', 'meta'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->layananTipe(),
                'price' => $p->final_price,
                'satuan' => $p->layananSatuan(),
                'opsi' => $this->opsiPayload($p),
            ]);

        $selectedProduct = $request->integer('product_id')
            ? Product::with(['category', 'opsi' => fn ($q) => $q->where('aktif', true)->urut()])
                ->where('curation_status', 'approved')->where('is_active', true)
                ->find($request->integer('product_id'))
            : null;

        return Inertia::render('Customer/Pengajuan/Create', [
            'layanan' => $layanan,
            'selected' => [
                'product_id' => $selectedProduct?->id,
                'tipe' => $request->string('tipe')->toString() ?: null,
                'name' => $selectedProduct?->name,
                'price' => $selectedProduct?->final_price,
                'satuan' => $selectedProduct?->layananSatuan(),
                'opsi' => $selectedProduct ? $this->opsiPayload($selectedProduct) : [],
            ],
        ]);
    }

    /**
     * Public shape of a listing's active options for the create form.
     *
     * @return array<int, array<string, mixed>>
     */
    private function opsiPayload(Product $product): array
    {
        return $product->opsi
            ->where('aktif', true)
            ->map(fn ($o) => [
                'id' => $o->id,
                'jenis' => $o->jenis,
                'nama' => $o->nama,
                'deskripsi' => $o->deskripsi,
                'harga' => $o->harga,
                'satuan' => $o->satuan,
                'qty_min' => $o->qty_min,
                'qty_max' => $o->qty_max,
                'stok' => $o->stok,
            ])
            ->values()
            ->all();
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->storeRules());

        $product = null;
        $quote = null;
        if (! empty($data['product_id'])) {
            $product = Product::with('category')->find($data['product_id']);
            if ($product) {
                // Throws a ValidationException (422 / redirect-back) when a
                // selected addon is foreign, inactive, duplicated or out of range.
                $quote = $this->pricing->quote($product, $this->selection($data));
            }
        }

        $docs = [];
        foreach ($request->file('dokumen', []) as $file) {
            $path = $file->store('dokumen-pengajuan', 'local');
            $docs[] = [
                'name' => $file->getClientOriginalName(),
                'size' => round($file->getSize() / 1024).' KB',
                'path' => $path,
            ];
        }

        $pengajuan = new Pengajuan(Arr::except($data, ['opsi']));
        $pengajuan->buyer_id = Auth::id();
        $pengajuan->dokumen = $docs;
        if ($quote !== null) {
            // Stored total is the pre-tax subtotal (base + addons); PPN is
            // applied on verification, exactly as before.
            $pengajuan->total = $quote['subtotal'];
        }
        $pengajuan->code = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) (Pengajuan::max('id') + 1), 4, '0', STR_PAD_LEFT);
        $pengajuan->setStatus('Diajukan');
        $pengajuan->save();

        if ($quote !== null) {
            $this->pricing->snapshot($pengajuan, $quote);
        }

        return redirect()->route('customer.pengajuan.show', $pengajuan)
            ->with('success', 'Pengajuan berhasil dikirim.');
    }

    /**
     * Preview/quote endpoint for a draft selection. Prices and totals are
     * always derived server-side; any client-sent price is ignored.
     */
    public function hitung(Request $request)
    {
        $data = $request->validate([
            'tipe' => 'required|in:jasa,ruangan,produk',
            'product_id' => ['required', $this->activeCatalogRule()],
            'jumlah' => 'nullable|string|max:100',
            'peserta' => 'nullable|integer|min:1|max:10000',
            'jam_mulai' => 'nullable|date_format:H:i',
            'jam_selesai' => 'nullable|date_format:H:i|after:jam_mulai',
            'opsi' => 'nullable|array',
            'opsi.*.id' => 'required|integer',
            'opsi.*.qty' => 'nullable|integer|min:1',
        ]);

        $product = Product::with('category')->findOrFail($data['product_id']);

        return response()->json($this->pricing->quote($product, $this->selection($data)));
    }

    /**
     * Catalog items a pengajuan may reference: must exist, be approved, and be
     * active (UC-05 include UC-09). Mirrors the create-form query.
     */
    private function activeCatalogRule(): Exists
    {
        return Rule::exists('products', 'id')
            ->where('curation_status', 'approved')
            ->where('is_active', true);
    }

    /**
     * @return array<string, mixed>
     */
    private function storeRules(): array
    {
        return [
            'tipe' => 'required|in:jasa,ruangan,produk',
            'product_id' => ['nullable', $this->activeCatalogRule()],
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
            'opsi' => 'nullable|array',
            'opsi.*.id' => 'required|integer',
            'opsi.*.qty' => 'nullable|integer|min:1',
        ];
    }

    /**
     * Normalize submitted fields into a PricingService selection payload.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function selection(array $data): array
    {
        return [
            'qty' => PricingService::parseQty($data['jumlah'] ?? null),
            'peserta' => isset($data['peserta']) ? (int) $data['peserta'] : null,
            'jam' => PricingService::parseHours($data['jam_mulai'] ?? null, $data['jam_selesai'] ?? null),
            'opsi' => $data['opsi'] ?? [],
        ];
    }

    public function show(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        $pengajuan->load(['product', 'buyer:id,name', 'opsi']);

        return Inertia::render('Customer/Pengajuan/Show', [
            'item' => $this->serialize($pengajuan),
        ]);
    }

    public function edit(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak'], true), 403);
        $pengajuan->load([
            'product.category',
            'product.opsi' => fn ($q) => $q->where('aktif', true)->urut(),
            'opsi',
        ]);

        $product = $pengajuan->product;

        return Inertia::render('Customer/Pengajuan/Edit', [
            'item' => $this->serialize($pengajuan),
            'layanan' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'type' => $product->layananTipe(),
                'price' => $product->final_price,
                'satuan' => $product->layananSatuan(),
                'opsi' => $this->opsiPayload($product),
            ] : null,
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
            'opsi' => 'nullable|array',
            'opsi.*.id' => 'required|integer',
            'opsi.*.qty' => 'nullable|integer|min:1',
        ]);

        $pengajuan->fill(Arr::except($data, ['opsi']));
        if ($pengajuan->status === 'Ditolak') {
            $pengajuan->setStatus('Diajukan', 'Diajukan ulang oleh pemohon.');
        }

        // Only re-quote/re-snapshot when the form actually resubmits its
        // add-on selection, so partial edits (keperluan only) never disturb
        // the frozen snapshot or the stored total.
        if ($request->has('opsi') && $pengajuan->product_id) {
            $product = Product::with('category')->find($pengajuan->product_id);
            if ($product) {
                $quote = $this->pricing->quote($product, [
                    'qty' => PricingService::parseQty($data['jumlah'] ?? $pengajuan->jumlah),
                    'peserta' => isset($data['peserta']) ? (int) $data['peserta'] : $pengajuan->peserta,
                    'jam' => PricingService::parseHours(
                        $data['jam_mulai'] ?? $pengajuan->jam_mulai,
                        $data['jam_selesai'] ?? $pengajuan->jam_selesai,
                    ),
                    'opsi' => $data['opsi'] ?? [],
                ]);

                $pengajuan->total = $quote['subtotal'];
                $pengajuan->save();

                // Snapshots are append-only; a resubmission replaces the
                // previous draft snapshot with the newly quoted one.
                $pengajuan->opsi()->delete();
                $this->pricing->snapshot($pengajuan, $quote);

                return redirect()->route('customer.pengajuan.show', $pengajuan)
                    ->with('success', 'Perubahan tersimpan.');
            }
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
        $pengajuan->load(['order', 'opsi']);

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
        $path = $file->store('bukti', 'local');

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
