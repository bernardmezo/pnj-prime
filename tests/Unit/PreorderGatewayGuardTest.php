<?php

namespace Tests\Unit;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Services\MidtransService;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PreorderGatewayGuardTest extends TestCase
{
    public function test_preorder_is_rejected_before_gateway_or_database_access(): void
    {
        $pengajuan = new Pengajuan(['tipe' => 'produk']);
        $pengajuan->setRelation('product', new Product(['meta' => ['availability_status' => 'preorder']]));
        $pengajuan->setRelation('latestInvoice', null);
        $this->expectException(ValidationException::class);
        app(MidtransService::class)->createSnapPayment($pengajuan);
    }
}
