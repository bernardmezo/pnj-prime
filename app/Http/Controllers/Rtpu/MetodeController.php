<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MetodeController extends Controller
{
    private function serialize(MetodePembayaran $m): array
    {
        return [
            'id' => $m->id,
            'name' => $m->nama,
            'type' => $m->tipe,
            'account' => $m->rekening,
            'holder' => $m->holder,
            'instructions' => $m->instruksi,
            'active' => (bool) $m->aktif,
        ];
    }

    public function index(): Response
    {
        $rows = MetodePembayaran::orderBy('nama')->get()->map(fn ($m) => $this->serialize($m));

        return Inertia::render('Rtpu/MetodePembayaran/Index', ['metode' => $rows]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:40',
            'account' => 'required|string|max:255',
            'holder' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:2000',
            'active' => 'nullable|boolean',
        ]);

        MetodePembayaran::create([
            'nama' => $data['name'],
            'tipe' => $data['type'],
            'rekening' => $data['account'],
            'holder' => $data['holder'],
            'instruksi' => $data['instructions'] ?? null,
            'aktif' => (bool) ($data['active'] ?? true),
        ]);

        return back()->with('success', 'Metode pembayaran ditambahkan.');
    }

    public function update(Request $request, MetodePembayaran $metode)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:40',
            'account' => 'required|string|max:255',
            'holder' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:2000',
            'active' => 'nullable|boolean',
        ]);

        if (array_key_exists('active', $data) && ! $data['active'] && $metode->aktif
            && MetodePembayaran::where('aktif', true)->where('id', '!=', $metode->id)->count() === 0) {
            return back()->withErrors(['active' => 'Minimal satu metode pembayaran harus tetap aktif.']);
        }

        $metode->update([
            'nama' => $data['name'],
            'tipe' => $data['type'],
            'rekening' => $data['account'],
            'holder' => $data['holder'],
            'instruksi' => $data['instructions'] ?? null,
            'aktif' => (bool) ($data['active'] ?? true),
        ]);

        return back()->with('success', 'Metode pembayaran diperbarui.');
    }

    public function destroy(MetodePembayaran $metode)
    {
        if ($metode->aktif
            && MetodePembayaran::where('aktif', true)->where('id', '!=', $metode->id)->count() === 0) {
            return back()->withErrors(['metode' => 'Tidak dapat menghapus satu-satunya metode pembayaran yang aktif.']);
        }

        $metode->delete();

        return back()->with('success', 'Metode pembayaran dihapus.');
    }
}
