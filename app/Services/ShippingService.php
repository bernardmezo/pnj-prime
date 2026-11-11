<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingService
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $originCity;

    public function __construct()
    {
        $this->apiKey = config('services.rajaongkir.key', '');
        $type = config('services.rajaongkir.type', 'starter');
        
        // Pilih base URL sesuai tipe akun RajaOngkir (starter/basic/pro)
        $this->baseUrl = match ($type) {
            'pro' => 'https://pro.rajaongkir.com/api',
            'basic' => 'https://api.rajaongkir.com/basic',
            default => 'https://api.rajaongkir.com/starter',
        };

        $this->originCity = config('services.rajaongkir.origin_city_id', '152'); // Default Depok
    }

    /**
     * Ambil daftar kota tujuan untuk pilihan pengiriman
     */
    public function getCities()
    {
        // Selalu sertakan daftar kota utama Indonesia sebagai cadangan (fallback) agar dropdown selalu terisi meskipun API key kosong atau gangguan
        $defaultCities = [
            ['city_id' => '152', 'city_name' => 'Depok', 'type' => 'Kota'],
            ['city_id' => '23', 'city_name' => 'Jakarta Selatan', 'type' => 'Kota'],
            ['city_id' => '22', 'city_name' => 'Jakarta Pusat', 'type' => 'Kota'],
            ['city_id' => '21', 'city_name' => 'Jakarta Barat', 'type' => 'Kota'],
            ['city_id' => '24', 'city_name' => 'Jakarta Timur', 'type' => 'Kota'],
            ['city_id' => '25', 'city_name' => 'Jakarta Utara', 'type' => 'Kota'],
            ['city_id' => '155', 'city_name' => 'Bogor', 'type' => 'Kota'],
            ['city_id' => '78', 'city_name' => 'Bekasi', 'type' => 'Kota'],
            ['city_id' => '115', 'city_name' => 'Tangerang', 'type' => 'Kota'],
            ['city_id' => '114', 'city_name' => 'Tangerang Selatan', 'type' => 'Kota'],
            ['city_id' => '54', 'city_name' => 'Bandung', 'type' => 'Kota'],
            ['city_id' => '399', 'city_name' => 'Surabaya', 'type' => 'Kota'],
            ['city_id' => '444', 'city_name' => 'Semarang', 'type' => 'Kota'],
            ['city_id' => '501', 'city_name' => 'Yogyakarta', 'type' => 'Kota'],
        ];

        if (empty($this->apiKey)) {
            return $defaultCities;
        }

        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey,
            ])->get("{$this->baseUrl}/city");

            if ($response->successful()) {
                $results = $response->json('rajaongkir.results');
                if (!empty($results)) {
                    return $results;
                }
            }
        } catch (\Exception $e) {
            Log::error('RajaOngkir getCities error: ' . $e->getMessage());
        }

        return $defaultCities;
    }

    /**
     * Hitung biaya ongkir berdasarkan kota tujuan, berat (gram), dan kurir (jne, jnt, sicepat)
     */
    public function calculateCost(string $destinationCityId, int $weight = 1000, string $courier = 'jne')
    {
        if (empty($this->apiKey)) {
            // Mock cost calculation jika API key belum diisi
            $baseCost = match ($courier) {
                'jnt' => 12000,
                'sicepat' => 11000,
                default => 10000,
            };
            $weightKg = max(1, ceil($weight / 1000));
            $cost = $baseCost * $weightKg;

            return [
                [
                    'code' => strtoupper($courier),
                    'name' => strtoupper($courier) . ' Express',
                    'costs' => [
                        [
                            'service' => 'REG',
                            'description' => 'Layanan Reguler (Mock)',
                            'cost' => [['value' => $cost, 'etd' => '2-3 hari', 'note' => '']]
                        ],
                        [
                            'service' => 'YES',
                            'description' => 'Yakin Esok Sampai (Mock)',
                            'cost' => [['value' => $cost + 10000, 'etd' => '1 hari', 'note' => '']]
                        ]
                    ]
                ]
            ];
        }

        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey,
                'content-type' => 'application/x-www-form-urlencoded',
            ])->post("{$this->baseUrl}/cost", [
                'origin' => $this->originCity,
                'destination' => $destinationCityId,
                'weight' => max(100, $weight),
                'courier' => $courier,
            ]);

            if ($response->successful()) {
                return $response->json('rajaongkir.results') ?? [];
            }
        } catch (\Exception $e) {
            Log::error('RajaOngkir calculateCost error: ' . $e->getMessage());
        }

        return [];
    }
}
