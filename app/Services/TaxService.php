<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\TaxRate;

class TaxService
{
    /**
     * Calculate tax for a given subtotal and optional specific TaxRate.
     * If no TaxRate provided, checks global setting PPN.
     *
     * @return array{
     *     subtotal: int,
     *     tax_rate_id: ?int,
     *     tax_rate_snapshot: float,
     *     tax_name_snapshot: string,
     *     tax_amount: int,
     *     total: int
     * }
     */
    public function calculate(int $subtotal, ?TaxRate $taxRate = null, ?string $category = null): array
    {
        // 1. Resolve tax rate: either provided, or matching category, or default active
        $rateModel = $taxRate;
        if (! $rateModel && $category) {
            $rateModel = TaxRate::where('is_active', true)
                ->where('category', $category)
                ->first();
        }
        if (! $rateModel) {
            $rateModel = TaxRate::where('is_active', true)->first();
        }

        if ($rateModel) {
            $threshold = (int) ($rateModel->threshold_amount ?? 0);
            if ($threshold > 0 && $subtotal < $threshold) {
                return [
                    'subtotal' => $subtotal,
                    'tax_rate_id' => $rateModel->id,
                    'tax_rate_snapshot' => 0.0,
                    'tax_name_snapshot' => $rateModel->name.' (Di bawah batas ambang)',
                    'tax_amount' => 0,
                    'total' => $subtotal,
                ];
            }

            $ratePct = (float) $rateModel->rate;
            $taxAmount = (int) round(($subtotal * $ratePct) / 100);

            return [
                'subtotal' => $subtotal,
                'tax_rate_id' => $rateModel->id,
                'tax_rate_snapshot' => $ratePct,
                'tax_name_snapshot' => $rateModel->name,
                'tax_amount' => $taxAmount,
                'total' => $subtotal + $taxAmount,
            ];
        }

        // Fallback to legacy global settings
        $ppnEnabled = Setting::where('key', 'ppn_enabled')->value('value') === '1';
        $ppnRate = (float) (Setting::where('key', 'ppn_rate')->value('value') ?? 11);
        $threshold = (int) (Setting::where('key', 'ppn_threshold')->value('value') ?? 0);

        if ($ppnEnabled && ($threshold <= 0 || $subtotal >= $threshold)) {
            $taxAmount = (int) round(($subtotal * $ppnRate) / 100);

            return [
                'subtotal' => $subtotal,
                'tax_rate_id' => null,
                'tax_rate_snapshot' => $ppnRate,
                'tax_name_snapshot' => 'PPN Global (Fallback)',
                'tax_amount' => $taxAmount,
                'total' => $subtotal + $taxAmount,
            ];
        }

        return [
            'subtotal' => $subtotal,
            'tax_rate_id' => null,
            'tax_rate_snapshot' => 0.0,
            'tax_name_snapshot' => 'Bebas Pajak',
            'tax_amount' => 0,
            'total' => $subtotal,
        ];
    }
}
