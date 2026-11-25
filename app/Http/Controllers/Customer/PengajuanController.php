<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Services\ConfirmPaidPengajuan;
use App\Services\ManualPreorderPayment;
use App\Services\MidtransService;
use App\Services\PengajuanWorkflow;
use App\Services\PricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanController extends Controller
{
    public function __construct(
        private PricingService $pricing,
        private MidtransService $midtrans,
    ) {}

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
            'kebutuhan_detail' => $p->kebutuhan_detail,
            'tanggal' => optional($p->tanggal)->format('Y-m-d'),
            'peserta' => $p->peserta,
            'jam_mulai' => $p->jam_mulai,
            'jam_selesai' => $p->jam_selesai,
            'rental_start' => optional($p->rental_start)?->format('Y-m-d\\TH:i'),
            'rental_end' => optional($p->rental_end)?->format('Y-m-d\\TH:i'),
            'reschedule_required' => (bool) $p->reschedule_required,
            'reschedule_reason' => $p->reschedule_reason,
            'operational_days' => $p->product?->meta['operational_days'] ?? [1, 2, 3, 4, 5],
            'operational_start' => $p->product?->meta['operational_start'] ?? '08:00',
            'operational_end' => $p->product?->meta['operational_end'] ?? '16:00',
            'metode_pengambilan' => $p->metode_pengambilan,
            'catatan' => $p->catatan,
            'total' => $p->total,
            'note' => $p->catatan_peninjau,
            'history' => $p->history ?? [],
            'pickup' => $p->pickupDetails(),
            'shipment' => $p->shipmentDetails(),
            'jasa' => $p->jasaDetails(),
            'invoice_url' => in_array($p->latestInvoice?->status, ['issued', 'paid'], true) ? route('customer.pengajuan.invoice', $p) : null,
            'invoice_locked' => in_array($p->latestInvoice?->status, ['draft', 'issued', 'paid'], true),
            'invoice' => $p->latestInvoice?->only(['invoice_number', 'total', 'status', 'due_at']),
            'payment_method' => $p->payments?->where('status', 'paid')->first()?->payment_type ?? $p->order?->paymentProofs?->where('verification_status', 'verified')->first()?->notes,
            'paid_at' => optional($p->payments?->where('status', 'paid')->first()?->paid_at ?? $p->order?->confirmed_at)->format('Y-m-d H:i'),
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
        $user = auth()->user();
        $canSeeInternal = $user && $user->isCivitasPnj();

        $layananQuery = Product::with(['category', 'opsi' => fn ($q) => $q->where('aktif', true)->urut()])
            ->where('curation_status', 'approved')
            ->where('is_active', true);

        if (! $canSeeInternal) {
            $layananQuery->where('target_audience', 'publik');
        }

        $layanan = $layananQuery->orderBy('name')
            ->get(['id', 'name', 'slug', 'category_id', 'target_audience', 'final_price', 'thumbnail', 'meta'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->layananTipe(),
                'price' => $p->final_price,
                'satuan' => $p->layananSatuan(),
                'weight' => (int) ($p->meta['weight'] ?? 1000),
                'operational_days' => $p->meta['operational_days'] ?? [1, 2, 3, 4, 5],
                'operational_start' => $p->meta['operational_start'] ?? '08:00',
                'operational_end' => $p->meta['operational_end'] ?? '16:00',
                'opsi' => $this->opsiPayload($p),
            ]);

        $selectedProductQuery = Product::with(['category', 'opsi' => fn ($q) => $q->where('aktif', true)->urut()])
            ->where('curation_status', 'approved')->where('is_active', true);

        if (! $canSeeInternal) {
            $selectedProductQuery->where('target_audience', 'publik');
        }

        $selectedProduct = $request->integer('product_id')
            ? $selectedProductQuery->find($request->integer('product_id'))
            : null;

        return Inertia::render('Customer/Pengajuan/Create', [
            'closedDates' => \App\Models\AcademicCalendarDate::where('type', 'academic_closed')
                ->whereDate('date', '>=', now()->toDateString())->orderBy('date')->get(['date', 'title'])
                ->map(fn ($date) => ['date' => $date->date->format('Y-m-d'), 'title' => $date->title]),
            'layanan' => $layanan,
            'selected' => [
                'product_id' => $selectedProduct?->id,
                'tipe' => $selectedProduct?->layananTipe() ?? ($request->string('tipe')->toString() ?: null),
                'name' => $selectedProduct?->name,
                'price' => $selectedProduct?->final_price,
                'thumbnail' => $selectedProduct?->thumbnail,
                'satuan' => $selectedProduct?->layananSatuan(),
                'weight' => $selectedProduct ? (int) ($selectedProduct->meta['weight'] ?? 1000) : null,
                'operational_days' => $selectedProduct?->meta['operational_days'] ?? [1, 2, 3, 4, 5],
                'operational_start' => $selectedProduct?->meta['operational_start'] ?? '08:00',
                'operational_end' => $selectedProduct?->meta['operational_end'] ?? '16:00',
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

        if (in_array($data['tipe'], ['ruangan', 'alat'], true)) {
            $productForAvailability = Product::findOrFail($data['product_id']);
            $start = \Illuminate\Support\Carbon::parse($data['rental_start']);
            $end = \Illuminate\Support\Carbon::parse($data['rental_end']);
            \App\Services\ServiceAvailability::assertAvailable($productForAvailability, $start, $end);
            if ($productForAvailability->layananSatuan() === 'per_jam') {
                if (! $start->isSameDay($end) || $start->diffInMinutes($end) % 60 !== 0) {
                    throw ValidationException::withMessages(['jadwal' => 'Sewa per jam harus pada hari yang sama dengan durasi dalam jam penuh.']);
                }
                $data['tanggal'] = $start->toDateString();
                $data['jam_mulai'] = $start->format('H:i');
                $data['jam_selesai'] = $end->format('H:i');
            }
        }

        $product = null;
        $quote = null;
        if (! empty($data['product_id'])) {
            $product = Product::with('category')->find($data['product_id']);
            if ($product) {
                // Throws a ValidationException (422 / redirect-back) when a
                // selected addon is foreign, inactive, duplicated or out of range.
                $product->assertAvailableQuantity($data['jumlah'] ?? null);
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

        $pengajuan = new Pengajuan(Arr::except($data, ['opsi', 'renter_data']));
        $pengajuan->buyer_id = Auth::id();
        $pengajuan->dokumen = $docs;
        $pengajuan->renter_data = $data['renter_data'] ?? null;
        $pengajuan->kebutuhan_detail = $this->detailKebutuhan($data);
        if ($pengajuan->tipe === 'jasa' && ! empty($data['tanggal']) && ! empty($data['jam_mulai'])) {
            $pengajuan->jasa_auto_start = true;
            $pengajuan->jadwal_mulai = \Illuminate\Support\Carbon::parse($data['tanggal'].' '.$data['jam_mulai']);
        }
        if ($quote !== null) {
            // Ongkir final dihitung ulang oleh server saat verifikasi RTPU dari RajaOngkir live,
            // bukan dari teks catatan pelanggan.
            $pengajuan->total = $quote['subtotal'];
            if ($pengajuan->isRental()) {
                $pengajuan->rental_billing_duration = $quote['lines'][0]['multiplier'];
                $pengajuan->rental_billing_unit = $quote['lines'][0]['satuan'];
            }
        }
        $pengajuan->code = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) (Pengajuan::max('id') + 1), 4, '0', STR_PAD_LEFT);
        $pengajuan->setStatus('Diajukan');

        // Semua langkah save–reserve dibungkus dalam satu transaksi.
        // Kalau reserve() gagal (bentrok), save() ikut di-rollback.
        DB::transaction(function () use ($quote, $pengajuan) {
            $pengajuan->save();
            if ($quote !== null) {
                $this->pricing->snapshot($pengajuan, $quote);
            }
            if ($pengajuan->isRental() && $pengajuan->product_id) {
                app(\App\Services\RoomBookingService::class)->reserve(
                    $pengajuan->product_id,
                    $pengajuan->id,
                    $pengajuan->rental_start,
                    $pengajuan->rental_end,
                );
            }
        });

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
        $user = auth()->user();
        $canSeeInternal = $user && $user->isCivitasPnj();

        $rule = Rule::exists('products', 'id')
            ->where('curation_status', 'approved')
            ->where('is_active', true);

        if (! $canSeeInternal) {
            $rule->where('target_audience', 'publik');
        }

        return $rule;
    }

    /**
     * @return array<string, mixed>
     */
    private function storeRules(): array
    {
        return [
            'tipe' => 'required|in:jasa,ruangan,produk',
            'product_id' => ['bail', 'required', 'integer', $this->activeCatalogRule(), function ($attribute, $value, $fail) {
                $product = Product::with('category.parent')->find($value);
                if ($product && $product->layananTipe() !== request()->input('tipe')) {
                    $fail('Jenis pengajuan tidak sesuai dengan layanan yang dipilih.');
                    return;
                }
                if ($product && $product->layananTipe() === 'produk'
                    && ($product->meta['availability_status'] ?? 'tersedia') === 'tersedia'
                    && $product->availableStock() < 1) {
                    $fail('Produk ini tidak memiliki stok ready stock. Silakan pilih produk lain.');
                }
            }],
            'keperluan' => 'nullable|string|max:2000',
            'kebutuhan_detail' => 'nullable|array',
            'kebutuhan_detail.jenis_pengujian' => 'nullable|string|max:255',
            'kebutuhan_detail.metode_standar' => 'nullable|string|max:255',
            'kebutuhan_detail.jumlah_sampel' => 'nullable|integer|min:1|max:100000',
            'kebutuhan_detail.uraian_kebutuhan' => 'nullable|string|max:4000',
            'kebutuhan_detail.konsultasi_biaya' => 'nullable|string|max:1000',
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
            // Rental fields (only for tipe = ruangan / alat)
            'rental_start' => 'nullable|required_if:tipe,ruangan,alat|date|after_or_equal:today',
            'rental_end' => 'nullable|required_if:tipe,ruangan,alat|date|after:rental_start',
            'renter_data' => 'nullable|array',
            'renter_data.company_name' => 'nullable|string|max:255',
            'renter_data.npwp' => 'nullable|string|max:30',
            'renter_data.ktp_number' => 'nullable|string|size:16',
            'renter_data.contact_person' => 'nullable|string|max:255',
            'renter_data.contact_phone' => 'nullable|string|max:20',
        ];
    }

    /**
     * Normalize submitted fields into a PricingService selection payload.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function detailKebutuhan(array $data): ?array
    {
        if (($data['tipe'] ?? null) !== 'jasa' || empty($data['kebutuhan_detail']) || ! is_array($data['kebutuhan_detail'])) {
            return null;
        }

        $clean = array_filter(
            Arr::only($data['kebutuhan_detail'], ['jenis_pengujian', 'metode_standar', 'jumlah_sampel', 'uraian_kebutuhan', 'konsultasi_biaya']),
            fn ($v) => $v !== null && $v !== ''
        );

        return $clean === [] ? null : $clean;
    }

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
        $pengajuan->load(['product', 'buyer:id,name', 'opsi', 'payments', 'order.paymentProofs']);

        return Inertia::render('Customer/Pengajuan/Show', [
            'item' => $this->serialize($pengajuan),
        ]);
    }

    public function edit(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak'], true), 403);
        abort_if($pengajuan->invoices()->whereIn('status', ['draft', 'issued', 'paid'])->exists(), 403, 'Pengajuan terkunci karena invoice sudah disiapkan.');
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

        return DB::transaction(function () use ($request, $pengajuan) {
        $pengajuan = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak'], true), 403);
        if ($pengajuan->invoices()->whereIn('status', ['draft', 'issued', 'paid'])->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages(['invoice' => 'Pengajuan terkunci karena invoice sudah disiapkan. Hubungi RTPU untuk membatalkan draf.']);
        }

        $data = $request->validate([
            'keperluan' => 'nullable|string|max:2000',
            'kebutuhan_detail' => 'nullable|array',
            'kebutuhan_detail.jenis_pengujian' => 'nullable|string|max:255',
            'kebutuhan_detail.metode_standar' => 'nullable|string|max:255',
            'kebutuhan_detail.jumlah_sampel' => 'nullable|integer|min:1|max:100000',
            'kebutuhan_detail.uraian_kebutuhan' => 'nullable|string|max:4000',
            'kebutuhan_detail.konsultasi_biaya' => 'nullable|string|max:1000',
            'jumlah' => 'nullable|string|max:100',
            'tanggal' => $request->input('tanggal') === $pengajuan->tanggal?->format('Y-m-d')
                ? 'nullable|date' : 'nullable|date|after_or_equal:today',
            'jam_mulai' => 'nullable|date_format:H:i',
            'jam_selesai' => 'nullable|date_format:H:i|after:jam_mulai',
            'peserta' => 'nullable|integer|min:1|max:10000',
            'metode_pengambilan' => 'nullable|string|max:100',
            'catatan' => 'nullable|string|max:2000',
            'opsi' => 'nullable|array',
            'opsi.*.id' => 'required|integer',
            'opsi.*.qty' => 'nullable|integer|min:1',
        ]);

        $pengajuan->product?->assertAvailableQuantity($data['jumlah'] ?? $pengajuan->jumlah);
        $data['tipe'] = $pengajuan->tipe; // kebutuhan_detail hanya untuk jasa
        $pengajuan->fill(Arr::except($data, ['opsi']));
        if ($pengajuan->jasa_auto_start && (array_key_exists('tanggal', $data) || array_key_exists('jam_mulai', $data))) {
            if (! $pengajuan->tanggal || ! $pengajuan->jam_mulai) {
                throw ValidationException::withMessages([
                    ! $pengajuan->tanggal ? 'tanggal' : 'jam_mulai' => 'Jadwal otomatis membutuhkan tanggal dan jam mulai.',
                ]);
            }
            $pengajuan->jadwal_mulai = \Illuminate\Support\Carbon::parse($pengajuan->tanggal->format('Y-m-d').' '.$pengajuan->jam_mulai);
        }
        $pengajuan->kebutuhan_detail = $this->detailKebutuhan($data);
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
        });
    }

    public function cancel(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak', 'Menunggu Pembayaran'], true), 403);

        $request->validate(['alasan' => 'nullable|string|max:500']);

        DB::transaction(function () use ($request, $pengajuan) {
        $pengajuan = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
        abort_unless(in_array($pengajuan->status, ['Diajukan', 'Ditolak', 'Menunggu Pembayaran'], true), 403);
        $pengajuan->setStatus('Dibatalkan', $request->alasan ?? 'Dibatalkan oleh pemohon.');
        $pengajuan->save();

        if ($pengajuan->order && $pengajuan->order->status === 'menunggu_pembayaran') {
            $pengajuan->order->update(['status' => 'dibatalkan']);
        }

        // Sewa: lepas jadwal yang terkunci agar slot bisa dipesan pengguna lain.
        app(\App\Services\RoomBookingService::class)->releaseForPengajuan($pengajuan->id);

        });

        return redirect()->route('customer.pengajuan.index')
            ->with('success', 'Pengajuan dibatalkan.');
    }

    public function confirmReceipt(Request $request, Pengajuan $pengajuan): RedirectResponse
    {
        $this->authorize('confirmReceipt', $pengajuan);

        app(PengajuanWorkflow::class)->transition(
            $pengajuan,
            'Selesai',
            'Pesanan dikonfirmasi telah diterima oleh customer.',
            $request->user()->name,
        );

        return back()->with('success', 'Terima kasih. Pesanan telah ditandai selesai.');
    }

    /** Jasa: Customer menerima hasil, pesanan selesai. */
    public function confirmJasa(Request $request, Pengajuan $pengajuan): RedirectResponse
    {
        $this->authorize('confirmJasa', $pengajuan);

        $pengajuan->forceFill(['selesai_confirmed_at' => now()])->save();
        $pengajuan->refresh();
        app(PengajuanWorkflow::class)->transition(
            $pengajuan,
            'Selesai',
            'Hasil pengerjaan diterima dan dikonfirmasi oleh customer.',
            $request->user()->name,
        );

        return back()->with('success', 'Terima kasih. Pesanan jasa ditandai selesai. Anda dapat memberi penilaian.');
    }

    /** Jasa: Customer meminta revisi (maksimal Pengajuan::MAX_REVISIONS kali). */
    public function requestRevision(Request $request, Pengajuan $pengajuan): RedirectResponse
    {
        $this->authorize('requestRevision', $pengajuan);

        $data = $request->validate([
            'catatan' => 'required|string|min:5|max:1000',
        ], [
            'catatan.required' => 'Jelaskan bagian yang perlu direvisi.',
            'catatan.min' => 'Penjelasan revisi minimal 5 karakter.',
        ]);

        DB::transaction(function () use ($pengajuan, $request, $data) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            if (! $locked->canRequestRevision()) {
                throw ValidationException::withMessages(['catatan' => 'Batas revisi sudah tercapai atau status pesanan telah berubah.']);
            }
            $locked->revision_count = (int) $locked->revision_count + 1;
            $locked->save();

            app(PengajuanWorkflow::class)->transition(
                $locked,
                'Dikerjakan',
                'Revisi ke-'.$locked->revision_count.' diminta customer: '.trim($data['catatan']),
                $request->user()->name,
            );
        });

        return back()->with('success', 'Permintaan revisi dikirim ke pemilik layanan.');
    }

    /** Jasa: Customer memberi penilaian 1–5 setelah pesanan selesai. Hanya sekali. */
    public function rateJasa(Request $request, Pengajuan $pengajuan): RedirectResponse
    {
        $this->authorize('rateJasa', $pengajuan);

        $data = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'ulasan' => 'nullable|string|max:1000',
        ], [
            'rating.required' => 'Pilih penilaian 1 sampai 5 bintang.',
            'rating.between' => 'Penilaian harus 1 sampai 5.',
        ]);

        // Guard atomik agar rating tidak tertimpa permintaan ganda.
        $updated = Pengajuan::whereKey($pengajuan->id)->whereNull('rating')->update([
            'rating' => $data['rating'],
            'ulasan' => isset($data['ulasan']) ? trim($data['ulasan']) : null,
            'rating_at' => now(),
        ]);
        abort_unless($updated, 403);

        return back()->with('success', 'Terima kasih atas penilaian Anda.');
    }

    public function bayar(Pengajuan $pengajuan): Response
    {
        $this->own($pengajuan);
        $pengajuan->load(['order', 'opsi', 'payments']);

        $isManualInvoice = $pengajuan->isPreorder() || in_array($pengajuan->tipe, ['ruangan', 'alat', 'jasa'], true);
        $manualInvoice = $isManualInvoice ? $pengajuan->invoices()->whereIn('status', ['issued', 'paid'])->latest()->first() : null;
        $order = $pengajuan->order;
        $subtotal = (int) ($order?->subtotal ?? $pengajuan->total ?? 0);
        $ppn = (int) ($order?->tax_amount ?? 0);
        $ongkir = (int) ($order?->shipping_amount ?? 0);
        $latestPayment = $pengajuan->payments()->latest()->first();

        $items = [];
        if ($pengajuan->opsi && $pengajuan->opsi->count() > 0) {
            foreach ($pengajuan->opsi as $op) {
                $items[] = [
                    'nama' => $op->nama,
                    'qty' => $op->qty,
                    'total' => (int) $op->subtotal,
                ];
            }
        }

        return Inertia::render('Customer/Pembayaran', [
            'item' => $this->serialize($pengajuan),
            'manualPreorder' => $isManualInvoice,
            'manualInvoice' => $manualInvoice?->load('lines'),
            'tagihan' => [
                'subtotal' => $subtotal,
                'ppn' => $ppn,
                'ppn_rate' => $order?->tax_rate_snapshot,
                'ongkir' => $ongkir,
                'ongkir_detail' => $order?->shipping_snapshot,
                'total' => (int) ($order?->total ?? ($subtotal + $ppn + $ongkir)),
                'items' => $items,
            ],
            'clientKey' => $isManualInvoice ? '' : $this->midtrans->getClientKey(),
            'isProduction' => $this->midtrans->isProduction(),
            'snapScriptUrl' => $this->midtrans->getSnapScriptUrl(),
            'metode' => MetodePembayaran::where('aktif', true)
                ->orderBy('nama')
                ->get(['id', 'nama as name', 'tipe as type', 'rekening as account', 'holder', 'instruksi as instructions']),
            'latestPayment' => $latestPayment ? [
                'status' => $latestPayment->status,
                'order_id' => $latestPayment->order_id,
                'paid_at' => optional($latestPayment->paid_at)->format('Y-m-d H:i'),
                'payment_type' => $latestPayment->payment_type,
            ] : null,
        ]);
    }

    public function createPayment(Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless($pengajuan->status === 'Menunggu Pembayaran', 403);

        $payment = $this->midtrans->createSnapPayment($pengajuan);

        return response()->json([
            'token' => $payment->snap_token,
            'order_id' => $payment->order_id,
        ]);
    }

    public function paymentStatus(Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        $latestPayment = $pengajuan->payments()->latest()->first();
        abort_if(($pengajuan->isPreorder() || $pengajuan->tipe !== 'produk') && ! $latestPayment, 422, 'Pembayaran ini menggunakan verifikasi transfer manual.');

        // On localhost/dev, webhooks from Midtrans cannot reach localhost directly.
        // If payment is still pending, proactively query Midtrans status API to sync immediately.
        if ($latestPayment && $latestPayment->status === 'pending') {
            try {
                $statusRes = $this->midtrans->getTransactionStatus($latestPayment->order_id);
                app(\App\Services\SyncMidtransPayment::class)->handle($latestPayment, $statusRes);
                $latestPayment->refresh();
                $pengajuan->refresh();
            } catch (\Exception $e) {
                // Ignore API sync errors during polling, fall back to stored DB status
                Log::warning('Payment status sync check error: '.$e->getMessage());
            }
        }

        return response()->json([
            'status' => $pengajuan->status,
            'payment_status' => $latestPayment?->status ?? 'none',
            'paid_at' => optional($latestPayment?->paid_at)->format('Y-m-d H:i'),
            'payment_type' => $latestPayment?->payment_type,
        ]);
    }

    public function proof(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        abort_unless($pengajuan->status === 'Menunggu Pembayaran', 403);

        $request->validate([
            'metode_id' => 'required|integer',
            'bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($pengajuan->isPreorder() || in_array($pengajuan->tipe, ['ruangan', 'alat', 'jasa'], true)) {
            app(ManualPreorderPayment::class)->upload($pengajuan, $request->user(), (int) $request->metode_id, $request->file('bukti'));

            return redirect()->route('customer.pengajuan.show', $pengajuan)->with('success', 'Bukti transfer BLU dikirim, menunggu verifikasi RTPU.');
        }
        $request->validate(['metode_id' => 'exists:metode_pembayaran,id']);
        $path = null;
        try {
            DB::transaction(function () use ($pengajuan, $request, &$path) {
                if (DB::getDriverName() === 'sqlite') {
                    DB::table('pengajuan')->where('id', $pengajuan->id)->update(['id' => DB::raw('id')]);
                }
                $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
                abort_unless($locked->status === 'Menunggu Pembayaran', 403);
                if ($locked->payments()->whereIn('status', ['pending', 'paid'])->exists()) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['payment' => 'Pembayaran Midtrans belum diselesaikan. Hubungi RTPU sebelum transfer manual.']);
                }
                $order = $locked->order()->where('status', 'menunggu_pembayaran')->first();
                if (! $order) {
                    $order = $locked->order()->create([
                        'order_number' => $this->orderNumber($locked), 'buyer_id' => $locked->buyer_id,
                        'subtotal' => $locked->total ?? 0, 'total' => $locked->total ?? 0,
                        'status' => 'menunggu_pembayaran',
                    ]);
                }
                $file = $request->file('bukti');
                $path = $file->store('bukti', 'local');
                PaymentProof::create([
                    'order_id' => $order->id, 'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(), 'mime_type' => $file->getClientMimeType(),
                    'notes' => 'Metode ID: '.$request->metode_id,
                ]);
                $locked->setStatus('Menunggu Verifikasi Pembayaran');
                $locked->save();
                $order->update(['status' => 'menunggu_verifikasi']);
            });
        } catch (\Throwable $e) {
            if ($path) {
                \Illuminate\Support\Facades\Storage::disk('local')->delete($path);
            }
            throw $e;
        }

        return redirect()->route('customer.pengajuan.show', $pengajuan)
            ->with('success', 'Bukti pembayaran terkirim, menunggu verifikasi.');
    }

    public function reschedule(Request $request, Pengajuan $pengajuan)
    {
        $this->own($pengajuan);
        $data = $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after:start',
        ]);
        app(\App\Services\ScheduleReschedule::class)->customerReschedule($pengajuan, $data['start'], $data['end']);

        return back()->with('success', 'Jadwal pengganti berhasil disimpan. Pesanan tetap berjalan.');
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
