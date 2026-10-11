<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fitur extends Model
{
    protected $table = 'fitur';

    protected $fillable = ['key', 'nama', 'deskripsi', 'aktif'];

    protected function casts(): array
    {
        return ['aktif' => 'boolean'];
    }

    public function getRouteKeyName(): string
    {
        return 'key';
    }
}
