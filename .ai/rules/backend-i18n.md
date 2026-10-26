---
paths:
  - 'lang/**'
  - 'resources/lang/**'
  - 'app/Http/Controllers/**'
  - 'app/Http/Requests/**'
  - 'config/app.php'
  - '.env'
  - '.env.example'
---

# Backend i18n — Bahasa Indonesia

NFR9: **seluruh** antarmuka berbahasa Indonesia baku. Ini kriteria rilis di Gate G4, bukan preferensi.

## Kondisi sekarang — belum terpenuhi (T-13)

Seluruh pesan validasi dan auth dari server keluar dalam **Bahasa Inggris**. `APP_LOCALE=en` di `.env`, dan direktori `lang/` **belum ada**.

## Target (WP-1.8)

1. Buat `lang/id/`.
2. `APP_LOCALE=id` di `.env` **dan** `.env.example` (harus sinkron — salah satu saja tidak cukup).
3. Semua pesan validasi (`resources/lang/id/validation.php`), auth (`auth.php`, `passwords.php`), dan pesan domain berbahasa Indonesia baku.

## Pakai `__()` / `trans()`, jangan string inline

```php
// salah
return 'Bukti pembayaran terkirim, menunggu verifikasi.';

// benar
return __('pengajuan.bukti_terkirim');
```

Pesan yang sudah ada di controller (32 titik `->with('success', ...)`) **tidak** berbahasa Indonesia. Saat memindahkan ke `lang/id`, jangan hanya memindah — juga terjemahkan.

## Paket `laravel-lang/lang` — belum terpasang

D-10: opsinya (a) paket `laravel-lang/lang`, (b) berkas `lang/id` manual.

- Paket **belum terpasang** (`vendor/laravel-lang` tidak ada) — `composer require` butuh persetujuan pengguna.
- Kompatibilitas dengan Laravel 13 harus dicek dulu (R-10). Kalau gagal, jatuh ke opsi (b).
- D-10 sudah punya default: (a) bila kompatibel, kalau tidak (b).

## Istilah baku

Pakai istilah Indonesia baku yang konsisten:

| Inggris | Indonesia |
|---|---|
| Submit | Kirim |
| Cancel | Batalkan |
| Approve | Setujui |
| Reject | Tolak |
| Verification | Verifikasi |
| Payment | Pembayaran |
| Draft | Draf |
| Product | Produk |
| Service | Layanan |
| Room | Ruangan |
| Stock | Stok |
| Upload | Unggah |

## Jangan bocorkan pesan teknis ke user

 pesan error DB, exception, atau HTTP mentah **tidak boleh** sampai ke user. Tangkap di service, ubah jadi pesan domain yang bisa dibaca. Pesan teknis boleh di log.

## Edge cases

Semua pesan yang_LEWAT ke user harus:
- Bahasa Indonesia baku
- Menjelaskan **tindakan** yang harus dilakukan user, bukan hanya menyatakan kesalahan
- Tidak membocorkan detail internal (nama tabel, nama kolom, stack trace)
