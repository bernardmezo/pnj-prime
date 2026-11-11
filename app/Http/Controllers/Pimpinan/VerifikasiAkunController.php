<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class VerifikasiAkunController extends Controller
{
    /**
     * Display a listing of pending internal/admin pengelola applications.
     */
    public function index(): Response
    {
        $pendingUsers = User::query()
            ->whereIn('role', ['admin_jurusan', 'admin_p3m'])
            ->where('account_status', 'pending')
            ->latest()
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'role_label' => \App\Enums\Role::from($u->role)->label(),
                'nip' => $u->nip,
                'jurusan' => $u->jurusan,
                'prodi' => $u->prodi,
                'phone' => $u->phone,
                'created_at' => optional($u->created_at)->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Pimpinan/VerifikasiAkun', [
            'pendingUsers' => $pendingUsers,
        ]);
    }

    /**
     * Approve the pending user account.
     */
    public function approve(User $user): RedirectResponse
    {
        if ($user->account_status !== 'pending') {
            abort(422, 'Hanya akun berstatus pending yang dapat disetujui.');
        }

        $user->update([
            'account_status' => 'active',
            'is_active' => true,
        ]);

        return back()->with('success', "Akun {$user->name} ({$user->role}) berhasil disetujui dan diaktifkan.");
    }

    /**
     * Reject the pending user account.
     */
    public function reject(Request $request, User $user): RedirectResponse
    {
        if ($user->account_status !== 'pending') {
            abort(422, 'Hanya akun berstatus pending yang dapat ditolak.');
        }

        $user->update([
            'account_status' => 'rejected',
            'is_active' => false,
        ]);

        return back()->with('success', "Akun {$user->name} ditolak.");
    }
}
