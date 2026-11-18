<?php

namespace Tests\Unit;

use App\Services\PreorderInvoiceMoney;
use PHPUnit\Framework\TestCase;

class PreorderInvoiceMoneyTest extends TestCase
{
    public function test_tax_is_half_up_on_goods_only(): void
    {
        $amounts = PreorderInvoiceMoney::calculate(105, 1, '10.00', 25000, 7);
        $this->assertSame(['subtotal' => 105, 'tax_amount' => 11, 'shipping_amount' => 25000, 'unique_amount' => 7, 'total' => 25123], $amounts);
    }
}
