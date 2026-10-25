<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\User;
use App\Services\AuditLogger;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogAndReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminRtpu;

    protected User $direktur;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->adminRtpu = User::factory()->create(['role' => 'admin_rtpu']);
        $this->direktur = User::factory()->create(['role' => 'direktur']);
    }

    public function test_audit_logger_records_administrative_actions(): void
    {
        $this->actingAs($this->adminRtpu);

        $log = AuditLogger::log(
            'update_system_policy',
            'Policy',
            99,
            ['active' => false],
            ['active' => true]
        );

        $this->assertInstanceOf(AuditLog::class, $log);
        $this->assertDatabaseHas('audit_logs', [
            'id' => $log->id,
            'user_id' => $this->adminRtpu->id,
            'action' => 'update_system_policy',
            'entity_type' => 'Policy',
            'entity_id' => 99,
        ]);
    }

    public function test_reports_accessible_by_admin_and_direktur(): void
    {
        Order::create([
            'order_number' => 'ORD-REPORT-001',
            'buyer_id' => $this->adminRtpu->id,
            'subtotal' => 2000000,
            'tax_amount' => 220000,
            'total' => 2220000,
            'status' => 'diproses',
            'order_type' => 'b2c',
        ]);

        $this->actingAs($this->adminRtpu);
        $resAdmin = $this->get(route('rtpu.reports'));
        $resAdmin->assertOk();
        $resAdmin->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('summary')
            ->where('summary.total_revenue', 2220000)
            ->where('summary.total_tax', 220000)
        );

        $this->actingAs($this->direktur);
        $resDirektur = $this->get(route('direktur.reports'));
        $resDirektur->assertOk();
        $resDirektur->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('summary')
            ->where('summary.total_revenue', 2220000)
        );
    }
}
