<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $role
 * @property string $fitur_key
 * @property string $aksi
 * @property bool $allowed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereAksi($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereAllowed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereFiturKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Permission whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class Permission extends Model
{
    protected $table = 'permissions';

    public const AKSI = ['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

    protected $fillable = ['role', 'fitur_key', 'aksi', 'allowed'];

    protected function casts(): array
    {
        return ['allowed' => 'boolean'];
    }
}
