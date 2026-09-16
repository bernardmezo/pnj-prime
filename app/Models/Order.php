<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'buyer_id',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'order_type',
        'buyer_notes',
        'admin_notes',
        'confirmed_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'     => 'integer',
            'tax_amount'   => 'integer',
            'total'        => 'integer',
            'confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function paymentProofs(): HasMany
    {
        return $this->hasMany(PaymentProof::class);
    }

    public function isPaid(): bool
    {
        return in_array($this->status, ['menunggu_verifikasi', 'diproses', 'selesai'], true);
    }

    public function isComplete(): bool
    {
        return $this->status === 'selesai';
    }
}
