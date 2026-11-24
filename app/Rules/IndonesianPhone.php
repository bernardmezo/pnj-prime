<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class IndonesianPhone implements Rule
{
    /**
     * Determine if the validation rule passes.
     * Format: 08xxxxxxxxx (max 13 digits) atau +628xxxxxxxxx / 628xxxxxxxxx (max 13 digits setelah 62)
     */
    public function passes($attribute, $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        // Hapus spasi, tanda hubung, dan tanda +
        $clean = preg_replace('/[\s\-\+]/', '', $value);

        // Pola: 08xxxxxxxxx (10-13 digit total) atau 628xxxxxxxxx (11-14 digit total tapi 62+8xxx = 10-13 digit setelah 62)
        // Atau +628xxxxxxxxx
        
        // Cek format 08xxx (10-13 digit)
        if (preg_match('/^08\d{8,11}$/', $clean)) {
            return true;
        }

        // Cek format 628xxx (11-14 digit, tapi 62 + 8xxx = 10-13 digit setelah 62)
        if (preg_match('/^628\d{8,11}$/', $clean)) {
            return true;
        }

        return false;
    }

    /**
     * Get the validation error message.
     */
    public function message(): array
    {
        return ['Gunakan nomor telepon Indonesia yang valid (contoh: 081234567890 atau +6281234567890), maksimal 13 digit.'];
    }
}