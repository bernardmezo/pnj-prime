<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fitur;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FiturController extends Controller
{
    /** Fitur that can never be deactivated or deleted (lockout prevention). */
    public const PROTECTED = ['pengguna', 'hak-akses', 'fitur'];

    public function index(): Response
    {
        $rows = Fitur::orderBy('nama')->get()->map(fn ($f) => [
            'key' => $f->key,
            'name' => $f->nama,
            'desc' => $f->deskripsi,
            'active' => (bool) $f->aktif,
        ]);

        return Inertia::render('SuperAdmin/Fitur/Index', ['fitur' => $rows]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:64|unique:fitur,key|regex:/^[a-z0-9-]+$/',
            'desc' => 'nullable|string|max:1000',
            'active' => 'nullable|boolean',
        ]);

        Fitur::create([
            'nama' => $data['name'],
            'key' => $data['key'],
            'deskripsi' => $data['desc'] ?? null,
            'aktif' => (bool) ($data['active'] ?? true),
        ]);

        return back()->with('success', 'Fitur ditambahkan.');
    }

    public function update(Request $request, Fitur $fitur)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string|max:1000',
            'active' => 'nullable|boolean',
        ]);

        if (in_array($fitur->key, self::PROTECTED, true) && array_key_exists('active', $data) && ! $data['active']) {
            abort(422, 'Fitur ini dilindungi dan tidak dapat dinonaktifkan.');
        }

        $fitur->update([
            'nama' => $data['name'],
            'deskripsi' => $data['desc'] ?? null,
            'aktif' => (bool) ($data['active'] ?? true),
        ]);

        return back()->with('success', 'Fitur diperbarui.');
    }

    public function destroy(Fitur $fitur)
    {
        abort_if(in_array($fitur->key, self::PROTECTED, true), 422, 'Fitur ini dilindungi dan tidak dapat dihapus.');

        Permission::where('fitur_key', $fitur->key)->delete();
        $fitur->delete();

        return back()->with('success', 'Fitur dihapus.');
    }
}
