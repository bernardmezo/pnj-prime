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
     * Hitung biaya ongkir berdasarkan kode pos asal/tujuan (requires RajaOngkir Pro).
     * 
     * @param string $originPostalCode Kode pos asal (5 digit)
     * @param string $destinationPostalCode Kode pos tujuan (5 digit)
     * @param int $weight Berat dalam gram
     * @param string $courier Kurir (jne, jnt, sicepat, dll)
     * @return array Hasil perhitungan ongkir dari RajaOngkir
     * @throws \Illuminate\Validation\ValidationException
     */
    public function calculateCostByPostalCode(string $originPostalCode, string $destinationPostalCode, int $weight = 1000, string $courier = 'jne')
    {
        $type = config('services.rajaongkir.type', 'starter');
        
        // Kode pos hanya tersedia di RajaOngkir Pro
        if ($type !== 'pro') {
            // Fallback: gunakan city_id untuk starter/basic
            // (Fitur ini hanya warning, bukan error — admin bisa upgrade nanti)
            throw \Illuminate\Validation\ValidationException::withMessages([
                'shipping_service' => 'Perhitungan ongkir berdasarkan kode pos memerlukan RajaOngkir Pro. Saat ini sistem menggunakan akun ' . ucfirst($type) . '.'
            ]);
        }

        if (! in_array($courier, $this->supportedCouriers(), true)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Kurir tidak didukung tipe akun RajaOngkir ini.']);
        }

        if (empty($this->apiKey)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Tarif live belum tersedia: API key RajaOngkir belum dikonfigurasi.']);
        }

        // Validasi format kode pos (5 digit)
        if (!preg_match('/^\d{5}$/', $originPostalCode) || !preg_match('/^\d{5}$/', $destinationPostalCode)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['postal_code' => 'Kode pos harus 5 digit angka.']);
        }

        try {
            $response = Http::asForm()->connectTimeout(3)->timeout(12)->withHeaders([
                'key' => $this->apiKey,
            ])->post("{$this->baseUrl}/cost", [
                'originType' => 'subdistrict',
                'destinationType' => 'subdistrict',
                'origin' => $originPostalCode,
                'destination' => $destinationPostalCode,
                'weight' => max(100, $weight),
                'courier' => $courier,
            ]);

            if ($response->successful()) {
                return $response->json('rajaongkir.results') ?? [];
            }
        } catch (\Exception $e) {
            Log::warning('RajaOngkir postal code cost request failed', ['exception' => $e::class, 'message' => $e->getMessage()]);
        }

        throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Tarif live RajaOngkir gagal dimuat. Coba kembali; ongkir tidak boleh diperkirakan.']);
    }

    /**
     * Hitung biaya ongkir berdasarkan kota tujuan, berat (gram), dan kurir (jne, jnt, sicepat)
     */
    public function calculateCost(string $destinationCityId, int $weight = 1000, string $courier = 'jne')
    {
        if (! in_array($courier, $this->supportedCouriers(), true)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Kurir tidak didukung tipe akun RajaOngkir ini.']);
        }
        if (empty($this->apiKey)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Tarif live belum tersedia: API key RajaOngkir belum dikonfigurasi.']);
        }

        try {
            $response = Http::asForm()->connectTimeout(3)->timeout(12)->withHeaders([
                'key' => $this->apiKey,
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
            Log::warning('RajaOngkir cost request failed', ['exception' => $e::class]);
        }

        throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Tarif live RajaOngkir gagal dimuat. Coba kembali; ongkir tidak boleh diperkirakan.']);
    }

    public function supportedCouriers(): array
    {
        return match (config('services.rajaongkir.type', 'starter')) {
            'basic' => ['jne', 'pos', 'tiki', 'rpx', 'esl', 'pcp'],
            'pro' => ['jne', 'pos', 'tiki', 'rpx', 'esl', 'pcp', 'jnt', 'sicepat'],
            default => ['jne', 'pos', 'tiki'],
        };
    }

    public function preorderRates(\App\Models\Pengajuan $request, string $courier): array
    {
        if (! preg_match('/(?:^|\|)\s*Kota:\s*(\d+)\b/', $request->catatan ?? '', $match)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Kota tujuan RajaOngkir belum tersimpan pada pengajuan pelanggan. Lengkapi tujuan sebelum menyusun invoice.']);
        }
        $weight = (int) ($request->product?->meta['weight'] ?? 0);
        if ($weight < 1) {
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Berat produk dalam gram belum diisi oleh pemilik.']);
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
            throw \Illuminate\Validation\ValidationException::withMessages(['shipping_service' => 'Tidak ada layanan live untuk kurir dan tujuan ini. Pilih kurir lain.']);
        }
        return $rates;
    }
}
