<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property int $pengajuan_id
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property string $status
 * @property Carbon|null $released_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Pengajuan $pengajuan
 * @property-read Product|null $product
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereEndsAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking wherePengajuanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereProductId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereReleasedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereStartsAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|RoomBooking whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class RoomBooking extends Model
{
    protected $table = 'room_bookings';

    protected $fillable = [
        'product_id',
        'pengajuan_id',
        'starts_at',
        'ends_at',
        'status',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class, 'pengajuan_id');
    }

    public function release(): void
    {
        $this->update([
            'status' => 'RELEASED',
            'released_at' => now(),
        ]);
    }
}
