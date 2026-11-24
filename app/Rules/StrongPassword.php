<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class StrongPassword implements Rule
{
    /**
     * Determine if the validation rule passes.
     */
    public function passes($attribute, $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        // Minimal 8 karakter
        if (strlen($value) < 8) {
            return false;
        }

        // Harus ada huruf besar
        if (! preg_match('/[A-Z]/', $value)) {
            return false;
        }

        // Harus ada huruf kecil
        if (! preg_match('/[a-z]/', $value)) {
            return false;
        }

        // Harus ada angka
        if (! preg_match('/[0-9]/', $value)) {
            return false;
        }

        // Harus ada simbol
        if (! preg_match('/[^A-Za-z0-9]/', $value)) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     */
    public function message(): array
    {
        return ['Kata sandi minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.'];
    }
}