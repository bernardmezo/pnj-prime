<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * @property int $id
 * @property string $code
 * @property int $buyer_id
 * @property int|null $product_id
 * @property string $tipe
 * @property string|null $keperluan
 * @property string|null $jumlah
 * @property Carbon|null $tanggal
 * @property string|null $jam_mulai
 * @property string|null $jam_selesai
 * @property int|null $peserta
 * @property string|null $metode_pengambilan
 * @property string|null $catatan
 * @property int|null $total
 * @property string $status
 * @property string|null $catatan_peninjau
 * @property array<array-key, mixed>|null $history
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property array<array-key, mixed>|null $dokumen
 * @property-read User $buyer
 * @property-read Collection<int, PengajuanOpsi> $opsi
 * @property-read int|null $opsi_count
 * @property-read Order|null $order
 * @property-read Collection<int, Order> $orders
 * @property-read int|null $orders_count
 * @property-read Collection<int, Payment> $payments
 * @property-read int|null $payments_count
 * @property-read Product|null $product
 * @property-read Collection<int, RoomBooking> $roomBookings
 * @property-read int|null $room_bookings_count
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereBuyerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereCatatan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereCatatanPeninjau($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereDokumen($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereHistory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereJamMulai($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereJamSelesai($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereJumlah($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereKeperluan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereMetodePengambilan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan wherePeserta($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereProductId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereTanggal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereTipe($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereTotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Pengajuan whereUpdatedAt($value)
 *
 * @property-read array CLOSED
 *
 * @mixin \Eloquent
 */
class Pengajuan extends Model
{
    protected $table = 'pengajuan';

    protected $hidden = ['collector_name', 'collector_contact', 'handover_photo_path', 'handed_over_by', 'pickup_ready_by'];

    public function isPickup(): bool
    {
        return $this->tipe === 'produk' && str_contains(strtolower($this->metode_pengambilan ?? ''), 'ambil');
    }

    /**
     * Produk yang dikirim via ekspedisi (kebalikan dari ambil di lokasi).
     */
    public function isShipment(): bool
    {
        return $this->tipe === 'produk'
            && $this->metode_pengambilan !== null
            && ! $this->isPickup();
    }

    /**
     * Ringkasan pengiriman kurir untuk pesanan produk "Diantar".
     */
    public function shipmentDetails(): ?array
    {
        if (! $this->isShipment()) {
            return null;
        }

        return [
            'courier_name' => $this->courier_name,
            'tracking_number' => $this->tracking_number,
            'shipped_at' => $this->shipped_at?->format('Y-m-d H:i'),
        ];
    }

    public function pickupDetails(): ?array
    {
        if (! $this->isPickup()) {
            return null;
        }

        return ['ready' => $this->pickup_ready_at !== null,
            'ready_at' => $this->pickup_ready_at?->format('Y-m-d H:i'), 'window' => '08.00–16.00 WIB',
            'collector_name' => $this->collector_name, 'collector_contact' => $this->collector_contact,
            'handed_over_at' => $this->handed_over_at?->format('Y-m-d H:i'),
            'photo_url' => $this->handover_photo_path ? route('pickup.photo', $this) : null];
    }

    public const FLOW = [
        'Diajukan',
        'Menunggu Invoice',
        'Menunggu Pembayaran',
        'Menunggu Verifikasi Pembayaran',
        'Lunas',
        'Diproses',
        'Selesai',
    ];

    public const CLOSED = ['Selesai', 'Dibatalkan', 'Ditolak'];

    public const NEXT = [
        'Diajukan' => ['Menunggu Invoice', 'Menunggu Pembayaran', 'Menunggu Persetujuan Pimpinan', 'Ditolak', 'Dibatalkan'],
        'Menunggu Persetujuan Pimpinan' => ['Menunggu Invoice', 'Menunggu Pembayaran', 'Ditolak', 'Dibatalkan'],
        'Menunggu Invoice' => ['Menunggu Pembayaran', 'Ditolak', 'Dibatalkan'],
        'Menunggu Pembayaran' => ['Menunggu Verifikasi Pembayaran', 'Lunas', 'Dibatalkan'],
        'Menunggu Verifikasi Pembayaran' => ['Lunas', 'Diproses', 'Menunggu Pembayaran', 'Ditolak', 'Dibatalkan'],
        'Lunas' => ['Diproses', 'Dibatalkan'],
        'Diproses' => ['Dikirim', 'Dijadwalkan', 'Selesai', 'Dibatalkan'],
        'Dikirim' => ['Selesai', 'Dibatalkan'],
        // Jasa/test lab: Dijadwalkan -> Dikerjakan -> Hasil Diunggah -> Selesai (atau revisi)
        'Dijadwalkan' => ['Dikerjakan', 'Dibatalkan'],
        'Dikerjakan' => ['Hasil Diunggah', 'Dibatalkan'],
        'Hasil Diunggah' => ['Selesai', 'Dikerjakan', 'Dibatalkan'],
    ];

    /** Batas revisi yang dapat diminta Customer setelah hasil diunggah. */
    public const MAX_REVISIONS = 2;

    protected $fillable = [
        'code', 'buyer_id', 'product_id', 'tipe', 'keperluan', 'kebutuhan_detail', 'jumlah',
        'tanggal', 'jam_mulai', 'jam_selesai', 'peserta', 'metode_pengambilan',
        'catatan', 'total', 'status', 'catatan_peninjau', 'dokumen', 'history',
        'rental_start', 'rental_end', 'renter_data', 'rental_started_at', 'rental_returned_at',
        'courier_name', 'tracking_number', 'shipped_at', 'shipped_by',
        'hasil_files', 'jadwal_mulai', 'jadwal_selesai', 'revision_count',
        'rating', 'ulasan', 'rating_at', 'selesai_confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date', 'history' => 'array', 'dokumen' => 'array',
            'pickup_ready_at' => 'datetime', 'handed_over_at' => 'datetime',
            'renter_data' => 'array', 'kebutuhan_detail' => 'array', 'hasil_files' => 'array',
            'jadwal_mulai' => 'datetime', 'jadwal_selesai' => 'datetime',
            'rating_at' => 'datetime', 'selesai_confirmed_at' => 'datetime',
            'rental_start' => 'datetime',
            'rental_end' => 'datetime',
            'rental_started_at' => 'datetime',
            'rental_returned_at' => 'datetime',
            'shipped_at' => 'datetime',
        ];
    }

    public function save(array $options = [])
    {
        return DB::transaction(function () use ($options) {
            if ($this->exists) {
                $current = static::whereKey($this->id)->lockForUpdate()->firstOrFail();
                if ($this->isDirty('status') && $current->status !== $this->getRawOriginal('status')) {
                    throw ValidationException::withMessages(['status' => 'Status pengajuan telah berubah. Muat ulang halaman.']);
                }
            }
            if ($this->exists && $this->isDirty('status') && $this->status === 'Selesai' && $this->isPickup()
                && (! $this->pickup_ready_at || ! $this->handed_over_at || ! $this->handed_over_by || ! $this->collector_name || ! $this->collector_contact || ! $this->handover_photo_path)) {
                throw ValidationException::withMessages(['status' => 'Pengambilan wajib dilengkapi identitas pengambil dan foto pengambil bersama barang melalui Pesanan Produk.']);
            }
            $saved = parent::save($options);
            if ($saved && in_array($this->status, ['Ditolak', 'Dibatalkan'], true)) {
                $this->invoices()->whereNotNull('bank_snapshot')->whereIn('status', ['draft', 'issued'])->update(['status' => 'cancelled']);
            }

            return $saved;
        });
    }

    /**
     * Pesanan jasa/test lab: tipe jasa. Dipenuhi lewat jadwal, pengerjaan, dan unggah hasil
     * (tanpa ongkir dan stok).
     */
    public function isJasaWork(): bool
    {
        return $this->tipe === 'jasa';
    }

    public function canRequestRevision(): bool
    {
        return $this->isJasaWork() && $this->status === 'Hasil Diunggah'
            && (int) $this->revision_count < self::MAX_REVISIONS;
    }

    /**
     * Ringkasan pengerjaan jasa untuk tampilan (Customer dan Pengelola).
     * File hasil hanya menyertakan nama dan ukuran; unduhan lewat route terproteksi.
     *
     * @return array<string, mixed>|null
     */
    public function jasaDetails(): ?array
    {
        if (! $this->isJasaWork()) {
            return null;
        }

        return [
            'jadwal_mulai' => $this->jadwal_mulai?->format('Y-m-d\TH:i'),
            'jadwal_selesai' => $this->jadwal_selesai?->format('Y-m-d\TH:i'),
            'jadwal_mulai_label' => $this->jadwal_mulai?->locale('id')->translatedFormat('d F Y H:i'),
            'jadwal_selesai_label' => $this->jadwal_selesai?->locale('id')->translatedFormat('d F Y H:i'),
            'files' => collect($this->hasil_files ?? [])->values()->map(fn ($f, $i) => [
                'index' => $i, 'name' => $f['name'] ?? 'berkas', 'size' => $f['size'] ?? null,
            ])->all(),
            'revision_count' => (int) $this->revision_count,
            'revision_left' => max(0, self::MAX_REVISIONS - (int) $this->revision_count),
            'can_request_revision' => $this->canRequestRevision(),
            'rating' => $this->rating,
            'ulasan' => $this->ulasan,
            'rating_at' => $this->rating_at?->format('Y-m-d H:i'),
            'confirmed_at' => $this->selesai_confirmed_at?->format('Y-m-d H:i'),
        ];
    }

    public function isPreorder(): bool
    {
        return $this->tipe === 'produk' && (
            $this->latestInvoice?->bank_snapshot !== null
            || ($this->product?->meta['availability_status'] ?? null) === 'preorder'
        );
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function order(): HasOne
    {
        return $this->hasOne(Order::class, 'pengajuan_id');
    }

    public function opsi(): HasMany
    {
        return $this->hasMany(PengajuanOpsi::class, 'pengajuan_id');
    }

    public function roomBookings(): HasMany
    {
        return $this->hasMany(RoomBooking::class, 'pengajuan_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'pengajuan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'request_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'pengajuan_id');
    }

    public function latestInvoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'pengajuan_id')->latestOfMany();
    }

    public function pushHistory(string $status, ?string $note = null, ?string $by = null): void
    {
        $history = $this->history ?? [];
        $history[] = [
            'from' => $this->status,
            'status' => $status,
            'at' => now()->format('Y-m-d H:i'),
            'note' => $note,
            'by' => $by,
        ];
        $this->history = $history;
    }

    public function setStatus(string $status, ?string $note = null, ?string $by = null): void
    {
        $this->pushHistory($status, $note, $by);
        $this->status = $status;
    }

    /**
     * Check if this pengajuan is a rental (sewa).
     */
    public function isRental(): bool
    {
        return in_array($this->tipe, ['ruangan', 'alat'], true) && $this->rental_start && $this->rental_end;
    }

    /**
     * Check if rental period conflicts with existing bookings for the same product.
     * Returns conflicting Pengajuan if found, null otherwise.
     */
    public function hasRentalConflict(): ?Pengajuan
    {
        if (!$this->isRental() || !$this->product_id) {
            return null;
        }

        // Find conflicting bookings for the same product
        // Conflict: (new_start < existing_end) AND (new_end > existing_start)
        $conflict = static::where('product_id', $this->product_id)
            ->where('id', '!=', $this->id ?? 0) // Exclude self if updating
            ->whereNotIn('status', ['Ditolak', 'Dibatalkan', 'Kedaluwarsa']) // Only active bookings
            ->where('rental_start', '<', $this->rental_end)
            ->where('rental_end', '>', $this->rental_start)
            ->first();

        return $conflict;
    }

    /**
     * Calculate rental duration in days.
     */
    public function rentalDurationDays(): int
    {
        if (!$this->isRental()) {
            return 0;
        }

        return $this->rental_start->diffInDays($this->rental_end) + 1; // +1 to include both start and end day
    }

    /**
     * Calculate rental price (tarif × duration).
     * Tarif should be stored in product->final_price as daily/hourly rate.
     */
    public function calculateRentalPrice(): int
    {
        if (!$this->isRental() || !$this->product) {
            return 0;
        }

        $tarif = $this->product->final_price; // Daily rate
        $duration = $this->rentalDurationDays();

        return $tarif * $duration;
    }
}
