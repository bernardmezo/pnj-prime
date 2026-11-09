<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $label
 * @property string $url
 * @property string|null $description
 * @property string|null $icon
 * @property bool $is_active
 * @property bool $open_new_tab
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereIcon($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereOpenNewTab($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExternalLink whereUrl($value)
 *
 * @mixin \Eloquent
 */
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
            'is_active' => 'boolean',
            'open_new_tab' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
