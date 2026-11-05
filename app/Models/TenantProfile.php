<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
