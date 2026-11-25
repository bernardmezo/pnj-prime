<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ShippingService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://rajaongkir.komerce.id/api/v1';
    protected int $originDestinationId;

    public function __construct()
    {
        $this->apiKey = config('services.rajaongkir.key', '');
        $this->originDestinationId = (int) config('services.rajaongkir.origin_city_id', '25979');
    }

    public function getCities(): array
    {
        if (empty($this->apiKey)) {
            return [];
        }

        $results = [];
        foreach (['depok', 'jakarta', 'bogor', 'bekasi', 'tangerang', 'bandung', 'surabaya', 'semarang', 'yogyakarta'] as $query) {
            try {
                $response = Http::connectTimeout(4)->timeout(12)
                    ->withHeaders(['key' => $this->apiKey])
                    ->get("{$this->baseUrl}/destination/domestic-destination", ['search' => $query, 'limit' => 5]);
                if ($response->successful()) {
                    foreach ($response->json('data') ?? [] as $row) {
                        $results[$row['id']] = [
                            'city_id' => (string) $row['id'],
                            'city_name' => $row['label'],
                            'type' => $row['city_name'] ?? '',
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('RajaOngkir city search failed', ['query' => $query, 'error' => $e->getMessage()]);
            }
        }

        return array_values($results);
    }

    public function calculateCostByPostalCode(string $originPostalCode, string $destinationPostalCode, int $weight = 1000, string $courier = 'jne')
    {
        throw ValidationException::withMessages(['shipping_service' => 'Perhitungan via kode pos belum didukung API ini. Pilih kota tujuan dari daftar.']);
    }

    public function calculateCost(string $destinationCityId, int $weight = 1000, string $courier = 'jne')
    {
        if (! in_array($courier, $this->supportedCouriers(), true)) {
            throw ValidationException::withMessages(['shipping_service' => 'Kurir tidak didukung tipe akun RajaOngkir ini.']);
        }
        if (empty($this->apiKey)) {
            throw ValidationException::withMessages(['shipping_service' => 'Tarif live belum tersedia: API key RajaOngkir belum dikonfigurasi.']);
        }

        try {
            $response = Http::asForm()->connectTimeout(4)->timeout(15)
                ->withHeaders(['key' => $this->apiKey])
                ->post("{$this->baseUrl}/calculate/domestic-cost", [
                    'origin' => $this->originDestinationId,
                    'destination' => (int) $destinationCityId,
                    'weight' => max(100, $weight),
                    'courier' => $courier,
                ]);

            if ($response->successful()) {
                $rows = $response->json('data') ?? [];
                $costs = [];
                foreach ($rows as $row) {
                    $costs[] = [
                        'service' => $row['service'],
                        'description' => $row['description'] ?? '',
                        'cost' => [['value' => (int) $row['cost'], 'etd' => $row['etd'] ?? '', 'note' => '']],
                    ];
                }
                return [['code' => $courier, 'name' => strtoupper($courier), 'costs' => $costs]];
            }
        } catch (\Throwable $e) {
            Log::warning('RajaOngkir cost request failed', ['exception' => $e::class]);
        }

        throw ValidationException::withMessages(['shipping_service' => 'Tarif live RajaOngkir gagal dimuat. Coba kembali; ongkir tidak boleh diperkirakan.']);
    }

    public function supportedCouriers(): array
    {
        return ['jne'];
    }

    public function preorderRates(\App\Models\Pengajuan $request, string $courier): array
    {
        if (! preg_match('/(?:^|\|)\s*Kota:\s*(\d+)\b/', $request->catatan ?? '', $match)) {
            throw ValidationException::withMessages(['shipping_service' => 'Kota tujuan RajaOngkir belum tersimpan pada pengajuan pelanggan. Lengkapi tujuan sebelum menyusun invoice.']);
        }
        $weight = (int) ($request->product?->meta['weight'] ?? 0);
        if ($weight < 1) {
            throw ValidationException::withMessages(['shipping_service' => 'Berat produk dalam gram belum diisi oleh pemilik.']);
        }
        $rates = [];
        foreach ($this->calculateCost($match[1], $weight * max(1, (int) $request->jumlah), $courier) as $result) {
            if (strtolower($result['code'] ?? '') !== $courier) {
                continue;
            }
            foreach ($result['costs'] ?? [] as $service) {
                $amount = $service['cost'][0]['value'] ?? null;
                if (is_numeric($amount) && (int) $amount > 0) {
                    $rates[] = ['service' => $service['service'], 'amount' => (int) $amount, 'etd' => $service['cost'][0]['etd'] ?? ''];
                }
            }
        }
        if (! $rates) {
            throw ValidationException::withMessages(['shipping_service' => 'Tidak ada layanan live untuk kurir dan tujuan ini. Pilih kurir lain.']);
        }
        return $rates;
    }
}
