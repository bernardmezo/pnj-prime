<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'category_id',
        'name',
        'slug',
        'short_description',
        'description',
        'thumbnail',
        'base_price',
        'final_price',
        'curation_status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'stock',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_price'  => 'integer',
            'final_price' => 'integer',
            'is_active'   => 'boolean',
            'approved_at' => 'datetime',
            'stock'       => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isApproved(): bool
    {
        return $this->curation_status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->curation_status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->curation_status === 'rejected';
    }

    public function isDraft(): bool
    {
        return $this->curation_status === 'draft';
    }
}
