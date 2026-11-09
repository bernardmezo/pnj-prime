<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Immutable snapshot of the options that belonged to a submitted pengajuan.
 *
 * Rows here are frozen at submission time and are never recalculated — an
 * admin editing or deactivating the source Opsi does not change them.
 *
 * @property int $id
 * @property int $pengajuan_id
 * @property int|null $opsi_id
 * @property string $jenis
 * @property string $nama
 * @property int $harga
 * @property string $satuan
 * @property int $qty
 * @property int $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Opsi|null $opsi
 * @property-read Pengajuan $pengajuan
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereHarga($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereJenis($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereNama($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereOpsiId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi wherePengajuanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereQty($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereSatuan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereSubtotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PengajuanOpsi whereUpdatedAt($value)
 *
 * @mixin \Eloquent
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
