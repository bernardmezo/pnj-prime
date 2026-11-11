<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\DatabaseNotificationCollection;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string $role
 * @property string $account_origin
 * @property string|null $phone
 * @property string|null $institution
 * @property string|null $ktp_number
 * @property string|null $npwp_number
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property bool $is_active
 * @property string|null $user_type
 * @property string|null $nik_npwp
 * @property Carbon|null $pdp_consent_at
 * @property string|null $pdp_consent_version
 * @property-read DatabaseNotificationCollection<int, DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read TenantProfile|null $tenantProfile
 * @property-read Collection<int, PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 *
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereAccountOrigin($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereInstitution($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereKtpNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereNikNpwp($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereNpwpNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePdpConsentAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePdpConsentVersion($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUserType($value)
 *
 * @mixin \Eloquent
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
        'nip',
        'jurusan',
        'prodi',
        'institution',
        'ktp_number',
        'npwp_number',
        'pdp_consent_at',
        'pdp_consent_version',
        'account_status',
        'unit_name',
        'unit_id',
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
            'pdp_consent_at' => 'datetime',
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

    public function isAdminPengelola(): bool
    {
        return $this->role === 'admin_pengelola' || $this->role === 'admin_p3m' || $this->role === 'admin_jurusan';
    }

    public function isAdminJurusan(): bool
    {
        return $this->role === 'admin_jurusan';
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

    public function tenantProfile(): HasOne
    {
        return $this->hasOne(TenantProfile::class);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['admin_rtpu', 'admin_p3m', 'admin_pengelola', 'admin_jurusan', 'pimpinan_rtpu', 'direktur', 'super_admin'], true);
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

    public function isCivitasPnj(): bool
    {
        return $this->isStaff()
            || $this->account_origin === 'sso_pnj'
            || in_array($this->role, ['dosen_peneliti', 'mahasiswa'], true)
            || str_ends_with(strtolower($this->email), '@pnj.ac.id');
    }

    public function isInternal(): bool
    {
        return $this->isStaff();
    }

    public function isFromSso(): bool
    {
        return $this->account_origin === 'sso_pnj';
    }

    public function pengelolaApplications(): HasMany
    {
        return $this->hasMany(PengelolaApplication::class, 'user_id');
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
