---
paths:
  - 'app/Http/Controllers/**'
  - 'app/Services/**'
  - 'app/Models/**'
  - 'app/Http/Requests/**'
  - 'app/Http/Middleware/**'
---

# Backend Architecture — Layering dan Aturan Bisnis

## Alur satu arah

```
Route → Middleware (auth · verified · role · fitur · permission) → Controller (tipis)
      → FormRequest (validasi) → Policy (otorisasi objek) → Service (logika bisnis) → Model
```

- Controller **tidak** berisi logika bisnis. Tiap controller idealnya < 60 baris isinya.
- Validasi masuk `FormRequest` (`app/Http/Requests/`), bukan `validate()` inline di controller.
- Otorisasi objek (kepemilikan objek) lewat **Policy**. Otorisasi kasar (role/fitur/aksi) lewat middleware yang sudah ada.

## Service layer

ADR-05. Logika bisnis wajib bisa diuji tanpa HTTP. Nama class yang sudah disepakati:

`TaxService` · `StockService` · `RoomBookingService` · `PengajuanWorkflow` · `QuoteService` · `AuditLogger` · `NotificationDispatcher` · `ReportService` · `LmsGateway`

Buat dengan `php artisan make:class Services/NamaService --no-interaction`.

## Sumber kebenaran tunggal untuk status

ADR-06. Saat ini ada **dua** sumber kebenaran dan itu bug:

- `app/Models/Pengajuan.php` — `const FLOW`, `const NEXT`
- `resources/js/lib/statuses.js` — `LAYANAN_FLOW`, `NEXT_STATUS`, `PRODUK_FLOW`

Rencana: `PengajuanWorkflow::transition()` menjadi **satu-satunya** jalur ubah status, dan frontend membaca peta transisi dari prop server. Sampai itu dikerjakan, **setiap perubahan status harus diubah di kedua tempat** dan test harus mengunci keduanya.

`Pengajuan::setStatus()` (panggil `pushHistory` lalu set kolom) adalah pembungkus yang sekarang dipakai controller. Jangan tulis status langsung ke kolom.

## Aturan uang

ADR-07.

- Uang = **integer rupiah**. Tidak ada float, tidak ada `decimal` untuk nominal yang disimpan.
- Pajak dibulatkan **half-up** ke rupiah.
- Tarif dan nominal pajak di-**snapshot** di order saat order dibuat. Ubah tarif master **tidak boleh** mengubah tagihan lama.

## Enum

Status pengajuan jadi `App\Enums\PengajuanStatus` (backed enum). Nilai enum = string Title Case yang sekarang dipakai (`Diajukan`, `Menunggu Pembayaran`, `Menunggu Verifikasi Pembayaran`, `Diproses`, `Selesai`) sehingga data lama tidak perlu migrasi.

`App\Enums\Role` = 6 nilai seperti di rule `backend-stack`.

Gunakan enum TitleCase untuk key. Jangan pakai konstanta string inline.

## Pintar, jangan berlebihan

- Jangan buat base folder baru di `app/` tanpa persetujuan.
- Kalau ada service yang mirip, **perbaiki** yang ada — jangan buat versi paralel.
- Jangan buat `Model` tanpa persetujuan pengguna; buat factory + seeder-nya juga.

## Route dan URL

Selalu pakai **named route** + `route()`. Jangan tulis URL sebagai string. Kalau butuh URL ke halaman Inertia, pakai `Inertia::render('Area/Page', [...])`.

Inertia v2: pakai `deferred props`, `prefetch`, `when` (flash data) sesuai dokumentasi versi — cek `inertia-laravel` docs sebelum memakai fitur baru.
