<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
