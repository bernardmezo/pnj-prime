<?php

namespace Tests\Feature\Flow;

use App\Models\Opsi;
use App\Models\Pengajuan;
use App\Models\PengajuanOpsi;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Models\User;
use App\Services\SettingService;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OpsiPricingTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $customer2;

    protected User $rtpu;

    protected User $p3m;

    protected User $p3m2;

    protected User $direktur;

    protected User $pimpinan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);

        $this->customer = User::factory()->customer()->create(['email' => 'oc@test.id']);
        $this->customer2 = User::factory()->customer()->create(['email' => 'oc2@test.id']);
        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'ort@test.id']);
        $this->p3m = User::factory()->adminP3m()->create(['email' => 'op3@test.id']);
        $this->p3m2 = User::factory()->adminP3m()->create(['email' => 'op3b@test.id']);
        $this->direktur = User::factory()->direktur()->create(['email' => 'odir@test.id']);
        $this->pimpinan = User::factory()->pimpinanRtpu()->create(['email' => 'opim@test.id']);

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
            'name' => "Layanan {$tipe} ".uniqid(),
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

    private function pu(User $owner, string $status = 'Diajukan'): ProdukUnggulan
    {
        return ProdukUnggulan::create([
            'code' => 'PNJ-PU-'.uniqid(),
            'owner_id' => $owner->id,
            'name' => 'PU '.uniqid(),
            'status' => $status,
            'history' => [],
        ]);
    }

    // ---------- the reference scenario ----------

    public function test_ruangan_scenario_quote_and_store_with_snapshot(): void
    {
        $ruangan = $this->product('ruangan', 550000, 'hari');
        $this->opsi($ruangan, ['jenis' => 'termasuk', 'nama' => 'Proyektor', 'harga' => 0, 'satuan' => 'flat', 'urutan' => 0]);
        $snack = $this->opsi($ruangan, ['jenis' => 'addon', 'nama' => 'Snack peserta', 'harga' => 25000, 'satuan' => 'per_orang', 'urutan' => 1]);
        $sound = $this->opsi($ruangan, ['jenis' => 'addon', 'nama' => 'Sound system', 'harga' => 150000, 'satuan' => 'flat', 'urutan' => 2]);

        $this->actingAs($this->customer);

        $payload = [
            'tipe' => 'ruangan',
            'product_id' => $ruangan->id,
            'jumlah' => '2',
            'peserta' => 10,
            'opsi' => [
                ['id' => $snack->id, 'qty' => 1],
                ['id' => $sound->id, 'qty' => 1],
            ],
        ];

        $this->postJson(route('customer.pengajuan.hitung'), $payload)
            ->assertOk()
            ->assertJsonPath('tipe', 'ruangan')
            ->assertJsonPath('subtotal', 1500000)
            ->assertJsonPath('ppn', 165000)
            ->assertJsonPath('total', 1665000)
            ->assertJsonFragment(['nama' => 'Proyektor', 'subtotal' => 0])
            ->assertJsonFragment(['nama' => 'Snack peserta', 'subtotal' => 250000])
            ->assertJsonFragment(['nama' => 'Sound system', 'subtotal' => 150000]);

        $this->post(route('customer.pengajuan.store'), $payload)->assertRedirect();
        $p = Pengajuan::latest('id')->firstOrFail();

        // Stored total is the pre-tax subtotal (addons included).
        $this->assertSame(1500000, (int) $p->total);
        $this->assertSame(3, PengajuanOpsi::where('pengajuan_id', $p->id)->count());

        $snap = PengajuanOpsi::where('pengajuan_id', $p->id)->where('nama', 'Snack peserta')->firstOrFail();
        $this->assertSame(25000, (int) $snap->harga);
        $this->assertSame('per_orang', $snap->satuan);
        $this->assertSame(1, (int) $snap->qty);
        $this->assertSame(250000, (int) $snap->subtotal);
    }

    public function test_client_sent_prices_and_totals_are_ignored(): void
    {
        $ruangan = $this->product('ruangan', 550000, 'hari');
        $snack = $this->opsi($ruangan, ['jenis' => 'addon', 'nama' => 'Snack', 'harga' => 25000, 'satuan' => 'per_orang']);

        $this->actingAs($this->customer);

        $payload = [
            'tipe' => 'ruangan',
            'product_id' => $ruangan->id,
            'jumlah' => '2',
            'peserta' => 10,
            'subtotal' => 1,
            'total' => 1,
            'opsi' => [['id' => $snack->id, 'qty' => 1, 'harga' => 1, 'subtotal' => 1]],
        ];

        $this->postJson(route('customer.pengajuan.hitung'), $payload)
            ->assertOk()
            ->assertJsonPath('subtotal', 1350000)
            ->assertJsonPath('ppn', 148500)
            ->assertJsonPath('total', 1498500);

        $this->post(route('customer.pengajuan.store'), $payload)->assertRedirect();
        $p = Pengajuan::latest('id')->firstOrFail();
        $this->assertSame(1350000, (int) $p->total);
        $this->assertSame(25000, (int) PengajuanOpsi::where('pengajuan_id', $p->id)->firstOrFail()->harga);
    }

    // ---------- submission validation ----------

    public function test_selected_addons_are_strictly_validated(): void
    {
        $jasa = $this->product('jasa', 100000);
        $other = $this->product('jasa', 100000);

        $foreign = $this->opsi($other, ['nama' => 'Foreign', 'harga' => 10000]);
        $inactive = $this->opsi($jasa, ['nama' => 'Inactive', 'harga' => 10000, 'aktif' => false]);
        $dup = $this->opsi($jasa, ['nama' => 'Dup', 'harga' => 10000]);
        $min = $this->opsi($jasa, ['nama' => 'Min', 'harga' => 10000, 'satuan' => 'per_unit', 'qty_min' => 3]);
        $max = $this->opsi($jasa, ['nama' => 'Max', 'harga' => 10000, 'satuan' => 'per_unit', 'qty_max' => 2]);
        $stock = $this->opsi($jasa, ['nama' => 'Stock', 'harga' => 10000, 'satuan' => 'per_unit', 'stok' => 2]);

        $this->actingAs($this->customer);
        $base = ['tipe' => 'jasa', 'product_id' => $jasa->id, 'jumlah' => '1'];

        $cases = [
            ['opsi.0.id', [['id' => $foreign->id, 'qty' => 1]]],
            ['opsi.0.id', [['id' => $inactive->id, 'qty' => 1]]],
            ['opsi.1.id', [['id' => $dup->id, 'qty' => 1], ['id' => $dup->id, 'qty' => 1]]],
            ['opsi.0.qty', [['id' => $min->id, 'qty' => 1]]],
            ['opsi.0.qty', [['id' => $max->id, 'qty' => 5]]],
            ['opsi.0.qty', [['id' => $stock->id, 'qty' => 3]]],
        ];

        foreach ($cases as [$key, $opsi]) {
            $this->postJson(route('customer.pengajuan.hitung'), $base + ['opsi' => $opsi])
                ->assertStatus(422)
                ->assertJsonValidationErrors($key);
        }

        // The store path enforces the same rules and persists nothing.
        $this->post(route('customer.pengajuan.store'), $base + ['opsi' => [['id' => $foreign->id, 'qty' => 1]]])
            ->assertSessionHasErrors('opsi.0.id');
        $this->assertSame(0, Pengajuan::where('buyer_id', $this->customer->id)->count());
    }

    // ---------- authorization ----------

    public function test_only_rtpu_manages_layanan_options(): void
    {
        $jasa = $this->product('jasa', 100000);
        $payload = ['jenis' => 'addon', 'nama' => 'X', 'harga' => 1000, 'satuan' => 'flat'];

        foreach ([$this->customer, $this->direktur, $this->p3m] as $u) {
            $this->actingAs($u);
            $this->post(route('rtpu.opsi.store', $jasa), $payload)->assertForbidden();
        }

        $opsi = $this->opsi($jasa, ['nama' => 'Existing', 'harga' => 1000]);

        foreach ([$this->customer, $this->direktur] as $u) {
            $this->actingAs($u);
            $this->patch(route('rtpu.opsi.update', $opsi), $payload)->assertForbidden();
            $this->delete(route('rtpu.opsi.destroy', $opsi))->assertForbidden();
        }

        // Staff cannot use the customer-only quote endpoint either.
        $this->actingAs($this->rtpu);
        $this->postJson(route('customer.pengajuan.hitung'), ['tipe' => 'jasa', 'product_id' => $jasa->id])->assertForbidden();
    }

    public function test_p3m_manages_only_their_own_produk_options(): void
    {
        $mine = $this->pu($this->p3m);
        $theirs = $this->pu($this->p3m2);
        $foreign = $theirs->opsi()->create([
            'jenis' => 'addon', 'nama' => 'Foreign', 'harga' => 1000, 'satuan' => 'flat',
            'qty_min' => 1, 'aktif' => true, 'urutan' => 0, 'sumber' => 'admin',
        ]);

        $this->actingAs($this->p3m);

        $this->post(route('p3m.produk.opsi.store', $mine), [
            'jenis' => 'addon', 'nama' => 'Instalasi', 'harga' => 100000, 'satuan' => 'flat',
        ])->assertRedirect();
        $this->assertDatabaseHas('opsi', [
            'nama' => 'Instalasi',
            'opsi_type' => ProdukUnggulan::class,
            'opsi_id' => $mine->id,
            'sumber' => 'usulan_p3m',
        ]);

        $this->post(route('p3m.produk.opsi.store', $theirs), [
            'jenis' => 'addon', 'nama' => 'Nope', 'harga' => 1, 'satuan' => 'flat',
        ])->assertForbidden();
        $this->patch(route('p3m.produk.opsi.update', $foreign), [
            'jenis' => 'addon', 'nama' => 'Hack', 'harga' => 1, 'satuan' => 'flat',
        ])->assertForbidden();
        $this->delete(route('p3m.produk.opsi.destroy', $foreign))->assertForbidden();

        // Produk Unggulan becomes a physical product: per_hari is not allowed.
        $this->post(route('p3m.produk.opsi.store', $mine), [
            'jenis' => 'addon', 'nama' => 'Per hari', 'harga' => 1, 'satuan' => 'per_hari',
        ])->assertSessionHasErrors('satuan');
    }

    // ---------- RTNU CRUD + satuan limits ----------

    public function test_rtpu_option_crud_satuan_limits_and_termasuk_price(): void
    {
        $ruangan = $this->product('ruangan', 550000, 'hari');
        $this->actingAs($this->rtpu);

        $this->get(route('rtpu.opsi.index', $ruangan))->assertOk();

        // Ruangan may use all five units.
        foreach (['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'] as $satuan) {
            $this->post(route('rtpu.opsi.store', $ruangan), [
                'jenis' => 'addon', 'nama' => 'Opsi '.$satuan, 'harga' => 1000, 'satuan' => $satuan,
            ])->assertRedirect();
        }
        $this->assertSame(5, $ruangan->opsi()->count());

        // "termasuk" is always free even when a price is posted.
        $this->post(route('rtpu.opsi.store', $ruangan), [
            'jenis' => 'termasuk', 'nama' => 'Proyektor', 'harga' => 5000, 'satuan' => 'flat',
        ])->assertRedirect();
        $this->assertDatabaseHas('opsi', ['nama' => 'Proyektor', 'jenis' => 'termasuk', 'harga' => 0]);

        // Unique per owner + jenis.
        $this->post(route('rtpu.opsi.store', $ruangan), [
            'jenis' => 'termasuk', 'nama' => 'Proyektor', 'harga' => 0, 'satuan' => 'flat',
        ])->assertSessionHasErrors('nama');

        // Update + soft delete.
        $opsi = Opsi::where('nama', 'Opsi flat')->firstOrFail();
        $this->patch(route('rtpu.opsi.update', $opsi), [
            'jenis' => 'addon', 'nama' => 'Opsi flat diubah', 'harga' => 2000, 'satuan' => 'flat',
        ])->assertRedirect();
        $this->assertSame(2000, (int) $opsi->fresh()->harga);

        $this->delete(route('rtpu.opsi.destroy', $opsi))->assertRedirect();
        $this->assertSoftDeleted('opsi', ['id' => $opsi->id]);

        // Jasa only allows flat / per_unit.
        $jasa = $this->product('jasa', 100000);
        $this->post(route('rtpu.opsi.store', $jasa), [
            'jenis' => 'addon', 'nama' => 'X', 'harga' => 1, 'satuan' => 'per_hari',
        ])->assertSessionHasErrors('satuan');
    }

    // ---------- snapshot immutability ----------

    public function test_snapshot_survives_admin_edit_deactivate_and_delete(): void
    {
        $ruangan = $this->product('ruangan', 550000, 'hari');
        $snack = $this->opsi($ruangan, ['jenis' => 'addon', 'nama' => 'Snack', 'harga' => 25000, 'satuan' => 'per_orang']);
        $sound = $this->opsi($ruangan, ['jenis' => 'addon', 'nama' => 'Sound', 'harga' => 150000, 'satuan' => 'flat']);

        $this->actingAs($this->customer);
        $this->post(route('customer.pengajuan.store'), [
            'tipe' => 'ruangan', 'product_id' => $ruangan->id, 'jumlah' => '1', 'peserta' => 10,
            'opsi' => [['id' => $snack->id, 'qty' => 1], ['id' => $sound->id, 'qty' => 1]],
        ])->assertRedirect();

        $p = Pengajuan::latest('id')->firstOrFail();
        $before = PengajuanOpsi::where('pengajuan_id', $p->id)->orderBy('id')->get();

        // Admin edits + deactivates the snack option.
        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.opsi.update', $snack), [
            'jenis' => 'addon', 'nama' => 'Snack premium', 'harga' => 99000, 'satuan' => 'per_orang', 'aktif' => false,
        ])->assertRedirect();

        $mid = PengajuanOpsi::where('pengajuan_id', $p->id)->orderBy('id')->get();
        $this->assertSame(['Snack', 'Sound'], $mid->pluck('nama')->all());
        $this->assertSame([25000, 150000], array_map(fn ($r) => (int) $r->harga, $mid->all()));
        $this->assertSame(250000, (int) $mid->first()->subtotal);
        $this->assertSame($snack->id, (int) $mid->first()->opsi_id);

        // Hard delete the addon: the snapshot row stays, its FK is nulled.
        $snack->forceDelete();
        $after = PengajuanOpsi::where('pengajuan_id', $p->id)->orderBy('id')->get();
        $this->assertCount(2, $after);
        $this->assertNull($after->first()->opsi_id);
        $this->assertSame(250000, (int) $after->first()->subtotal);

        $this->assertSame($before->pluck('nama')->all(), $after->pluck('nama')->all());
    }

    // ---------- migrations + N+1 ----------

    public function test_option_migrations_are_additive(): void
    {
        $this->assertTrue(Schema::hasTable('opsi'));
        $this->assertTrue(Schema::hasTable('pengajuan_opsi'));
        $this->assertTrue(Schema::hasColumns('opsi', [
            'id', 'opsi_type', 'opsi_id', 'jenis', 'nama', 'deskripsi', 'harga', 'satuan',
            'qty_min', 'qty_max', 'stok', 'aktif', 'urutan', 'sumber', 'created_at', 'updated_at', 'deleted_at',
        ]));
        $this->assertTrue(Schema::hasColumns('pengajuan_opsi', [
            'id', 'pengajuan_id', 'opsi_id', 'jenis', 'nama', 'harga', 'satuan', 'qty', 'subtotal',
        ]));

        // Pre-existing tables were not restructured.
        $this->assertTrue(Schema::hasColumns('products', ['id', 'final_price', 'meta', 'produk_unggulan_id', 'deleted_at']));
        $this->assertTrue(Schema::hasColumns('pengajuan', ['id', 'total', 'status', 'history']));
    }

    public function test_create_listing_eager_loads_options_without_n_plus_one(): void
    {
        $this->actingAs($this->customer);

        $countQueries = function (): int {
            User::flushPermissionCache();
            Cache::flush();
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->get(route('customer.pengajuan.create'))->assertOk();
            $queries = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $queries;
        };

        $first = $this->product('jasa', 100000);
        $this->opsi($first, ['nama' => 'A', 'harga' => 1000]);
        $this->opsi($first, ['nama' => 'B', 'harga' => 2000]);

        $baseline = $countQueries();

        for ($i = 0; $i < 4; $i++) {
            $extra = $this->product('jasa', 100000);
            $this->opsi($extra, ['nama' => 'C', 'harga' => 3000]);
            $this->opsi($extra, ['nama' => 'D', 'harga' => 4000]);
        }

        $withMany = $countQueries();

        $this->assertSame($baseline, $withMany, 'create() must eager-load opsi (no N+1).');
    }
}
