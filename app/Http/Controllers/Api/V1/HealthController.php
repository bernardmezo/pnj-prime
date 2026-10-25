<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class HealthController extends Controller
{
    /**
     * API health check with database connectivity probe.
     */
    public function status(): JsonResponse
    {
        $dbStatus = 'disconnected';
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Throwable $e) {
            $dbStatus = 'error: '.$e->getMessage();
        }

        return response()->json([
            'status' => 'healthy',
            'api_version' => 'v1.0.0',
            'timestamp' => now()->toIso8601String(),
            'database' => $dbStatus,
        ], Response::HTTP_OK);
    }
}
