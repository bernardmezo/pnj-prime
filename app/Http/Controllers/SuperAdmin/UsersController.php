<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\IndonesianPhone;
use App\Rules\NumericOnly;
use App\Rules\StrongPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public const ROLES = ['customer', 'admin_rtpu', 'admin_pengelola', 'pimpinan_rtpu', 'direktur', 'super_admin'];

    private const PENGELOLA_ROLES = ['admin_p3m', 'admin_jurusan', 'admin_pengelola'];

    private const PROFILE_FIELDS = ['phone', 'institution', 'user_type', 'nik_npwp', 'nip', 'jurusan', 'prodi'];

    private const META_FIELDS = ['npwp_perusahaan', 'penanggung_jawab', 'bidang_usaha', 'nomor_mou_pks', 'contact_person', 'periode_kerja_sama'];

    private function profileRules(): array
    {
        return [
            'phone' => 'nullable|string|max:20', 'institution' => 'nullable|string|max:255',
            'user_type' => 'nullable|string|max:64', 'nik_npwp' => 'nullable|string|max:32',
            'nip' => 'nullable|string|max:30', 'jurusan' => 'nullable|string|max:100', 'prodi' => 'nullable|string|max:100',
            'npwp_perusahaan' => 'nullable|string|max:32', 'penanggung_jawab' => 'nullable|string|max:255',
            'bidang_usaha' => 'nullable|string|max:255', 'nomor_mou_pks' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255', 'periode_kerja_sama' => 'nullable|string|max:100',
        ];
    }

    private function saveProfile(User $user, array $data): void
    {
        $user->fill(collect($data)->only(self::PROFILE_FIELDS)->all());
        $meta = $user->meta ?? [];
        foreach (self::META_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $meta[$field] = $data[$field];
            }
        }
        $user->meta = $meta ?: null;
        $user->save();
    }

    public function index(): Response
    {
        $rows = User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'phone', 'institution', 'user_type', 'nik_npwp', 'nip', 'jurusan', 'prodi', 'meta'])
            ->latest()
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'status' => $u->is_active ? 'Aktif' : 'Nonaktif',
                ...$u->only(self::PROFILE_FIELDS),
                ...collect($u->meta ?? [])->only(self::META_FIELDS)->all(),
            ]);

        return Inertia::render('SuperAdmin/Users/Index', ['users' => $rows]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', new StrongPassword()],
            'role' => ['required', Rule::in(self::ROLES)],
            'pengelola_variant' => ['required_if:role,admin_pengelola', 'nullable', Rule::in(['admin_p3m', 'admin_jurusan'])],
            'phone' => ['nullable', new IndonesianPhone()],
            'institution' => 'nullable|string|max:255',
            'user_type' => 'nullable|string|max:64',
            'nik_npwp' => ['nullable', 'string', 'max:32', new NumericOnly()],
            'nip' => ['nullable', 'string', 'max:30', new NumericOnly()],
            'jurusan' => 'nullable|string|max:100',
            'prodi' => 'nullable|string|max:100',
            'npwp_perusahaan' => ['nullable', 'string', 'max:32', new NumericOnly()],
            'penanggung_jawab' => 'nullable|string|max:255',
            'bidang_usaha' => 'nullable|string|max:255',
            'nomor_mou_pks' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'periode_kerja_sama' => 'nullable|string|max:100',
        ]);

        $role = $data['role'] === 'admin_pengelola' ? $data['pengelola_variant'] : $data['role'];
        $pending = in_array($role, self::PENGELOLA_ROLES, true);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
            'account_origin' => 'local_simulation',
            'email_verified_at' => now(),
            'account_status' => $pending ? 'pending' : 'active',
            'is_active' => ! $pending,
        ]);
        $this->saveProfile($user, $data);

        return back()->with('success', 'User ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', new StrongPassword()],
            'role' => ['required', Rule::in(array_unique([...self::ROLES, $user->role]))],
            'pengelola_variant' => ['required_if:role,admin_pengelola', 'nullable', Rule::in($user->role === 'admin_pengelola' ? self::PENGELOLA_ROLES : ['admin_p3m', 'admin_jurusan'])],
            'active' => 'nullable|boolean',
            'phone' => ['nullable', new IndonesianPhone()],
            'institution' => 'nullable|string|max:255',
            'user_type' => 'nullable|string|max:64',
            'nik_npwp' => ['nullable', 'string', 'max:32', new NumericOnly()],
            'nip' => ['nullable', 'string', 'max:30', new NumericOnly()],
            'jurusan' => 'nullable|string|max:100',
            'prodi' => 'nullable|string|max:100',
            'npwp_perusahaan' => ['nullable', 'string', 'max:32', new NumericOnly()],
            'penanggung_jawab' => 'nullable|string|max:255',
            'bidang_usaha' => 'nullable|string|max:255',
            'nomor_mou_pks' => 'nullable|string|max:100',
            'contact_person' => 'nullable|string|max:255',
            'periode_kerja_sama' => 'nullable|string|max:100',
        ]);

        $role = $data['role'] === 'admin_pengelola' ? $data['pengelola_variant'] : $data['role'];
        if ($user->role === 'customer' && in_array($role, self::PENGELOLA_ROLES, true)) {
            throw ValidationException::withMessages([
                'role' => 'Akun customer tidak dapat diubah menjadi pengelola.',
            ]);
        }
        abort_if($user->id === Auth::id() && $role !== 'super_admin', 403, 'Tidak dapat mencabut peran Super Admin milik sendiri.');
        $enteringPengelola = in_array($role, self::PENGELOLA_ROLES, true) && $role !== $user->role;
        $pending = $enteringPengelola || (in_array($role, self::PENGELOLA_ROLES, true) && $user->account_status !== 'active');

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $role,
            'is_active' => $pending ? false : (bool) ($data['active'] ?? $user->is_active),
        ]);
        if ($enteringPengelola) {
            $user->account_status = 'pending';
        }
        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $this->saveProfile($user, $data);

        return back()->with('success', 'User diperbarui.');
    }

    public function destroy(User $user)
    {
        abort_if($user->id === Auth::id(), 403, 'Tidak dapat menghapus akun sendiri.');

        $user->delete();

        return back()->with('success', 'User dihapus.');
    }

    public function toggle(User $user)
    {
        abort_if($user->id === Auth::id(), 403, 'Tidak dapat menonaktifkan akun sendiri.');

        abort_if(in_array($user->role, self::PENGELOLA_ROLES, true) && $user->account_status !== 'active' && ! $user->is_active, 422, 'Akun pengelola harus disetujui terlebih dahulu.');

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', $user->is_active ? 'User diaktifkan.' : 'User dinonaktifkan.');
    }
}
