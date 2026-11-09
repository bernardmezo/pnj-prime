<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $key
 * @property string $nama
 * @property string|null $deskripsi
 * @property bool $aktif
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string $grup
 * @property array<array-key, mixed>|null $aksi_tersedia
 * @property int $urutan
 * @property bool $terkunci
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereAksiTersedia($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereAktif($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereDeskripsi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereGrup($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereNama($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereTerkunci($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fitur whereUrutan($value)
 *
 * @mixin \Eloquent
 */
class Fitur extends Model
{
    protected $table = 'fitur';

    /**
     * Fitur that can never be deactivated, deleted, or stripped from the
     * Super Admin (lockout prevention). Mirrored by the `terkunci` column.
     */
    public const PROTECTED = ['pengguna', 'hak-akses', 'fitur'];

    protected $fillable = ['key', 'nama', 'deskripsi', 'aktif', 'grup', 'aksi_tersedia', 'urutan', 'terkunci'];

    protected function casts(): array
    {
        return [
            'aktif' => 'boolean',
            'aksi_tersedia' => 'array',
            'urutan' => 'integer',
            'terkunci' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'key';
    }

    /** Actions this fitur exposes; falls back to the full set for legacy rows. */
    public function actions(): array
    {
        $tersedia = $this->aksi_tersedia;

        return is_array($tersedia) && $tersedia !== [] ? array_values($tersedia) : Permission::AKSI;
    }

    /** True when this fitur is locked (column flag or the PROTECTED constant). */
    public function isProtected(): bool
    {
        return (bool) $this->terkunci || in_array($this->key, self::PROTECTED, true);
    }
}
