<?php

namespace Tests\Feature;

use App\Http\Controllers\Customer\PengajuanController;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RentalCheckoutValidationIsolatedTest extends TestCase
{
    public function test_store_requires_rental_period_before_accessing_a_product(): void
    {
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));

        $request = Request::create('/pengajuan', 'POST', ['tipe' => 'ruangan']);
        try {
            app(PengajuanController::class)->store($request);
            $this->fail('Expected validation failure.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('product_id', $exception->errors());
            $this->assertArrayHasKey('rental_start', $exception->errors());
            $this->assertArrayHasKey('rental_end', $exception->errors());
        }
    }
}
