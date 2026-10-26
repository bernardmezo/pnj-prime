<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StorePengajuanApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tipe' => ['required', 'string', 'in:jasa,ruangan,produk'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'keperluan' => ['nullable', 'string', 'max:2000'],
            'jumlah' => ['nullable', 'string', 'max:100'],
            'tanggal' => ['nullable', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['nullable', 'date_format:H:i'],
            'jam_selesai' => ['nullable', 'date_format:H:i', 'after:jam_mulai'],
            'peserta' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'metode_pengambilan' => ['nullable', 'string', 'max:100'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'opsi' => ['nullable', 'array'],
            'opsi.*.id' => ['required', 'integer'],
            'opsi.*.qty' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
