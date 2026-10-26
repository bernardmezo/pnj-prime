<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\TaxRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiV1Test extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'email' => 'customer.api@pnjprime.test',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $category = ProductCategory::firstOrCreate(
            ['slug' => 'produk-riset-unggulan'],
            ['name' => 'Produk Riset Unggulan', 'description' => 'Produk riset']
        );

        $taxRate = TaxRate::firstOrCreate(
            ['code' => 'PPN-12'],
            ['name' => 'PPN 12%', 'rate' => 12.00, 'is_active' => true, 'is_default' => true]
        );

        $this->product = Product::create([
            'category_id' => $category->id,
            'tax_rate_id' => $taxRate->id,
            'owner_id' => $this->customer->id,
            'name' => 'Alat Purwarupa API Test',
            'slug' => 'alat-purwarupa-api-test',
            'description' => 'Deskripsi alat purwarupa API',
            'base_price' => 500000,
            'final_price' => 500000,
            'stock' => 10,
            'is_active' => true,
            'curation_status' => 'approved',
        ]);
    }

    public function test_api_health_check_returns_healthy_status(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonPath('status', 'healthy')
            ->assertJsonPath('api_version', 'v1.0.0')
            ->assertJsonPath('database', 'connected');
    }

    public function test_api_catalog_returns_approved_products_with_pagination(): void
    {
        $response = $this->getJson('/api/v1/catalog');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'base_price', 'curation_status'],
                ],
                'meta' => ['current_page', 'total'],
            ]);
    }

    public function test_api_catalog_detail_returns_product_info(): void
    {
        $response = $this->getJson("/api/v1/catalog/{$this->product->slug}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $this->product->id)
            ->assertJsonPath('data.name', 'Alat Purwarupa API Test');
    }

    public function test_api_auth_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $this->customer->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_api_auth_generates_sanctum_bearer_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $this->customer->email,
            'password' => 'password123',
            'device_name' => 'automated-test',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token', 'token_type', 'user']);

        $token = $response->json('token');
        $this->assertNotEmpty($token);

        // Protected /api/v1/auth/me should succeed with Bearer token
        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $meResponse->assertOk()
            ->assertJsonPath('user.email', $this->customer->email);
    }

    public function test_api_quote_engine_calculates_price_and_tax(): void
    {
        $response = $this->postJson('/api/v1/pengajuan/quote', [
            'product_id' => $this->product->id,
            'jumlah_peserta' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'quote' => ['subtotal'],
                    'tax' => ['tax_amount', 'total'],
                ],
            ]);
    }

    public function test_api_pengajuan_creation_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/pengajuan', [
            'tipe' => 'produk',
            'product_id' => $this->product->id,
        ]);

        $response->assertStatus(401);
    }

    public function test_api_pengajuan_creation_and_retrieval(): void
    {
        $token = $this->customer->createToken('test-token')->plainTextToken;

        $storeResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/pengajuan', [
                'tipe' => 'produk',
                'product_id' => $this->product->id,
                'keperluan' => 'Uji coba pemesanan API',
                'jumlah' => '1 unit',
            ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.tipe', 'produk');

        $pengajuanId = $storeResponse->json('data.id');

        $showResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/pengajuan/{$pengajuanId}");

        $showResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $pengajuanId);
    }

    public function test_api_auth_logout_revokes_token(): void
    {
        $token = $this->customer->createToken('revocable-token')->plainTextToken;

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertOk()
            ->assertJsonPath('success', true);

        // Reset auth guards so Sanctum re-authenticates token from database
        $this->app['auth']->forgetGuards();

        // Subsequent call with revoked token must fail
        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $meResponse->assertStatus(401);
    }
}
