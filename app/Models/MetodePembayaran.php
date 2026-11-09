<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nama
 * @property string $tipe
 * @property string $rekening
 * @property string $holder
 * @property string|null $instruksi
 * @property bool $aktif
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereAktif($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereHolder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereInstruksi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereNama($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereRekening($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereTipe($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MetodePembayaran whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class MetodePembayaran extends Model
{
    protected $table = 'metode_pembayaran';

    protected $fillable = ['nama', 'tipe', 'rekening', 'holder', 'instruksi', 'aktif'];

    protected function casts(): array
    {
        return ['aktif' => 'boolean'];
    }
}
