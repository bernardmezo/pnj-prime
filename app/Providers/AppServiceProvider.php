<?php

namespace App\Providers;

use App\Services\Auth\AuthServiceInterface;
use App\Services\Auth\LocalAuthService;
use App\Services\SettingService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Binds AuthServiceInterface to LocalAuthService (simulation mode).
     * To enable SSO PNJ, replace LocalAuthService with SsoAuthService here —
     * no changes required elsewhere in the codebase.
     */
    public function register(): void
    {
        $this->app->singleton(
            AuthServiceInterface::class,
            LocalAuthService::class,
        );

        $this->app->singleton(SettingService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
