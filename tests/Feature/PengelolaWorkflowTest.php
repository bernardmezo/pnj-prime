<?php

namespace Tests\Feature;

use App\Models\PengelolaApplication;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PengelolaWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $this->superAdmin = User::factory()->superAdmin()->create();
    }

    public function test_customer_can_submit_pengelola_application(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('sk_penunjukan.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->customer)
            ->post(route('customer.pengelola.register.store'), [
                'unit_name' => 'Laboratorium Rekayasa Perangkat Lunak',
                'pic_name' => 'Budi Santoso',
                'pic_phone' => '081234567890',
                'sk_document' => $file,
            ]);

        $response->assertRedirect(route('customer.pengelola.index'));

        $this->assertDatabaseHas('pengelola_applications', [
            'user_id' => $this->customer->id,
            'unit_name' => 'Laboratorium Rekayasa Perangkat Lunak',
            'pic_name' => 'Budi Santoso',
            'status' => 'pending',
        ]);

        $app = PengelolaApplication::where('user_id', $this->customer->id)->first();
        $this->assertNotNull($app->sk_document_path);
        Storage::disk('local')->assertExists($app->sk_document_path);
    }

    public function test_superadmin_can_view_and_approve_pengelola_application(): void
    {
        $app = PengelolaApplication::create([
            'user_id' => $this->customer->id,
            'unit_name' => 'Jurusan Teknik Informatika dan Komputer',
            'pic_name' => 'Dr. Budi Raharjo',
            'phone' => '081122334455',
            'status' => 'pending',
            'sk_document_path' => 'sk_documents/sample.pdf',
        ]);

        $indexRes = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.pengelola.index'));
        $indexRes->assertStatus(200);

        $showRes = $this->actingAs($this->superAdmin)
            ->get(route('superadmin.pengelola.show', $app));
        $showRes->assertStatus(200);

        $approveRes = $this->actingAs($this->superAdmin)
            ->patch(route('superadmin.pengelola.approve', $app), [
                'notes' => 'SK resmi dan terverifikasi oleh Direktur PNJ.',
            ]);

        $approveRes->assertRedirect();

        $freshApp = $app->fresh();
        $this->assertEquals('approved', $freshApp->status);
        $this->assertEquals($this->superAdmin->id, $freshApp->verified_by);

        $freshUser = $this->customer->fresh();
        $this->assertEquals('admin_pengelola', $freshUser->role);
        $this->assertEquals('Jurusan Teknik Informatika dan Komputer', $freshUser->unit_name);
        $this->assertTrue($freshUser->isAdminPengelola());
    }

    public function test_superadmin_can_reject_pengelola_application(): void
    {
        $app = PengelolaApplication::create([
            'user_id' => $this->customer->id,
            'unit_name' => 'Unit Non-resmi',
            'pic_name' => 'Oknum Anonim',
            'phone' => '0800000000',
            'status' => 'pending',
        ]);

        $rejectRes = $this->actingAs($this->superAdmin)
            ->patch(route('superadmin.pengelola.reject', $app), [
                'notes' => 'Dokumen SK tidak valid.',
            ]);

        $rejectRes->assertRedirect();

        $freshApp = $app->fresh();
        $this->assertEquals('rejected', $freshApp->status);
        $this->assertEquals('Dokumen SK tidak valid.', $freshApp->notes);

        $freshUser = $this->customer->fresh();
        $this->assertEquals('customer', $freshUser->role);
    }

    public function test_approved_pengelola_can_access_dashboard(): void
    {
        $pengelola = User::factory()->create([
            'role' => 'admin_pengelola',
            'unit_name' => 'Pusat Riset Mekatronika',
        ]);

        $response = $this->actingAs($pengelola)
            ->get(route('pengelola.dashboard'));

        $response->assertStatus(200);
    }

    public function test_customer_cannot_access_pengelola_dashboard(): void
    {
        $response = $this->actingAs($this->customer)
            ->get(route('pengelola.dashboard'));

        $response->assertStatus(403);
    }
}
