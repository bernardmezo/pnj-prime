<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'customer',
            'account_origin' => 'local_simulation',
            'phone' => fake()->phoneNumber(),
            'institution' => null,
            'ktp_number' => null,
            'npwp_number' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    // ---- Role convenience states ----

    public function adminRtpu(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin_rtpu',
        ]);
    }

    // ---- Legacy alias (old value now maps to customer) ----

    public function eksternal(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'customer',
            'institution' => fake()->company(),
        ]);
    }

    // ---- New six-role states ----

    public function customer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'customer',
            'institution' => fake()->company(),
        ]);
    }

    public function adminP3m(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin_p3m',
        ]);
    }

    public function pimpinanRtpu(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'pimpinan_rtpu',
        ]);
    }

    public function direktur(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'direktur',
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'super_admin',
        ]);
    }
}
