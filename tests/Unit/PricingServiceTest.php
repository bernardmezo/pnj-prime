<?php

namespace Tests\Unit;

use App\Models\Opsi;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\PricingService;
use App\Services\SettingService;
use Database\Seeders\ProductCategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $rtpu;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProductCategorySeeder::class);

        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'rtpu-price@test.id']);

        $settings = app(SettingService::class);
        $settings->set('ppn_enabled', '1');
        $settings->set('ppn_rate', '11');
        $settings->set('ppn_threshold', '0');
    }

    private function product(string $tipe = 'ruangan', int $price = 550000, ?string $satuan = null): Product
    {
        $slug = ['jasa' => 'jasa-layanan', 'ruangan' => 'sewa-fasilitas', 'produk' => 'produk-fisik'][$tipe];

        return Product::create([
            'owner_id' => $this->rtpu->id,
            'category_id' => ProductCategory::where('slug', $slug)->firstOrFail()->id,
            'name' => "Layanan {$tipe}",
            'slug' => "layanan-{$tipe}-".uniqid(),
            'base_price' => $price,
            'final_price' => $price,
            'curation_status' => 'approved',
            'is_active' => true,
            'meta' => $satuan ? ['satuan' => $satuan] : null,
        ]);
    }

    private function opsi(Product $product, array $attrs): Opsi
    {
        return $product->opsi()->create(array_merge([
            'jenis' => 'addon',
            'nama' => 'Opsi '.uniqid(),
            'harga' => 0,
            'satuan' => 'flat',
            'qty_min' => 1,
            'qty_max' => null,
            'stok' => null,
            'aktif' => true,
            'urutan' => 0,
            'sumber' => 'admin',
        ], $attrs));
    }

    private function quote(Product $product, array $selection): array
    {
        return app(PricingService::class)->quote($product, $selection);
    }

    private function assertQuoteError(Product $product, array $selection, string $key): void
    {
        try {
            $this->quote($product, $selection);
            $this->fail("Expected ValidationException for {$key}");
        } catch (ValidationException $e) {
            $this->assertArrayHasKey($key, $e->errors());
        }
    }

    // ---------- base line per tipe ----------

    public function test_base_line_jasa_is_price_per_unit(): void
    {
        $product = $this->product('jasa', 100000);

        $quote = $this->quote($product, ['qty' => 3]);

        $this->assertSame(300000, $quote['lines'][0]['subtotal']);
        $this->assertSame('per_unit', $quote['lines'][0]['satuan']);
        $this->assertSame(300000, $quote['subtotal']);
        $this->assertSame(33000, $quote['ppn']);
        $this->assertSame(333000, $quote['total']);
    }

    public function test_base_line_produk_is_price_times_qty(): void
    {
        $product = $this->product('produk', 200000);

        $quote = $this->quote($product, ['qty' => 2]);

        $this->assertSame(400000, $quote['lines'][0]['subtotal']);
        $this->assertSame(400000, $quote['subtotal']);
    }

    public function test_base_line_ruangan_per_hari_uses_duration_days(): void
    {
        $product = $this->product('ruangan', 550000, 'hari');

        $quote = $this->quote($product, ['qty' => 2]);

        $this->assertSame('per_hari', $quote['lines'][0]['satuan']);
        $this->assertSame(1100000, $quote['lines'][0]['subtotal']);
    }

    public function test_base_line_ruangan_per_jam_uses_hours(): void
    {
        $product = $this->product('ruangan', 100000, 'jam');

        $quote = $this->quote($product, ['qty' => 1, 'jam' => 3]);

        $this->assertSame('per_jam', $quote['lines'][0]['satuan']);
        $this->assertSame(300000, $quote['lines'][0]['subtotal']);
    }

    // ---------- addon line per satuan ----------

    public function test_addon_flat_multiplier_is_one(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Flat', 'harga' => 150000, 'satuan' => 'flat']);

        $quote = $this->quote($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 1]]]);

        $this->assertSame(150000, $quote['lines'][1]['subtotal']);
        $this->assertSame(250000, $quote['subtotal']);
    }

    public function test_addon_per_unit_multiplies_by_qty(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Per unit', 'harga' => 50000, 'satuan' => 'per_unit']);

        $quote = $this->quote($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 3]]]);

        $this->assertSame(150000, $quote['lines'][1]['subtotal']);
    }

    public function test_addon_per_hari_multiplies_by_days(): void
    {
        $product = $this->product('ruangan', 550000, 'hari');
        $addon = $this->opsi($product, ['nama' => 'Per hari', 'harga' => 100000, 'satuan' => 'per_hari']);

        $quote = $this->quote($product, ['qty' => 2, 'opsi' => [['id' => $addon->id, 'qty' => 1]]]);

        $this->assertSame(200000, $quote['lines'][1]['subtotal']);
    }

    public function test_addon_per_jam_multiplies_by_hours(): void
    {
        $product = $this->product('ruangan', 100000, 'jam');
        $addon = $this->opsi($product, ['nama' => 'Per jam', 'harga' => 80000, 'satuan' => 'per_jam']);

        $quote = $this->quote($product, ['qty' => 1, 'jam' => 3, 'opsi' => [['id' => $addon->id, 'qty' => 1]]]);

        $this->assertSame(240000, $quote['lines'][1]['subtotal']);
    }

    public function test_addon_per_orang_multiplies_by_peserta_and_forces_qty_one(): void
    {
        $product = $this->product('ruangan', 550000, 'hari');
        $addon = $this->opsi($product, ['nama' => 'Snack', 'harga' => 25000, 'satuan' => 'per_orang']);

        $quote = $this->quote($product, [
            'qty' => 1,
            'peserta' => 10,
            'opsi' => [['id' => $addon->id, 'qty' => 5]], // qty is ignored for per_orang
        ]);

        $this->assertSame(250000, $quote['lines'][1]['subtotal']);
        $this->assertSame(1, $quote['lines'][1]['qty']);
    }

    // ---------- termasuk + validation ----------

    public function test_termasuk_is_always_free_and_included_in_breakdown(): void
    {
        $product = $this->product('ruangan', 550000, 'hari');
        $termasuk = $this->opsi($product, [
            'jenis' => 'termasuk', 'nama' => 'Proyektor', 'harga' => 99999, 'satuan' => 'flat',
        ]);

        $this->assertSame(0, $termasuk->fresh()->harga); // model hook forces 0

        $quote = $this->quote($product, ['qty' => 1]);

        $this->assertSame('termasuk', $quote['lines'][1]['jenis']);
        $this->assertSame(0, $quote['lines'][1]['subtotal']);
        $this->assertSame(550000, $quote['subtotal']);
    }

    public function test_termasuk_cannot_be_selected(): void
    {
        $product = $this->product('jasa', 100000);
        $termasuk = $this->opsi($product, ['jenis' => 'termasuk', 'nama' => 'Free', 'harga' => 0]);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $termasuk->id, 'qty' => 1]]], 'opsi.0.id');
    }

    public function test_foreign_addon_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $other = $this->product('jasa', 100000);
        $foreign = $this->opsi($other, ['nama' => 'Foreign', 'harga' => 10000, 'satuan' => 'flat']);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $foreign->id, 'qty' => 1]]], 'opsi.0.id');
    }

    public function test_inactive_addon_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Off', 'harga' => 10000, 'satuan' => 'flat', 'aktif' => false]);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 1]]], 'opsi.0.id');
    }

    public function test_duplicate_addon_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Dup', 'harga' => 10000, 'satuan' => 'flat']);

        $this->assertQuoteError($product, [
            'qty' => 1,
            'opsi' => [['id' => $addon->id, 'qty' => 1], ['id' => $addon->id, 'qty' => 1]],
        ], 'opsi.1.id');
    }

    public function test_qty_below_min_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Min', 'harga' => 10000, 'satuan' => 'per_unit', 'qty_min' => 3]);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 1]]], 'opsi.0.qty');
    }

    public function test_qty_above_max_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Max', 'harga' => 10000, 'satuan' => 'per_unit', 'qty_max' => 2]);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 5]]], 'opsi.0.qty');
    }

    public function test_qty_above_stock_is_rejected(): void
    {
        $product = $this->product('jasa', 100000);
        $addon = $this->opsi($product, ['nama' => 'Stock', 'harga' => 10000, 'satuan' => 'per_unit', 'stok' => 2]);

        $this->assertQuoteError($product, ['qty' => 1, 'opsi' => [['id' => $addon->id, 'qty' => 3]]], 'opsi.0.qty');
    }
}
