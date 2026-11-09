<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $company_name
 * @property string|null $nik
 * @property string|null $npwp
 * @property string|null $ktp_path
 * @property string $verification_status
 * @property string|null $rejection_note
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read User|null $verifier
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereCompanyName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereKtpPath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereNik($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereNpwp($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereRejectionNote($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereVerificationStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TenantProfile whereVerifiedBy($value)
 *
 * @mixin \Eloquent
 */
class TenantProfile extends Model
{
    protected $table = 'tenant_profiles';

    protected $fillable = [
        'user_id',
        'company_name',
        'nik',
        'npwp',
        'ktp_path',
        'verification_status',
        'rejection_note',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'nik' => 'encrypted',
            'npwp' => 'encrypted',
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

    public function isValid(): bool
    {
        return $this->verification_status === 'valid';
    }
}
