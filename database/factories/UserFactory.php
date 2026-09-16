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
            'name'             => fake()->name(),
            'email'            => fake()->unique()->safeEmail(),
            'email_verified_at'=> now(),
            'password'         => static::$password ??= Hash::make('password'),
            'role'             => 'eksternal',
            'account_origin'   => 'local_simulation',
            'phone'            => fake()->phoneNumber(),
            'institution'      => null,
            'ktp_number'       => null,
            'npwp_number'      => null,
            'remember_token'   => Str::random(10),
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

    public function dosenPeneliti(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'dosen_peneliti',
        ]);
    }

    public function mahasiswa(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'mahasiswa',
        ]);
    }

    public function eksternal(): static
    {
        return $this->state(fn (array $attributes) => [
            'role'        => 'eksternal',
            'institution' => fake()->company(),
        ]);
    }
}
