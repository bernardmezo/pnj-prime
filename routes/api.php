<?php

use App\Http\Controllers\Api\MidtransWebhookController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PengajuanController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — PNJ PRIME v1
|--------------------------------------------------------------------------
|
| Versioned REST API endpoints for external integrations, mobile clients,
| and headless frontends.
|
*/

Route::prefix('v1')->group(function () {
    // System health probe
    Route::get('/health', [HealthController::class, 'status']);

    // Public catalog browsing
    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::get('/catalog/{slug}', [CatalogController::class, 'show']);

    // Pricing calculation engine
    Route::post('/pengajuan/quote', [PengajuanController::class, 'quote']);

    // Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Authenticated API routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'revoke']);

        Route::get('/pengajuan', [PengajuanController::class, 'index']);
        Route::post('/pengajuan', [PengajuanController::class, 'store']);
        Route::get('/pengajuan/{id}', [PengajuanController::class, 'show']);
    });
});

// Midtrans Snap Webhook Notification (CSRF-exempt, public)
Route::post('/midtrans/notification', [MidtransWebhookController::class, 'handle'])
    ->name('api.midtrans.notification');
