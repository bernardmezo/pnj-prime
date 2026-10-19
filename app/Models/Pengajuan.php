<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pengajuan extends Model
{
    protected $table = 'pengajuan';

    public const FLOW = [
        'Diajukan',
        'Menunggu Pembayaran',
        'Menunggu Verifikasi Pembayaran',
        'Diproses',
        'Selesai',
    ];

    public const CLOSED = ['Selesai', 'Dibatalkan', 'Ditolak'];

    public const NEXT = [
        'Menunggu Verifikasi Pembayaran' => ['Diproses', 'Menunggu Pembayaran'],
        'Diproses' => ['Selesai', 'Dibatalkan'],
        'Diajukan' => ['Menunggu Pembayaran', 'Ditolak'],
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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'pengajuan_id');
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
