<?php

namespace Tests\Feature;

use App\Models\TenantProfile;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantVerificationAndPDPTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $adminRtpu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->adminRtpu = User::factory()->create(['role' => 'admin_rtpu']);
        Storage::fake('local');
    }

    public function test_customer_can_save_tenant_profile_and_encrypt_sensitive_data(): void
    {
        $this->actingAs($this->customer);

        $ktpFile = UploadedFile::fake()->create('ktp-direktur.jpg', 200, 'image/jpeg');

        $res = $this->post(route('customer.tenant.store'), [
            'company_name' => 'PT Solusi Riset Mandiri',
            'nik' => '3276012345678901',
            'npwp' => '01.234.567.8-901.000',
            'ktp' => $ktpFile,
        ]);
        $res->assertSessionHasNoErrors();
        $res->assertRedirect();

        $profile = TenantProfile::where('user_id', $this->customer->id)->firstOrFail();
        $this->assertSame('PT Solusi Riset Mandiri', $profile->company_name);
        $this->assertSame('3276012345678901', $profile->nik);
        $this->assertSame('01.234.567.8-901.000', $profile->npwp);
        $this->assertSame('pending', $profile->verification_status);
        $this->assertNotNull($profile->ktp_path);
        Storage::disk('local')->assertExists($profile->ktp_path);
    }

    public function test_admin_rtpu_can_verify_tenant_profile(): void
    {
        $profile = TenantProfile::create([
            'user_id' => $this->customer->id,
            'company_name' => 'CV Inovasi Bangsa',
            'nik' => '3276098765432100',
            'npwp' => '02.345.678.9-012.000',
            'verification_status' => 'pending',
        ]);

        $this->actingAs($this->adminRtpu);

        $res = $this->patch(route('rtpu.tenants.verify', $profile), [
            'status' => 'valid',
        ]);
        $res->assertRedirect();

        $profile->refresh();
        $this->assertSame('valid', $profile->verification_status);
        $this->assertSame($this->adminRtpu->id, $profile->verified_by);
        $this->assertNotNull($profile->verified_at);
        $this->assertTrue($profile->isValid());
    }

    public function test_admin_rtpu_rejects_tenant_profile_with_note(): void
    {
        $profile = TenantProfile::create([
            'user_id' => $this->customer->id,
            'company_name' => 'CV Belum Lengkap',
            'verification_status' => 'pending',
        ]);

        $this->actingAs($this->adminRtpu);

        $res = $this->patch(route('rtpu.tenants.verify', $profile), [
            'status' => 'invalid',
            'rejection_note' => 'Foto KTP buram dan NPWP tidak valid.',
        ]);
        $res->assertRedirect();

        $profile->refresh();
        $this->assertSame('invalid', $profile->verification_status);
        $this->assertSame('Foto KTP buram dan NPWP tidak valid.', $profile->rejection_note);
        $this->assertFalse($profile->isValid());
    }

    public function test_customer_can_record_pdp_consent(): void
    {
        $this->actingAs($this->customer);

        $res = $this->post(route('customer.pdp.consent'), [
            'agreed' => true,
            'version' => 'v1.1-2026',
        ]);
        $res->assertSessionHasNoErrors();
        $res->assertRedirect();

        $this->customer->refresh();
        $this->assertNotNull($this->customer->pdp_consent_at);
        $this->assertSame('v1.1-2026', $this->customer->pdp_consent_version);
    }
}
