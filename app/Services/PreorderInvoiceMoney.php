<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class PreorderInvoiceMoney
{
    public static function calculate(int $unitPrice, int $quantity, string $rate, int $shipping, int $unique): array
    {
        // Bound inputs before multiplying; all arithmetic remains within signed 64-bit integers.
        if ($unitPrice < 1 || $unitPrice > 1000000000 || $quantity < 1 || $quantity > 10000
            || $shipping < 0 || $shipping > 1000000000 || $unique < 1 || $unique > 999
            || ! preg_match('/^\d{1,3}(?:\.\d{1,2})?$/D', $rate)) {
            throw ValidationException::withMessages(['invoice' => 'Rincian invoice tidak valid. Periksa nominal dan jumlah barang.']);
        }
        [$whole, $fraction] = array_pad(explode('.', $rate), 2, '');
        $basisPoints = (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
        if ($basisPoints > 10000) {
            throw ValidationException::withMessages(['tax_rate' => 'Persentase pajak maksimal 100%.']);
        }
        $subtotal = $unitPrice * $quantity;
        $tax = intdiv($subtotal * $basisPoints + 5000, 10000);

        return ['subtotal' => $subtotal, 'tax_amount' => $tax, 'shipping_amount' => $shipping,
            'unique_amount' => $unique, 'total' => $subtotal + $tax + $shipping + $unique];
    }
}
