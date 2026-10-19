<?php

namespace App\Services;

use App\Models\Opsi;
use App\Models\Pengajuan;
use App\Models\PengajuanOpsi;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Single source of truth for money in the application. The frontend only
 * ever renders numbers produced here — it never computes totals itself.
 *
 * A quote is composed of:
 *   - one base line (the listing price × its duration/quantity), and
 *   - the listing's options ("termasuk" lines at 0, plus selected "addon" lines).
 *
 * Tax is delegated to SettingService (calculateTax) so the threshold/rate
 * rules live in exactly one place.
 */
class PricingService
{
    public function __construct(private SettingService $settings) {}

    /**
     * Validate a draft selection and return the full breakdown.
     *
     * @param  array{qty?:int, peserta?:int|null, jam?:int|null, opsi?:array<int, array{id:int, qty?:int}>}  $selection
     * @return array{tipe:string, lines:array<int, array<string, mixed>>, subtotal:int, ppn:int, total:int}
     *
     * @throws ValidationException when a selected addon is foreign, inactive,
     *                             duplicated, or its qty breaks the option limits.
     */
    public function quote(Product $product, array $selection): array
    {
        $tipe = $product->layananTipe();
        $qty = max(1, (int) ($selection['qty'] ?? 1));
        $peserta = max(0, (int) ($selection['peserta'] ?? 0));
        $jam = max(0, (int) ($selection['jam'] ?? 0));

        $baseSatuan = $product->layananSatuan();
        $baseMultiplier = $baseSatuan === 'per_jam' && $jam > 0 ? $jam : $qty;

        // Duration context used by per_hari / per_jam addons.
        $hours = $jam > 0 ? $jam : ($baseSatuan === 'per_jam' ? $qty : $qty * 24);
        $days = $baseSatuan === 'per_hari' ? $qty : max(1, (int) ceil($hours / 24));

        $harga = (int) ($product->final_price ?? 0);

        $lines = [[
            'kind' => 'base',
            'nama' => $product->name,
            'satuan' => $baseSatuan,
            'harga' => $harga,
            'multiplier' => $baseMultiplier,
            'qty' => 1,
            'subtotal' => $harga * $baseMultiplier,
        ]];

        /** @var Collection<int, Opsi> $opsi */
        $opsi = $product->opsi()->urut()->get();

        /** @var array<int, array{id:int, qty?:int}> $picked */
        $picked = collect($selection['opsi'] ?? [])
            ->map(fn ($row) => ['id' => (int) ($row['id'] ?? 0), 'qty' => (int) ($row['qty'] ?? 0)])
            ->values()
            ->all();

        $selected = [];
        $errors = [];

        foreach ($picked as $index => $row) {
            if (isset($selected[$row['id']])) {
                $errors["opsi.{$index}.id"] = 'Opsi ini dipilih lebih dari sekali.';
                continue;
            }

            $option = $opsi->firstWhere('id', $row['id']);

            if (! $option) {
                $errors["opsi.{$index}.id"] = 'Opsi tidak ditemukan pada layanan ini.';
                continue;
            }

            if (! $option->aktif) {
                $errors["opsi.{$index}.id"] = 'Opsi ini sudah tidak aktif.';
                continue;
            }

            if ($option->isTermasuk()) {
                $errors["opsi.{$index}.id"] = 'Item termasuk tidak dapat dipilih atau dibatalkan.';
                continue;
            }

            $min = max(1, (int) $option->qty_min);
            $qtyPilihan = $option->satuan === 'per_orang' ? 1 : max(1, $row['qty'] ?: $min);

            if ($qtyPilihan < $min) {
                $errors["opsi.{$index}.qty"] = "Jumlah minimal {$min}.";
                continue;
            }

            if ($option->qty_max !== null && $qtyPilihan > (int) $option->qty_max) {
                $errors["opsi.{$index}.qty"] = 'Jumlah melebihi batas maksimal.';
                continue;
            }

            if ($option->stok !== null && $qtyPilihan > (int) $option->stok) {
                $errors["opsi.{$index}.qty"] = 'Jumlah melebihi stok tersedia.';
                continue;
            }

            $selected[$row['id']] = $qtyPilihan;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        foreach ($opsi as $option) {
            if ($option->isAddon()) {
                if (! isset($selected[$option->id])) {
                    continue;
                }
                $qtyPilihan = $selected[$option->id];
            } else {
                if (! $option->aktif) {
                    continue;
                }
                $qtyPilihan = 1;
            }

            $multiplier = match ($option->satuan) {
                'per_hari' => $days,
                'per_jam' => $hours,
                'per_orang' => $peserta,
                default => 1, // flat, per_unit
            };

            $lines[] = [
                'kind' => $option->jenis === 'termasuk' ? 'termasuk' : 'addon',
                'opsi_id' => $option->id,
                'jenis' => $option->jenis,
                'nama' => $option->nama,
                'satuan' => $option->satuan,
                'harga' => (int) $option->harga,
                'multiplier' => $multiplier,
                'qty' => $qtyPilihan,
                'subtotal' => (int) round($option->harga * $multiplier * $qtyPilihan),
            ];
        }

        $subtotal = (int) array_sum(array_column($lines, 'subtotal'));
        $ppn = $this->settings->calculateTax($subtotal);

        return [
            'tipe' => $tipe,
            'lines' => $lines,
            'subtotal' => $subtotal,
            'ppn' => $ppn,
            'total' => $subtotal + $ppn,
        ];
    }

    /**
     * Freeze the option lines of a quote onto a submitted pengajuan.
     * Snapshots are append-only and never recalculated afterwards.
     */
    public function snapshot(Pengajuan $pengajuan, array $quote): void
    {
        foreach ($quote['lines'] as $line) {
            if (! in_array($line['kind'] ?? null, ['addon', 'termasuk'], true)) {
                continue;
            }

            PengajuanOpsi::create([
                'pengajuan_id' => $pengajuan->id,
                'opsi_id' => $line['opsi_id'] ?? null,
                'jenis' => $line['jenis'],
                'nama' => $line['nama'],
                'harga' => $line['harga'],
                'satuan' => $line['satuan'],
                'qty' => $line['qty'],
                'subtotal' => $line['subtotal'],
            ]);
        }
    }

    /**
     * Quantity parsed from the free-text "jumlah" field ("3 sampel" => 3).
     */
    public static function parseQty(?string $jumlah): int
    {
        if ($jumlah !== null && preg_match('/^\d+/', $jumlah, $m)) {
            return max(1, (int) $m[0]);
        }

        return 1;
    }

    /**
     * Whole hours between two HH:MM times (0 when not a valid range).
     */
    public static function parseHours(?string $mulai, ?string $selesai): int
    {
        if ($mulai === null || $selesai === null) {
            return 0;
        }

        $start = strtotime($mulai);
        $end = strtotime($selesai);

        if ($start === false || $end === false || $end <= $start) {
            return 0;
        }

        return (int) ceil(($end - $start) / 3600);
    }
}
