---
paths:
  - 'routes/api.php'
  - 'app/Http/Controllers/Api/**'
  - 'app/Http/Resources/**'
  - 'app/Http/Middleware/HandleInertiaRequests.php'
---

# Backend API — Kontrak JSON

## Prinsip

API di PNJ PRIME adalah **pelengkap**, bukan inti. Aplikasi utama Inertia SPA. ADR-10: hanya endpoint JSON yang benar-benar dibutuhkan.

Endpoint yang citronya perlu:

| Endpoint | WP | Fungsi |
|---|---|---|
| `POST /pengajuan/quote` | WP-2.5 | hitung subtotal, opsi/add-on, pajak, total **di server** |
| Notifikasi (list, unread count, mark read) | WP-3.1 | lonceng notifikasi |
| LMS handoff + log akses | WP-3.6 | redirect ke LMS eksternal |
| Status ekspor | WP-3.5 | progres ekspor laporan |

**Harga tidak pernah dihitung di klien sebagai sumber kebenaran** (DAR-CUS-02). Server yang menentukan.

## Format respons

```json
{ "success": true, "data": { }, "message": "..." }
{ "success": false, "message": "...", "errors": { "field": ["pesan"] } }
```

- Galat seragam: `{success, message, errors[]}`.
- Pesan **berbahasa Indonesia baku** (NFR9). Lihat rule `backend-i18n`.
- Validasi: `422` + `errors` per field.

## Error handling

- `bootstrap/app.php` sudah set `shouldRenderJsonWhen(fn ($r) => $r->is('api/*') || $r->expectsJson())` — API otomatis dapat JSON error.
- 404 resource hilang → `404`. Otorisasi gagal → `403` **tanpa** membocorkan detail (jangan sebut "file exists tapi bukan milikmu").
- Exception handling terpusat di `bootstrap/app.php` (`withExceptions`). Jangan try/catch manual per controller kecuali memang mau mengubah status code.

## Versi & autentikasi

- Kalau butuh API publik/ber-token: `laravel/sanctum ^4.0` sudah terpasang. `config/sanctum.php` **belum ada** — publish dulu (`php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction`) sebelum pakai.
- Endpoint internal yang dipakai frontend Inertia: pakai session + CSRF, **jangan** Sanctum token. Dua jalur auth berbeda, jangan campur.
- API versioning: pakai prefix `/api/v1` untuk endpoint yang menghadap publik.

## Eloquent Resource

- Untuk response API yang berbentuk array/list, gunakan **Eloquent API Resource** (`App\Http\Resources/`), bukan `->get()` mentah. Folder belum ada — buat saat pertama memakainya.
- Jangan bocorkan PII: NIK, NPWP, `ktp_number`, `npwp_number`, `nik_npwp` **tidak boleh** muncul di response API, laporan, atau halaman publik. Masker sebagian (mis. `****1234`).

## Flash message (T-25) —WAJIB DIPERBAIKI

Ini bug yang masih hidup: **32 `redirect()->with('success', ...)` di controller domain tidak pernah sampai ke user**, karena `HandleInertiaRequests::share()` hanya share `errors`, `auth`, `fitur`, `sso_enabled`. `grep -rn "flash" app/ resources/js/` → **0 hit**.

Perbaikan yang benar (opsi a dari audit): share flash di `HandleInertiaRequests::share()`, lalu render di layout.

```php
'flash' => fn (): array => [
    'success' => $request->session()->get('success'),
    'error'   => $request->session()->get('error'),
],
```

**Jangan** mulai membangun sistem notifikasi (WP-3.1) sebelum flash channel ini hidup — kalau tidak, notifikasi ditumpuk di atas kanal yang mati.

## Form request Inertia

Validasi form Inertia **tidak diubah** oleh API contract. FormRequest yang sama bisa dipakai, tapi response error-nya untuk request Inertia tetap redirect-back dengan errors, bukan JSON 422. Jangan bedakan perilaku untuk dua tipe request itu.
