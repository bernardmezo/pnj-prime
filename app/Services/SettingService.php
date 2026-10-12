<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
        $old = Setting::where('key', $key)->first();

        $setting = Setting::firstOrNew(['key' => $key]);
        $setting->value = is_bool($value) ? ($value ? '1' : '0') : (string) $value;
        if (! $setting->exists) {
            $setting->label = $key;
            $setting->type = 'string';
        }
        $setting->save();

        Cache::forget("setting:{$key}");

        DB::table('settings_audit')->insert([
            'key' => $key,
            'old_value' => $old?->value,
            'new_value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
            'changed_by' => Auth::id(),
            'changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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

    public function getPpnThreshold(): int
    {
        return (int) ($this->get('ppn_threshold', 0) ?? 0);
    }

    public function calculateTax(int $subtotal): int
    {
        if (! $this->isPpnEnabled()) {
            return 0;
        }

        if ($subtotal <= $this->getPpnThreshold()) {
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
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}
