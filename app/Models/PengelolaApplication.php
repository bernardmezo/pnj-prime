<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $unit_name
 * @property int|null $unit_id
 * @property string $pic_name
 * @property string|null $pic_nip
 * @property string|null $phone
 * @property string|null $sk_document_path
 * @property string $status
 * @property string|null $rejection_reason
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read User|null $verifier
 *
 * @mixin \Eloquent
 */
class PengelolaApplication extends Model
{
    use HasFactory;

    protected $table = 'pengelola_applications';

    protected $fillable = [
        'user_id',
        'unit_name',
        'unit_id',
        'pic_name',
        'pic_nip',
        'phone',
        'sk_document_path',
        'status',
        'rejection_reason',
        'notes',
        'verified_by',
        'verified_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
