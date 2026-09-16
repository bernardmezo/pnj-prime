<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalLink extends Model
{
    protected $fillable = [
        'label',
        'url',
        'description',
        'icon',
        'is_active',
        'open_new_tab',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active'    => 'boolean',
            'open_new_tab' => 'boolean',
            'sort_order'   => 'integer',
        ];
    }
}
