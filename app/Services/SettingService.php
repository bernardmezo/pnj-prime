<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("setting:{$key}", self::CACHE_TTL, function () use ($key, $default) {
            $setting = Setting::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            return $this->castValue($setting->value, $setting->type);
        });
    }

    public function set(string $key, mixed $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
        );

        Cache::forget("setting:{$key}");
    }

    public function isPpnEnabled(): bool
    {
        return (bool) $this->get('ppn_enabled', false);
    }

    public function getPpnRate(): ?int
    {
        $rate = $this->get('ppn_rate');

        return $rate !== null ? (int) $rate : null;
    }

    public function calculateTax(int $subtotal): int
    {
        if (! $this->isPpnEnabled()) {
            return 0;
        }

        $rate = $this->getPpnRate();

        if ($rate === null || $rate <= 0) {
            return 0;
        }

        return (int) round($subtotal * ($rate / 100));
    }

    private function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => in_array(strtolower($value), ['1', 'true', 'yes'], true),
            'integer' => (int) $value,
            'json'    => json_decode($value, true),
            default   => $value,
        };
    }
}
