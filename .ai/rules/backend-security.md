---
paths:
  - 'app/Http/Controllers/**'
  - 'app/Http/Middleware/**'
  - 'app/Models/User.php'
  - 'app/Sso/**'
  - 'config/filesystems.php'
  - 'config/session.php'
  - 'config/auth.php'
---

# Backend Security

## Otorisasi — berlapis, di server

Tiga lapis, semua di server (bukan hanya di UI):

1. `auth` — login required
2. `verified` — email terverifikasi
3. `role:` / `fitur:` / `permission:` — `EnsureRole`, `EnsureFitur`, `EnsurePermission`

Otorisasi tingkat objek (apakah user ini pemilik) → **Policy** atau cek eksplisit di controller/service. `FileController::show()` adalah contoh pola yang benar: `abort_unless(...)`.

Super Admin **tidak boleh kehilangan wewenang** (BR-16) — `User::canDo()` selalu `true` untuk `super_admin`.

##middleware wajib

- Otorisasi checked di middleware, Policy, atau FormRequest. **Tidak boleh** hanya di UI.
- Unknown permission key → **deny** (fail-closed). `User::canDo()` sudah begitu.
- `EnsureFitur` fail-**open** saat baris fitur tidak ada (flag hanya memblokir saat eksplisit dinonaktifkan). Kalau sebuah fitur baru wajib diblokir sampai dikonfigurasi, buat baris fiturnya di seeder.

## File privat (T-4) — belum ditutup

Semua unggahan saat ini ke disk **publik**:

- `app/Http/Controllers/Customer/PengajuanController.php` — `->store('dokumen-pengajuan', 'public')`, `->store('bukti', 'public')`
- `app/Http/Controllers/P3M/ProdukUnggulanController.php` — `->store('dokumen', 'public')`

Target (ADR-08): disk `local` (`storage/app/private`), database hanya menyimpan **path relatif**, akses hanya lewat `berkas.show`.

**Penting — disk `local` saat ini auto-serve publik.** `config/filesystems.php` punya `'serve' => true` pada disk `local`, sehingga Laravel mendaftarkan route `GET /storage/{path}` (`Illuminate\Filesystem\FilesystemServiceProvider`). Route ini **signature-gated, bukan auth-gated**. Memindahkan file ke `local` **tidak otomatis** menutup T-4 — set `'serve' => false`, atau file tetap bisa diambil lewat route itu.

Lampiran yang harus ikut saat memakai disk `local`:

- Validasi **MIME asli**, bukan hanya ekstensi
- Header `X-Content-Type-Options: nosniff` saat mengirim berkas
- `Storage::disk('local')->response()` / `->download()`, bukan `response()->file()` ke path absolut

## PII

- NIK, NPWP, `ktp_number`, `npwp_number`, `nik_npwp` **tidak boleh** muncul di halaman publik, laporan, atau response API.
- Enkripsi di application layer: `encrypted` cast untuk `npwp`/`nik` di `tenant_profiles` (WP-2.6).
- Kalau perlu ditampilkan sebagian, masker (mis. `****1234`).
- Audit aksi Super Admin (user, fitur, hak akses) **wajib** tercatat — lihat `settings_audit` yang sudah ada untuk settings.

## Autentikasi

- Throttle login: `LoginRequest` harus memanggil `RateLimiter::hit($key, 900)` agar jendela kunci **15 menit** (NFD-3). Saat ini masih 60 detik.
- Throttle umum: `throttle:100,1` pada grup route.
- `SESSION_SECURE_COOKIE=true` di produksi.
- **Jangan** cetak `DB_PASSWORD` untuk verifikasi — cek placeholder/kosong, laporkan panjang saja, atau jalankan query bukti (`DB::connection()->getPdo()`).
- Jangan pernah kirim password sebagai argumen shell (`php -r '...' "$PW"`).

## SSO

- `app/Sso/SsoProvider.php` = kontrak. `NullSsoProvider` = default saat SSO mati. `SsoEnabledTest`/`SsoDisabledTest` sudah mengunci kedua perilaku.
- SSO **hanya boleh** membuat role `customer`. Email staff tidak boleh dibuat atau di-elevate lewat SSO (test sudah mengunci ini).
- `SSO_ENABLED` + 4 variabel `SSO_PNJ_*` belum ada di `.env` maupun `.env.example` (T-23).

## Email terverifikasi (T-28)

`App\Models\User` **tidak** mengimplementasikan `MustVerifyEmail`, sehingga middleware `verified` di `routes/web.php` praktis no-op. Kalau verifikasi email jadi syarat, `User` harus implements `Illuminate\Contracts\Auth\MustVerifyEmail`.
