<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
