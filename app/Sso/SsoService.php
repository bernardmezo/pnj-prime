<?php

namespace App\Sso;

use App\Models\User;
use Illuminate\Support\Str;

class SsoService
{
    public function __construct(private SsoProvider $provider) {}

    public function provider(): SsoProvider
    {
        return $this->provider;
    }

    /**
     * Find or create the Customer account for an SSO identity.
     *
     * Staff accounts are NEVER created or elevated here: if the email
     * already belongs to a non-customer account, this throws. Only
     * Super Admin (via Kelola User) may create staff accounts.
     *
     * @param  array{name?: string, email: string, external_id?: ?string}  $identity
     */
    public function findOrCreateCustomer(array $identity): User
    {
        $email = Str::lower(trim((string) ($identity['email'] ?? '')));

        if ($email === '') {
            throw new SsoException('SSO tidak mengembalikan alamat email.');
        }

        $existing = User::where('email', $email)->first();

        if ($existing) {
            if ($existing->role !== 'customer') {
                throw new SsoException('Akun staf tidak dapat dibuat atau dinaikkan melalui SSO.');
            }

            return $existing;
        }

        $name = trim((string) ($identity['name'] ?? ''));

        $user = User::create([
            'name' => $name !== '' ? $name : 'Pengguna SSO PNJ',
            'email' => $email,
            'password' => Str::random(40),
            'role' => 'customer',
            'user_type' => 'civitas',
            'account_origin' => 'sso_pnj',
            'is_active' => true,
        ]);

        // email_verified_at is intentionally not mass-assignable.
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }
}
