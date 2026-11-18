<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShippingService;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    protected ShippingService $shippingService;

    public function __construct(ShippingService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    public function cities()
    {
        return response()->json([
            'success' => true,
            'cities' => $this->shippingService->getCities(),
        ]);
    }

    public function calculate(Request $request)
    {
        $request->validate([
            'destination' => 'required|string',
            'weight' => 'nullable|integer|min:100',
            'courier' => ['nullable', 'string', \Illuminate\Validation\Rule::in($this->shippingService->supportedCouriers())],
        ]);

        $destination = $request->input('destination');
        $weight = (int) $request->input('weight', 1000);
        $courier = $request->input('courier', 'jne');

        try {
            $results = $this->shippingService->calculateCost($destination, $weight, $courier);

            return response()->json([
                'success' => true,
                'costs' => $results,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Calculate shipping cost by postal code (requires RajaOngkir Pro).
     * Falls back gracefully if not available.
     */
    public function calculateByPostalCode(Request $request)
    {
        $request->validate([
            'destination_postal_code' => 'required|string|size:5|regex:/^\d{5}$/',
            'weight' => 'nullable|integer|min:100',
            'courier' => ['nullable', 'string', \Illuminate\Validation\Rule::in($this->shippingService->supportedCouriers())],
        ]);

        $destinationPostalCode = $request->input('destination_postal_code');
        $weight = (int) $request->input('weight', 1000);
        $courier = $request->input('courier', 'jne');

        // Origin postal code dari config atau default (Depok: 16424)
        $originPostalCode = config('services.rajaongkir.origin_postal_code', '16424');

        try {
            $results = $this->shippingService->calculateCostByPostalCode(
                $originPostalCode,
                $destinationPostalCode,
                $weight,
                $courier
            );

            return response()->json([
                'success' => true,
                'costs' => $results,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return error but let frontend fallback to city_id method
            return response()->json([
                'success' => false,
                'error' => $e->errors()['shipping_service'][0] ?? $e->getMessage(),
                'fallback_to_city' => true,
            ], 200); // 200 karena ini expected fallback, bukan hard error
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Perhitungan ongkir via kode pos gagal. Gunakan pilihan kota.',
                'fallback_to_city' => true,
            ], 200);
        }
    }
}
