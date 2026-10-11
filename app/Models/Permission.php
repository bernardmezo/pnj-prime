<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
