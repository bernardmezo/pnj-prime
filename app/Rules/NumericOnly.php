<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class NumericOnly implements Rule
{
    /**
     * Determine if the validation rule passes.
     */
    public function passes($attribute, $value): bool
    {
        if (! is_string($value) && ! is_int($value)) {
            return false;
        }

        $strValue = (string) $value;

        // Only allow digits (0-9)
        return preg_match('/^\d+$/', $strValue) === 1;
    }

    /**
     * Get the validation error message.
     */
    public function message(): array
    {
        return ['Hanya boleh berisi angka (0-9).'];
    }
}