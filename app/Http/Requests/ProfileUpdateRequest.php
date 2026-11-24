<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Rules\IndonesianPhone;
use App\Rules\NumericOnly;
use App\Rules\StrongPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi profil sendiri. Field yang diizinkan dibedakan per role dan, untuk
 * Customer, per jenis akun (user_type) agar role/permission/status akun tidak
 * pernah lolos mass assignment.
 */
class ProfileUpdateRequest extends FormRequest
{
    /** Kunci data jenis akun yang disimpan di users.meta (sama dengan registrasi). */
    public const META_KEYS = [
        'npwp_perusahaan', 'penanggung_jawab', 'bidang_usaha',
        'nomor_mou_pks', 'contact_person', 'periode_kerja_sama',
    ];

    /**
     * Field tambahan Customer per jenis akun. true = wajib, false = opsional.
     * Masyarakat umum, civitas (SSO), dan jenis kosong tidak punya field tambahan.
     */
    public const CUSTOMER_TYPE_FIELDS = [
        'Industri/Perusahaan' => [
            'institution' => true,
            'npwp_perusahaan' => false,
            'penanggung_jawab' => true,
            'bidang_usaha' => false,
        ],
        'Mitra kerja sama' => [
            'institution' => true,
            'nomor_mou_pks' => false,
            'contact_person' => true,
            'periode_kerja_sama' => false,
        ],
        'Perguruan tinggi/lembaga lain' => [
            'institution' => true,
        ],
    ];

    /**
     * Rapikan nomor telepon (spasi/tanda hubung) sebelum divalidasi. Email akun
     * SSO dikunci: nilai kiriman diabaikan agar tautan SSO tidak putus.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('phone'))) {
            $this->merge(['phone' => preg_replace('/[\s-]/', '', $this->input('phone'))]);
        }

        if ($this->user()?->isFromSso()) {
            $this->merge(['email' => $this->user()->email]);
        }
    }

    /**
     * Field tambahan yang berlaku untuk user ini (kosong bila tidak ada).
     *
     * @return array<string, bool>
     */
    public function customerExtraFields(): array
    {
        $user = $this->user();

        return $user->role === 'customer'
            ? (self::CUSTOMER_TYPE_FIELDS[$user->user_type] ?? [])
            : [];
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isUnit = in_array($user->role, ['admin_pengelola', 'admin_jurusan', 'admin_p3m'], true);

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'phone' => ['required', 'string', new IndonesianPhone()],
        ];

        // Alamat dan kode pos: Customer dan unit pengelola.
        if ($user->role === 'customer' || $isUnit) {
            $rules['address'] = ['nullable', 'string', 'max:2000'];
            $rules['postal_code'] = ['nullable', 'string', 'regex:/^\d{5}$/'];
        }

        if ($isUnit) {
            $rules['institution'] = ['nullable', 'string', 'max:255'];
            $rules['unit_name'] = ['nullable', 'string', 'max:150'];
            $rules['jurusan'] = ['nullable', 'string', 'max:100'];
            $rules['nik_npwp'] = ['nullable', 'string', 'max:32', new NumericOnly()];
            $rules['nip'] = ['nullable', 'string', 'max:30', new NumericOnly()];
        }

        foreach ($this->customerExtraFields() as $field => $required) {
            $rule = [$required ? 'required' : 'nullable', 'string', 'max:255'];
            if (in_array($field, ['nik_npwp', 'npwp_perusahaan', 'nip'], true)) {
                $rule[] = new NumericOnly();
            }
            $rules[$field] = $rule;
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Nomor telepon wajib diisi.',
            'phone.indonesian_phone' => 'Gunakan nomor telepon Indonesia yang valid (contoh: 081234567890 atau +6281234567890), maksimal 13 digit.',
            'postal_code.regex' => 'Kode pos harus terdiri dari 5 digit angka.',
            'email.unique' => 'Alamat email sudah digunakan akun lain.',
            'institution.required' => 'Nama instansi/perusahaan wajib diisi.',
            'penanggung_jawab.required' => 'Nama penanggung jawab wajib diisi.',
            'contact_person.required' => 'Nama contact person wajib diisi.',
        ];
    }

    /**
     * Hanya field eksplisit yang boleh disimpan. Kunci users.meta hanya
     * disentuh bila termasuk field jenis akun ini; kunci lain dibiarkan.
     */
    public function attributesToSave(): array
    {
        $data = $this->validated();
        $user = $this->user();

        $metaInput = array_intersect_key($data, array_flip(self::META_KEYS));
        $columns = array_diff_key($data, $metaInput);

        if ($metaInput !== []) {
            $meta = $user->meta ?? [];
            foreach ($metaInput as $key => $value) {
                if ($value === null || $value === '') {
                    unset($meta[$key]);
                } else {
                    $meta[$key] = $value;
                }
            }
            $columns['meta'] = $meta === [] ? null : $meta;
        }

        return $columns;
    }
}
