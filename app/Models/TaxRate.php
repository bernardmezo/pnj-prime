<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property numeric $rate
 * @property string|null $category
 * @property int|null $threshold_amount
 * @property bool $is_active
 * @property Carbon|null $effective_from
 * @property Carbon|null $effective_until
 * @property int|null $updated_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Collection<int, Order> $orders
 * @property-read int|null $orders_count
 * @property-read Collection<int, Product> $products
 * @property-read int|null $products_count
 * @property-read User|null $updater
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereEffectiveFrom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereEffectiveUntil($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereRate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereThresholdAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate whereUpdatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TaxRate withoutTrashed()
 *
 * @mixin \Eloquent
 */
class TaxRate extends Model
{
    use SoftDeletes;

    protected $table = 'tax_rates';

    protected $fillable = [
        'code',
        'name',
        'rate',
        'category',
        'threshold_amount',
        'is_active',
        'effective_from',
        'effective_until',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'threshold_amount' => 'integer',
            'is_active' => 'boolean',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'tax_rate_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'tax_rate_id');
    }
}
