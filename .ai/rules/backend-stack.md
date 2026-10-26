---
paths:
  - 'app/**'
  - 'routes/**'
  - 'database/**'
  - 'config/**'
  - 'resources/js/**'
  - 'composer.json'
  - 'package.json'
---

# Backend Stack — PNJ PRIME

Stack yang dipakai adalah **monolit Laravel 13 + Inertia v2**, dengan API JSON tipis sebagai pelengkap. Jangan mengganti stack ini.

## Versi terverifikasi

Jangan menebak versi. Baca dari lockfile, bukan dari range di manifest.

- PHP 8.4 · Laravel Framework **13.32.0** (`vendor/laravel/framework/composer.json`)
- Inertia `^2.0` · React `^18.2` · Tailwind `^3.4` · Vite `^8.0` · Vitest `^5.0`
- PostgreSQL **17.11** (portable lokal di `$LOCALAPPDATA/pnjprime-pg`, bin di `pgsql/bin`)
- Dependency backend yang terpasang: `laravel/sanctum ^4.0`, `laravel/tinker ^3.0`, `tightenco/ziggy ^2.0`

Perintah cek: `composer show --direct`, `cat vendor/laravel/framework/composer.json | grep version`, `cat package.json`.

## Larangan stack

- **Jangan** pisahkan backend jadi service terpisah, jangan buat repo API terpisah, jangan tulis ulang jadi REST-only. ADR-01: 89 route + 43 halaman Inertia sudah jalan; FR/NFR tidak meminta API publik; waktu proyek 8 pekan.
- **Jangan** pakai ORM lain. ADR-02: Eloquent. Roadmap lama yang menyebut Prisma sudah dikoreksi — abaikan.
- **Jangan** pakai SQLite atau MySQL. ADR-03: PostgreSQL satu-satunya DB target **dan** DB test. Cabang SQLite/MySQL di migrasi tidak boleh dipakai.
- **Jangan** tambah dependency tanpa persetujuan pengguna. `laravel-lang/lang` dan `openspout` **belum terpasang** — `composer require` butuh persetujuan eksplisit lebih dulu (lihat `docs/BACKEND_DEVELOPMENT_PLAN.md` D-10 dan WP-3.5).

## Konvensi yang sudah ada — ikuti, jangan buat ulang

- Service class: `app/Services/` (`SettingService`, `app/Services/Auth/`). Ada pola cache-TTL-300 di `SettingService::get()`.
- Middleware RBAC: `app/Http/Middleware/EnsureRole.php`, `EnsurePermission.php`, `EnsureFitur.php`. Alias sudah terdaftar di `bootstrap/app.php`.
- Model: `app/Models/`, fillable eksplisit, cast deklaratif di `casts()`.
- Role ke-6: `customer`, `admin_rtpu`, `admin_p3m`, `pimpinan_rtpu`, `direktur`, `super_admin` — lihat `App\Enums\Role` (belum ada, buat saat WP-1.2).

## Build & verifikasi

- `npm run build` — wajib hijau setelah ubah frontend. Build saat ini **sudah hijau**, `npx vitest run` **39/39 passed**.
- `vendor/bin/pint --dirty --format agent` — wajib setelah ubah file PHP. Jangan pakai `pint --test` untuk memperbaiki, pakai `--format agent`.
- `php artisan route:list` untuk cek route. `php artisan route:list --json` untuk dump terstruktur.
