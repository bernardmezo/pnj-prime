<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'account_origin',
        'phone',
        'institution',
        'ktp_number',
        'npwp_number',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'ktp_number',
        'npwp_number',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function isAdminRtpu(): bool
    {
        return $this->role === 'admin_rtpu';
    }

    public function isDosenPeneliti(): bool
    {
        return $this->role === 'dosen_peneliti';
    }

    public function isMahasiswa(): bool
    {
        return $this->role === 'mahasiswa';
    }

    public function isEksternal(): bool
    {
        return $this->role === 'eksternal';
    }

    public function isInternal(): bool
    {
        return in_array($this->role, ['admin_rtpu', 'dosen_peneliti', 'mahasiswa'], true);
    }

    public function isFromSso(): bool
    {
        return $this->account_origin === 'sso_pnj';
    }
}
