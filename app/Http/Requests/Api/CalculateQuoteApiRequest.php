<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CalculateQuoteApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'jumlah_peserta' => ['nullable', 'integer', 'min:1'],
            'opsi_ids' => ['nullable', 'array'],
            'opsi_ids.*' => ['integer', 'exists:opsis,id'],
        ];
    }
}
