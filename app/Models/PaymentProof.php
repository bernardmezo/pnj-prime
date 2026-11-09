<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string $file_path
 * @property string $file_name
 * @property string $mime_type
 * @property string $verification_status
 * @property string|null $rejection_reason
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Order|null $order
 * @property-read User|null $verifiedBy
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereOrderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereVerificationStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentProof whereVerifiedBy($value)
 *
 * @mixin \Eloquent
 */
class PaymentProof extends Model
{
    protected $fillable = [
        'order_id',
        'file_path',
        'file_name',
        'mime_type',
        'verification_status',
        'rejection_reason',
        'verified_by',
        'verified_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
