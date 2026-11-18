<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    private function kirimPassword(User $user, array $data)
    {
        return $this->actingAs($user)->from('/profile')->put('/password', $data);
    }

    public function test_password_can_be_updated_and_flashes_success(): void
    {
        $user = User::factory()->create();

        $this->kirimPassword($user, ['current_password' => 'password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile')
            ->assertSessionHas('success', 'Kata sandi berhasil diperbarui.');

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $this->kirimPassword($user, ['current_password' => 'wrong-password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/profile');

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_new_password_must_be_at_least_eight_characters(): void
    {
        $user = User::factory()->create();

        $this->kirimPassword($user, ['current_password' => 'password', 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertSessionHasErrors('password');
    }

    public function test_new_password_must_be_confirmed(): void
    {
        $user = User::factory()->create();

        $this->kirimPassword($user, ['current_password' => 'password', 'password' => 'new-password', 'password_confirmation' => 'lain-lain'])
            ->assertSessionHasErrors('password');
    }
}
