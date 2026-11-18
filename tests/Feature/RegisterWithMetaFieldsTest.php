<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class RegisterWithMetaFieldsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customer_can_register_with_industri_meta_fields()
    {
        $response = $this->post(route('register'), [
            'registration_type' => 'external',
            'name' => 'PT Jaya Abadi',
            'email' => 'contact@jayaabadi.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'user_type' => 'Industri/Perusahaan',
            'institution' => 'PT Jaya Abadi Indonesia',
            'phone' => '081234567890',
            'terms' => true,
            // Meta fields untuk Industri/Perusahaan
            'npwp_perusahaan' => '12.345.678.9-012.000',
            'penanggung_jawab' => 'Budi Santoso',
            'bidang_usaha' => 'Manufaktur',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::where('email', 'contact@jayaabadi.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('customer', $user->role);
        $this->assertEquals('Industri/Perusahaan', $user->user_type);

        // Verify meta data tersimpan
        $this->assertIsArray($user->meta);
        $this->assertEquals('12.345.678.9-012.000', $user->meta['npwp_perusahaan']);
        $this->assertEquals('Budi Santoso', $user->meta['penanggung_jawab']);
        $this->assertEquals('Manufaktur', $user->meta['bidang_usaha']);
    }

    /** @test */
    public function test_customer_can_register_with_mitra_meta_fields()
    {
        $response = $this->post(route('register'), [
            'registration_type' => 'external',
            'name' => 'Universitas Indonesia',
            'email' => 'kerjasama@ui.ac.id',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'user_type' => 'Mitra kerja sama',
            'institution' => 'Universitas Indonesia',
            'phone' => '021555666',
            'terms' => true,
            // Meta fields untuk Mitra kerja sama
            'nomor_mou_pks' => 'MOU/2024/001',
            'contact_person' => 'Dr. Siti Aminah',
            'periode_kerja_sama' => '2024-2026',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::where('email', 'kerjasama@ui.ac.id')->first();
        $this->assertNotNull($user);
        $this->assertEquals('customer', $user->role);
        $this->assertEquals('Mitra kerja sama', $user->user_type);

        // Verify meta data tersimpan
        $this->assertIsArray($user->meta);
        $this->assertEquals('MOU/2024/001', $user->meta['nomor_mou_pks']);
        $this->assertEquals('Dr. Siti Aminah', $user->meta['contact_person']);
        $this->assertEquals('2024-2026', $user->meta['periode_kerja_sama']);
    }

    /** @test */
    public function test_customer_can_register_without_meta_fields_for_masyarakat_umum()
    {
        $response = $this->post(route('register'), [
            'registration_type' => 'external',
            'name' => 'Ahmad Zaki',
            'email' => 'ahmad@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'user_type' => 'Masyarakat umum',
            'institution' => '',
            'phone' => '081234567890',
            'terms' => true,
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::where('email', 'ahmad@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Masyarakat umum', $user->user_type);

        // Meta seharusnya null karena tidak ada field tambahan
        $this->assertNull($user->meta);
    }

    /** @test */
    public function test_meta_fields_are_optional_and_can_be_partially_filled()
    {
        $response = $this->post(route('register'), [
            'registration_type' => 'external',
            'name' => 'PT Sejahtera',
            'email' => 'info@sejahtera.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'user_type' => 'Industri/Perusahaan',
            'institution' => 'PT Sejahtera Jaya',
            'phone' => '081234567890',
            'terms' => true,
            // Hanya isi sebagian meta fields
            'npwp_perusahaan' => '98.765.432.1-543.000',
            'penanggung_jawab' => '',
            'bidang_usaha' => '',
        ]);

        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', 'info@sejahtera.com')->first();
        $this->assertNotNull($user);

        // Meta hanya berisi field yang diisi
        $this->assertIsArray($user->meta);
        $this->assertArrayHasKey('npwp_perusahaan', $user->meta);
        $this->assertArrayNotHasKey('penanggung_jawab', $user->meta);
        $this->assertArrayNotHasKey('bidang_usaha', $user->meta);
    }

    /** @test */
    public function test_retrieved_user_meta_is_properly_cast_to_array()
    {
        $user = User::create([
            'name' => 'Test Company',
            'email' => 'test@company.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'account_origin' => 'local_simulation',
            'user_type' => 'Industri/Perusahaan',
            'meta' => [
                'npwp_perusahaan' => '11.222.333.4-555.000',
                'penanggung_jawab' => 'John Doe',
                'bidang_usaha' => 'Teknologi',
            ],
        ]);

        // Refresh dari database
        $user->refresh();

        // Assert cast bekerja dengan baik
        $this->assertIsArray($user->meta);
        $this->assertEquals('11.222.333.4-555.000', $user->meta['npwp_perusahaan']);
        $this->assertEquals('John Doe', $user->meta['penanggung_jawab']);
        $this->assertEquals('Teknologi', $user->meta['bidang_usaha']);
    }
}
