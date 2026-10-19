<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Immutable snapshot of the options that belonged to a submitted pengajuan.
 * Rows here are frozen at submission time and are never recalculated — an
 * admin editing or deactivating the source Opsi does not change them.
 */
class PengajuanOpsi extends Model
{
    protected $table = 'pengajuan_opsi';

    protected $fillable = [
        'pengajuan_id',
        'opsi_id',
        'jenis',
        'nama',
        'harga',
        'satuan',
        'qty',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
            'qty' => 'integer',
            'subtotal' => 'integer',
        ];
    }

    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class, 'pengajuan_id');
    }

    public function opsi(): BelongsTo
    {
        return $this->belongsTo(Opsi::class, 'opsi_id');
    }
}
