<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

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
        'Diproses' => ['Selesai', 'Dibatalkan'],
    ];

    protected $fillable = [
        'code', 'buyer_id', 'product_id', 'tipe', 'keperluan', 'jumlah',
        'tanggal', 'jam_mulai', 'jam_selesai', 'peserta', 'metode_pengambilan',
        'catatan', 'total', 'status', 'catatan_peninjau', 'dokumen', 'history',
    ];

    protected function casts(): array
    {
        return ['tanggal' => 'date', 'history' => 'array', 'dokumen' => 'array'];
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
}
