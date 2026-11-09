<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $opsi_type
 * @property int $opsi_id
 * @property string $jenis
 * @property string $nama
 * @property string|null $deskripsi
 * @property int $harga
 * @property string $satuan
 * @property int $qty_min
 * @property int|null $qty_max
 * @property int|null $stok
 * @property bool $aktif
 * @property int $urutan
 * @property string $sumber
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Model|\Eloquent $opsi
 *
 * @method static Builder<static>|Opsi aktif()
 * @method static Builder<static>|Opsi newModelQuery()
 * @method static Builder<static>|Opsi newQuery()
 * @method static Builder<static>|Opsi onlyTrashed()
 * @method static Builder<static>|Opsi query()
 * @method static Builder<static>|Opsi urut()
 * @method static Builder<static>|Opsi whereAktif($value)
 * @method static Builder<static>|Opsi whereCreatedAt($value)
 * @method static Builder<static>|Opsi whereDeletedAt($value)
 * @method static Builder<static>|Opsi whereDeskripsi($value)
 * @method static Builder<static>|Opsi whereHarga($value)
 * @method static Builder<static>|Opsi whereId($value)
 * @method static Builder<static>|Opsi whereJenis($value)
 * @method static Builder<static>|Opsi whereNama($value)
 * @method static Builder<static>|Opsi whereOpsiId($value)
 * @method static Builder<static>|Opsi whereOpsiType($value)
 * @method static Builder<static>|Opsi whereQtyMax($value)
 * @method static Builder<static>|Opsi whereQtyMin($value)
 * @method static Builder<static>|Opsi whereSatuan($value)
 * @method static Builder<static>|Opsi whereStok($value)
 * @method static Builder<static>|Opsi whereSumber($value)
 * @method static Builder<static>|Opsi whereUpdatedAt($value)
 * @method static Builder<static>|Opsi whereUrutan($value)
 * @method static Builder<static>|Opsi withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|Opsi withoutTrashed()
 *
 * @mixin \Eloquent
 */
class Opsi extends Model
{
    use SoftDeletes;

    public const JENIS = ['termasuk', 'addon'];

    public const SATUAN = ['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'];

    /**
     * Which units a layanan type may use. Ruangan (sewa fasilitas) may price
     * per day/hour, while jasa and produk are flat or per unit only.
     *
     * @var array<string, array<int, string>>
     */
    public const SATUAN_BY_TIPE = [
        'ruangan' => self::SATUAN,
        'jasa' => ['flat', 'per_unit'],
        'produk' => ['flat', 'per_unit'],
    ];

    protected $table = 'opsi';

    protected $fillable = [
        'opsi_type',
        'opsi_id',
        'jenis',
        'nama',
        'deskripsi',
        'harga',
        'satuan',
        'qty_min',
        'qty_max',
        'stok',
        'aktif',
        'urutan',
        'sumber',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
            'qty_min' => 'integer',
            'qty_max' => 'integer',
            'stok' => 'integer',
            'aktif' => 'boolean',
            'urutan' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // "termasuk" items are free by definition — never trust a posted price.
        static::saving(function (Opsi $opsi) {
            if ($opsi->jenis === 'termasuk') {
                $opsi->harga = 0;
            }
        });
    }

    public function opsi(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('aktif', true);
    }

    public function scopeUrut(Builder $query): Builder
    {
        return $query->orderBy('urutan')->orderBy('id');
    }

    public function isTermasuk(): bool
    {
        return $this->jenis === 'termasuk';
    }

    public function isAddon(): bool
    {
        return $this->jenis === 'addon';
    }

    /**
     * Allowed units for the given layanan type (jasa|ruangan|produk).
     *
     * @return array<int, string>
     */
    public static function satuanUntukTipe(string $tipe): array
    {
        return self::SATUAN_BY_TIPE[$tipe] ?? ['flat', 'per_unit'];
    }
}
