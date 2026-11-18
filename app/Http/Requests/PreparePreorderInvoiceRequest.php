<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreparePreorderInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin_rtpu', 'super_admin'], true);
    }

    public function rules(): array
    {
        return [
            'unit_price' => 'required|integer|min:1|max:1000000000',
            'shipping_amount' => 'nullable|integer|min:0|max:1000000000',
            'shipping_courier' => 'nullable|string|max:20',
            'shipping_service' => 'nullable|string|max:100',
            'tax_rate' => ['required', 'regex:/^\d{1,3}(?:\.\d{1,2})?$/D', 'numeric', 'between:0,100'],
            'bank_id' => 'required|integer|exists:metode_pembayaran,id',
            'due_date' => 'required|date|after:today',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
