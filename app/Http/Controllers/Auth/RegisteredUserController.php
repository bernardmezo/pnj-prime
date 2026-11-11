<?php

namespace App\Http\Controllers\Auth;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Roles allowed via public self-registration for internal (staff) accounts.
     * Each requires NIP, jurusan, prodi and goes through Pimpinan RTPU approval.
     */
    private const INTERNAL_ROLES = ['admin_jurusan', 'admin_p3m'];

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'internalRoles' => collect(self::INTERNAL_ROLES)->map(fn (string $r) => [
                'value' => $r,
                'label' => Role::from($r)->label(),
            ])->values()->all(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $registrationType = $request->input('registration_type', 'external');

        if ($registrationType === 'internal') {
            return $this->storeInternal($request);
        }

        return $this->storeExternal($request);
    }

    /**
     * External (customer/masyarakat) registration — existing flow.
     */
    private function storeExternal(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'nullable|string|max:20',
            'institution' => 'nullable|string|max:255',
            'user_type' => 'nullable|string|max:64',
            'nik_npwp' => 'nullable|string|max:32',
            'terms' => 'required|accepted',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'account_origin' => 'local_simulation',
            'phone' => $request->phone,
            'institution' => $request->institution,
            'user_type' => $request->user_type,
            'nik_npwp' => $request->nik_npwp,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Internal (admin_jurusan / admin_p3m) registration.
     * Account is created with status 'pending' — Pimpinan RTPU must approve.
     */
    private function storeInternal(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'in:'.implode(',', self::INTERNAL_ROLES)],
            'nip' => 'required|string|max:30',
            'jurusan' => 'required|string|max:100',
            'prodi' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'terms' => 'required|accepted',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'account_origin' => 'local_simulation',
            'account_status' => 'pending',
            'is_active' => false,
            'nip' => $request->nip,
            'jurusan' => $request->jurusan,
            'prodi' => $request->prodi,
            'phone' => $request->phone,
        ]);

        event(new Registered($user));

        // Do NOT log them in — account needs approval first
        return redirect(route('login', absolute: false))
            ->with('status', 'Pendaftaran berhasil. Akun Anda akan diaktifkan setelah disetujui oleh Pimpinan RTPU.');
    }
}
