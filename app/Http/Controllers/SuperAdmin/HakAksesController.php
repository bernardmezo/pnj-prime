<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fitur;
use App\Models\Permission;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HakAksesController extends Controller
{
    /** The six roles that can hold permissions. */
    public const ROLES = ['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'];

    /** Actions that only make sense when the role can also see the fitur. */
    private const DEPENDENT_AKSI = ['Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

    public function index(): Response
    {
        $fitur = Fitur::orderBy('urutan')->orderBy('nama')->get()->map(fn ($f) => [
            'key' => $f->key,
            'name' => $f->nama,
            'desc' => $f->deskripsi,
            'active' => (bool) $f->aktif,
            'grup' => $f->grup ?? 'Lainnya',
            'aksi_tersedia' => $f->actions(),
            'urutan' => (int) $f->urutan,
            'locked' => $f->isProtected(),
        ])->values();

        $matriks = [];
        foreach (Permission::all(['role', 'fitur_key', 'aksi', 'allowed']) as $p) {
            $matriks[$p->role][$p->fitur_key][$p->aksi] = (bool) $p->allowed;
        }

        // Super Admin is locked to full access on every fitur's available
        // actions; reflect that in the matrix regardless of stored rows.
        foreach ($fitur as $f) {
            foreach ($f['aksi_tersedia'] as $aksi) {
                $matriks['super_admin'][$f['key']][$aksi] = true;
            }
        }

        $counts = User::query()
            ->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        $roleCounts = [];
        foreach (self::ROLES as $role) {
            $roleCounts[$role] = (int) ($counts[$role] ?? 0);
        }

        return Inertia::render('SuperAdmin/HakAkses', [
            'fitur' => $fitur,
            'matriks' => $matriks,
            'roleCounts' => $roleCounts,
            // Factory defaults per role, filtered to each fitur's actions —
            // powers the "Kembalikan ke bawaan" preset.
            'bawaan' => $this->defaultMatrixFor($fitur),
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

        $fiturs = Fitur::all()->keyBy('key');

        foreach ($data['matriks'] as $role => $fiturRows) {
            abort_unless(in_array($role, self::ROLES, true), 422, 'Peran tidak dikenal.');

            // Super Admin is locked: ignore client changes; enforced below.
            if ($role === 'super_admin') {
                continue;
            }

            foreach ($fiturRows as $fiturKey => $aksis) {
                abort_unless($fiturs->has($fiturKey), 422, 'Fitur tidak dikenal.');

                /** @var Fitur $fitur */
                $fitur = $fiturs[$fiturKey];
                $tersedia = $fitur->actions();

                $effective = [];
                foreach ($aksis as $aksi => $allowed) {
                    abort_unless(in_array($aksi, Permission::AKSI, true), 422, 'Aksi tidak dikenal.');
                    abort_unless(
                        in_array($aksi, $tersedia, true),
                        422,
                        "Aksi {$aksi} tidak tersedia untuk fitur {$fiturKey}."
                    );
                    $effective[$aksi] = (bool) $allowed;
                }

                // Dependency rule: Tambah/Ubah/Hapus/Verifikasi require Lihat on
                // the same fitur. Policy: auto-set Lihat = true (never reject).
                $anyDependent = false;
                foreach (self::DEPENDENT_AKSI as $d) {
                    if (! empty($effective[$d])) {
                        $anyDependent = true;
                        break;
                    }
                }
                if ($anyDependent && in_array('Lihat', $tersedia, true)) {
                    $effective['Lihat'] = true;
                }

                foreach ($effective as $aksi => $allowed) {
                    Permission::updateOrCreate(
                        ['role' => $role, 'fitur_key' => $fiturKey, 'aksi' => $aksi],
                        ['allowed' => $allowed]
                    );
                }
            }
        }

        $this->enforceSuperAdmin($fiturs);
        User::flushPermissionCache();

        return back()->with('success', 'Hak akses tersimpan.');
    }

    /**
     * Super Admin always keeps full access on every fitur's available actions.
     * The protected fitur are therefore never removed/nonaktif for it.
     */
    private function enforceSuperAdmin($fiturs): void
    {
        foreach ($fiturs as $fitur) {
            $tersedia = $fitur->actions();
            foreach (Permission::AKSI as $aksi) {
                $allowed = in_array($aksi, $tersedia, true);
                Permission::updateOrCreate(
                    ['role' => 'super_admin', 'fitur_key' => $fitur->key, 'aksi' => $aksi],
                    ['allowed' => $allowed]
                );
            }
        }
    }

    /**
     * Factory-default matrix (role => fitur => aksi => bool) constrained to the
     * actions each fitur exposes.
     *
     * @param  Collection<int, array<string, mixed>>  $fitur
     * @return array<string, array<string, array<string, bool>>>
     */
    private function defaultMatrixFor($fitur): array
    {
        $keys = $fitur->pluck('key')->all();
        $defaults = UsecaseSeeder::defaultMatrix($keys);

        $out = [];
        foreach (self::ROLES as $role) {
            foreach ($fitur as $f) {
                foreach ($f['aksi_tersedia'] as $aksi) {
                    $out[$role][$f['key']][$aksi] = (bool) ($defaults[$role][$f['key']][$aksi] ?? false);
                }
            }
        }

        return $out;
    }
}
