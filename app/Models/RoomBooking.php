<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
