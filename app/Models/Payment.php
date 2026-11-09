<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @method static self create(array $attributes = [])
 *
 * @property int $id
 * @property int $request_id
 * @property string $order_id
 * @property int $gross_amount
 * @property string|null $snap_token
 * @property string $status
 * @property string|null $payment_type
 * @property string|null $transaction_id
 * @property array<array-key, mixed>|null $raw_response
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Pengajuan $request
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereGrossAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereOrderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment wherePaidAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment wherePaymentType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereRawResponse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereRequestId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereSnapToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereTransactionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Payment whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'order_id',
        'gross_amount',
        'snap_token',
        'status',
        'payment_type',
        'transaction_id',
        'raw_response',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'integer',
            'raw_response' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class, 'request_id');
    }
}
