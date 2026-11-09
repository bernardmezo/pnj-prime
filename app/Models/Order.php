<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $order_number
 * @property int $buyer_id
 * @property int $subtotal
 * @property int $tax_amount
 * @property int $total
 * @property string $status
 * @property string|null $order_type
 * @property string|null $buyer_notes
 * @property string|null $admin_notes
 * @property Carbon|null $confirmed_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property int|null $pengajuan_id
 * @property int|null $tax_rate_id
 * @property numeric|null $tax_rate_snapshot
 * @property string|null $tax_name_snapshot
 * @property-read User $buyer
 * @property-read Collection<int, OrderItem> $items
 * @property-read int|null $items_count
 * @property-read Collection<int, PaymentProof> $paymentProofs
 * @property-read int|null $payment_proofs_count
 * @property-read Pengajuan|null $pengajuan
 * @property-read TaxRate|null $taxRate
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereAdminNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereBuyerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereBuyerNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereCompletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereConfirmedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereOrderNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereOrderType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order wherePengajuanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereSubtotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereTaxAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereTaxNameSnapshot($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereTaxRateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereTaxRateSnapshot($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereTotal($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Order withoutTrashed()
 *
 * @mixin \Eloquent
 */
class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'buyer_id',
        'pengajuan_id',
        'subtotal',
        'tax_rate_id',
        'tax_rate_snapshot',
        'tax_name_snapshot',
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
            'subtotal' => 'integer',
            'tax_amount' => 'integer',
            'total' => 'integer',
            'confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class, 'pengajuan_id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id');
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
