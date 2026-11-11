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
            'courier' => 'nullable|string|in:jne,jnt,sicepat,pos',
        ]);

        $destination = $request->input('destination');
        $weight = (int) $request->input('weight', 1000);
        $courier = $request->input('courier', 'jne');

        $results = $this->shippingService->calculateCost($destination, $weight, $courier);

        return response()->json([
            'success' => true,
            'costs' => $results,
        ]);
    }
}
