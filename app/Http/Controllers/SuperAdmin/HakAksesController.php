<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fitur;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HakAksesController extends Controller
{
    public function index(): Response
    {
        $fitur = Fitur::orderBy('nama')->get(['key', 'nama as name', 'deskripsi as desc', 'aktif as active']);

        $matriks = [];
        foreach (Permission::all(['role', 'fitur_key', 'aksi', 'allowed']) as $p) {
            $matriks[$p->role][$p->fitur_key][$p->aksi] = (bool) $p->allowed;
        }

        return Inertia::render('SuperAdmin/HakAkses', [
            'fitur' => $fitur,
            'matriks' => $matriks,
        ]);
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'matriks' => 'required|array',
            'matriks.*' => 'array',
            'matriks.*.*' => 'array',
            'matriks.*.*.*' => 'boolean',
        ]);

        $roles = ['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'];
        $fiturKeys = Fitur::pluck('key')->all();

        foreach ($data['matriks'] as $role => $fiturs) {
            abort_unless(in_array($role, $roles, true), 422, 'Peran tidak dikenal.');
            foreach ($fiturs as $fiturKey => $aksis) {
                abort_unless(in_array($fiturKey, $fiturKeys, true), 422, 'Fitur tidak dikenal.');
                foreach ($aksis as $aksi => $allowed) {
                    abort_unless(in_array($aksi, Permission::AKSI, true), 422, 'Aksi tidak dikenal.');
                    Permission::updateOrCreate(
                        ['role' => $role, 'fitur_key' => $fiturKey, 'aksi' => $aksi],
                        ['allowed' => (bool) $allowed]
                    );
                }
            }
        }

        User::flushPermissionCache();

        return back()->with('success', 'Hak akses tersimpan.');
    }
}
