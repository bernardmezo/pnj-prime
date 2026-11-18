<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/** Exercises the same real payment flow on an explicitly isolated SQLite database. */
class SqlitePreorderBluInvoiceTest extends PreorderBluInvoiceTest
{
    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'preorder_sqlite_test');
        $app['config']->set('database.connections.preorder_sqlite_test', [
            'driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
        Artisan::call('migrate', ['--database' => 'preorder_sqlite_test', '--force' => true]);

        return $app;
    }

    public function test_dedicated_review_page_is_scoped_and_role_protected(): void
    {
        $fixture = new \ReflectionMethod(PreorderBluInvoiceTest::class, 'requestFixture');
        [$request, $actor, $buyer] = $fixture->invoke($this);
        $url = '/rtpu/verifikasi/layanan/'.$request->id;
        $this->actingAs($actor)->get($url)->assertOk()->assertInertia(fn ($page) => $page
            ->component('Rtpu/Verifikasi/Layanan')->where('selected.id', $request->id)->has('antrean', 1));
        $this->actingAs($buyer)->get($url)->assertForbidden();
        $request->product->update(['curation_status' => 'pending']);
        $this->actingAs($actor)->get('/rtpu/verifikasi/layanan/prod-'.$request->product_id)
            ->assertOk()->assertInertia(fn ($page) => $page->where('selected.is_product', true));
        $request->update(['status' => 'Ditolak']);
        $this->get($url)->assertNotFound();
        $this->get('/rtpu/verifikasi/layanan/99999999')->assertNotFound();
    }

    public function test_blu_create_update_and_active_bank_filter(): void
    {
        $actor = \App\Models\User::factory()->adminRtpu()->create();
        $payload = ['name' => 'TEST ONLY', 'type' => 'BLU', 'account' => 'TEST-ONLY', 'holder' => 'TEST ONLY', 'active' => true];
        $this->actingAs($actor)->post(route('rtpu.metode.store'), $payload)->assertSessionHasNoErrors();
        $bank = \App\Models\MetodePembayaran::where('nama', 'TEST ONLY')->firstOrFail();
        $this->assertSame('BLU', $bank->tipe);
        $this->patch(route('rtpu.metode.update', $bank), [...$payload, 'name' => 'TEST ONLY UPDATED'])->assertSessionHasNoErrors();
        $this->assertSame('BLU', $bank->fresh()->tipe);
        \App\Models\MetodePembayaran::create(['nama' => 'INACTIVE TEST', 'tipe' => 'BLU', 'rekening' => 'TEST', 'holder' => 'TEST', 'aktif' => false]);
        \App\Models\MetodePembayaran::create(['nama' => 'OTHER TEST', 'tipe' => 'Transfer Bank', 'rekening' => 'TEST', 'holder' => 'TEST', 'aktif' => true]);
        $this->get(route('rtpu.verify.layanan'))->assertInertia(fn ($page) => $page
            ->has('bluBanks', 1)->where('bluBanks.0.id', $bank->id)->where('selected', null));
    }

    public function test_sqlite_writer_reservation_blocks_a_second_connection_until_commit(): void
    {
        $path = tempnam(getenv('TMPDIR') ?: sys_get_temp_dir(), 'preorder-lock-');
        try {
            $first = new \PDO('sqlite:'.$path);
            $second = new \PDO('sqlite:'.$path);
            $first->exec('CREATE TABLE invoices (id INTEGER PRIMARY KEY)');
            $second->exec('PRAGMA busy_timeout = 0');
            $first->beginTransaction();
            $first->exec('UPDATE invoices SET id = id WHERE 1 = 0');
            $second->beginTransaction();
            try {
                $second->exec('UPDATE invoices SET id = id WHERE 1 = 0');
                $this->fail('A second allocator must not acquire the writer reservation');
            } catch (\PDOException $exception) {
                $this->assertStringContainsString('database is locked', $exception->getMessage());
            }
            $second->rollBack();
            $first->commit();
            $second->beginTransaction();
            $this->assertSame(0, $second->exec('UPDATE invoices SET id = id WHERE 1 = 0'));
            $second->commit();
        } finally {
            $first = $second = null;
            unlink($path);
        }
    }

    public function test_sqlite_prepare_serializes_before_reading_and_reserves_unique_active_totals(): void
    {
        // Reuse the PostgreSQL fixture without changing its independent regression coverage.
        $fixture = new \ReflectionMethod(PreorderBluInvoiceTest::class, 'requestFixture');
        [$request, $actor, , , , $data] = $fixture->invoke($this, 'Ambil di PNJ');
        [$other, $otherActor, , , , $otherData] = $fixture->invoke($this, 'Ambil di PNJ');
        DB::enableQueryLog();
        DB::flushQueryLog();
        $first = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $second = app(InvoiceService::class)->preparePreorder($other, $otherActor, $otherData);
        $queries = array_column(DB::getQueryLog(), 'query');
        $this->assertStringStartsWith('update', strtolower($queries[0]));
        $this->assertStringNotContainsString('pg_advisory', implode('\n', $queries));
        $this->assertSame('draft', $first->status);
        $this->assertSame(232, $first->total);
        $this->assertSame(233, $second->total);
        $this->assertSame(1, $first->lines()->count());
        $this->assertSame('Diajukan', $request->fresh()->status);

        // The partial unique index is a final backstop even for a writer bypassing the service.
        $this->expectException(QueryException::class);
        Invoice::whereKey($second->id)->update(['total' => $first->total]);
    }
}
