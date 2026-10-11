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
        'is_active',
        'account_origin',
        'user_type',
        'nik_npwp',
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
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isAdminRtpu(): bool
    {
        return $this->role === 'admin_rtpu';
    }

    public function isAdminP3m(): bool
    {
        return $this->role === 'admin_p3m';
    }

    public function isPimpinanRtpu(): bool
    {
        return $this->role === 'pimpinan_rtpu';
    }

    public function isDirektur(): bool
    {
        return $this->role === 'direktur';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'], true);
    }

    // ---- Legacy helpers (kept for BC; old values no longer assigned) ----

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
        return $this->isStaff();
    }

    public function isFromSso(): bool
    {
        return $this->account_origin === 'sso_pnj';
    }

    /**
     * Granular RBAC check against the permissions matrix.
     * (Named canDo to avoid colliding with the base Authorizable::can().)
     * Super Admin bypasses everything. Unknown combos deny by default.
     */
    public function canDo(string $fitur, string $aksi = 'Lihat'): bool
    {
        if ($this->role === 'super_admin') {
            return true;
        }

        $key = $this->role.'|'.$fitur.'|'.$aksi;

        if (! array_key_exists($key, static::$permissionCache)) {
            static::$permissionCache[$key] = (bool) Permission::query()
                ->where('role', $this->role)
                ->where('fitur_key', $fitur)
                ->where('aksi', $aksi)
                ->value('allowed');
        }

        return static::$permissionCache[$key];
    }

    /** @var array<string, bool> */
    protected static array $permissionCache = [];

    public static function flushPermissionCache(): void
    {
        static::$permissionCache = [];
    }
}
