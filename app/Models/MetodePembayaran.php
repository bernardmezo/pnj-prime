<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetodePembayaran extends Model
{
    protected $table = 'metode_pembayaran';

    protected $fillable = ['nama', 'tipe', 'rekening', 'holder', 'instruksi', 'aktif'];

    protected function casts(): array
    {
        return ['aktif' => 'boolean'];
    }
}
