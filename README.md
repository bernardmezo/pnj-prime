# PNJ PRIME

**Product Research Innovation and Market Excellence**

Platform Marketplace Digital Politeknik Negeri Jakarta untuk hilirisasi dan komersialisasi produk fisik, jasa/layanan, sewa fasilitas, dan inovasi unggulan PNJ.

> **Status:** Backend Development Complete & Validated — dikembangkan oleh Tim PBL Kelompok 2 "Suka Suka" (TI 5C) untuk Unit Layanan RTPU & P3M Politeknik Negeri Jakarta, mengacu pada Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS v1.1), SDPLN v1.1, dan Project Charter.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur & Keamanan](#arsitektur--keamanan)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Dev Server & Scheduler](#menjalankan-dev-server--scheduler)
- [Akun Demo & Role Matrix](#akun-demo--role-matrix)
- [Pengujian & Validasi Kualitas](#pengujian--validasi-kualitas)
- [Struktur Direktori](#struktur-direktori)

---

## Fitur Utama

- **Katalog & Kurasi Layanan (FR1, FR2, FR3):** Penjelajahan publik produk hilirisasi, jasa konsultasi/uji lab, dan sewa ruang/alat. Alur kurasi publikasi dari draft usulan P3M menjadi listing terkurasi di katalog.
- **Pemesanan Multi-Opsi & Dynamic Addons (FR4, FR5):** Kalkulasi biaya server-side (`PricingService`) berbasis durasi sewa, jumlah peserta, kuantitas, dan opsi varian/layanan tambahan.
- **Anti-Bentrok Jadwal Sewa (FR4, FR5):** Pengecekan jadwal sewa ruangan dan alat laboratorium menggunakan native PostgreSQL GiST exclusion constraint (`tstzrange` + extension `btree_gist`) serta application-level defense-in-depth (`RoomBookingService`).
- **Verifikasi Bertingkat & Approval Gate Pimpinan (FR7, FR14, D-04):** Pengajuan sewa ruangan/alat diverifikasi berkas oleh Admin RTPU, lalu diteruskan ke antrean persetujuan Pimpinan RTPU sebelum penerbitan tagihan.
- **Master Pajak & Snapshot Tagihan (FR9, FR10, FR17, NFR2):** Kelola tarif PPN/pajak kategori via `TaxRate` dan `TaxService`. Snapshot nilai tarif, kode, dan kalkulasi PPN disimpan permanen (immutable) ke dalam tagihan `Order` dan `OrderItem`.
- **Profil Tenant & Kepatuhan UU PDP (FR6, FR14, NFR7, NFR10):** Pendaftaran profil usaha penyewa dengan enkripsi data sensitif (NIK, NPWP) via Laravel `encrypted` cast, penyimpanan privat dokumen KTP/bukti transfer (`'serve' => false`), otorisasi berkas via controller, serta pencatatan persetujuan PDP consent.
- **Verifikasi Pembayaran & Rekonsiliasi BLU (FR8, FR11):** Kanal resmi Mandiri BLU PNJ, verifikasi bukti bayar berjenjang, dan cron scheduler otomatis pembatalan pesanan kadaluwarsa (>72 jam).
- **Laporan, Statistik, dan Audit Trail (FR12, FR18, NFR1, WP-3.1, WP-3.3):** Dashboard ringkasan pendapatan, rekapitulasi PPN terdistribusi, serta pencatatan audit komprehensif (`AuditLogger`) atas setiap aksi administratif (user, IP, timestamp, old/new payload).

---

## Tech Stack

| Layer | Komponen | Detail Versi |
|---|---|---|
| Backend Framework | Laravel | 13.x (PHP 8.4+) |
| Frontend Interface | Inertia.js | v2.x (React 18) |
| Styling & UI | Tailwind CSS | v3.x + PostCSS |
| Database Engine | PostgreSQL | 14+ (dengan ekstensi `btree_gist`) |
| Autentikasi & RBAC | Breeze + RBAC 3-Lapis | Role, Permission, Fitur Matriks |
| Asset Bundler | Vite | 8.x |
| Code Formatter | Laravel Pint | Standar PSR-12 / Laravel |
| Testing Suites | PHPUnit & Vitest | Feature, Unit, dan React DOM Tests |

---

## Arsitektur & Keamanan

1. **RBAC 3-Lapis:**
   - **Lapis 1 (Role):** 6 backed enum role (`Role: string`).
   - **Lapis 2 (Fitur):** Modul fungsional dapat diaktifkan/dinonaktifkan secara global melalui `FiturController`.
   - **Lapis 3 (Permission):** Matriks hak akses per role (Lihat, Tambah, Ubah, Hapus, Verifikasi) dikelola lewat UI `HakAksesController`.
2. **Keamanan Berkas Sensitif:**
   - Disk penyimpanan dokumen lokal diset ke `'serve' => false`.
   - Berkas KTP tenant, dokumen MoU pengajuan, dan bukti transfer pembayaran diunduh secara terkontrol melalui `FileController` dengan verifikasi kepemilikan dan hak akses role staf.
3. **Integritas Konkurensi Jadwal:**
   - Menggunakan indeks PostgreSQL GiST dengan rumus:
     `EXCLUDE USING gist (product_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (released_at IS NULL AND status = 'ACTIVE')`
   - Mencegah double-booking pada level storage engine PostgreSQL.

---

## Instalasi & Setup

### Prasyarat

- PHP 8.4+ (dengan ekstensi `pdo_pgsql`, `pgsql`, `fileinfo`, `sodium`, `openssl`)
- Composer 2.x
- Node.js 20+ & npm
- PostgreSQL 14+

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repository_url> pnj-prime
cd pnj-prime

# 2. Pasang dependensi PHP & JavaScript
composer install
npm install

# 3. Salin environment file dan generate key
cp .env.example .env
php artisan key:generate

# 4. Sesuaikan konfigurasi database PostgreSQL di .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pnj_prime
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password

# 5. Jalankan migrasi dan seeder
php artisan migrate:fresh --seed

# 6. Kompilasi asset antarmuka
npm run build
```

---

## Menjalankan Dev Server & Scheduler

Jalankan perintah berikut pada terminal terpisah:

```bash
# Terminal 1 — Backend Laravel
php artisan serve

# Terminal 2 — Frontend Hot Reload (Vite)
npm run dev

# Terminal 3 — Scheduler Worker (Pembatalan Tagihan Kadaluwarsa 72 Jam)
php artisan schedule:work
```

Aplikasi dapat diakses melalui browser pada: **http://localhost:8000**

---

## Akun Demo & Role Matrix

Setelah `php artisan migrate:fresh --seed`, seluruh akun peran baku berikut siap digunakan (Password default: `password`):

| Role | Email | Wewenang Utama |
|---|---|---|
| **Super Admin** | `superadmin@pnjprime.test` | Kelola akun, matriks hak akses RBAC, konfigurasi fitur sistem |
| **Admin RTPU** | `admin.rtpu@pnjprime.test` | Kurasi katalog, verifikasi pengajuan & bukti bayar, validasi tenant, kelola master pajak |
| **Admin P3M** | `admin.p3m@pnjprime.test` | Pengajuan produk riset unggulan dosen/peneliti dan varian opsi |
| **Pimpinan RTPU** | `pimpinan.rtpu@pnjprime.test` | Verifikasi persetujuan usulan produk riset, approval sewa fasilitas/alat, laporan |
| **Direktur** | `direktur@pnjprime.test` | Pemantauan produk hilirisasi, dashboard pelaporan & audit trail (read-only) |
| **Customer** | `customer@pnjprime.test` | Pemesanan layanan, pendaftaran profil tenant/PDP, pembayaran via BLU Mandiri |

---

## Pengujian & Validasi Kualitas

Proyek dilengkapi dengan pengujian terotomasi menyeluruh:

```bash
# 1. Jalankan pengujian backend (PHPUnit) — 131 tests, 979 assertions
php artisan test

# 2. Jalankan pengujian frontend (Vitest) — 7 test files, 75 tests
npx vitest run

# 3. Jalankan linter dan formatter kode (Pint)
./vendor/bin/pint --test
```

---

## Struktur Direktori

```
pnj-prime/
├── app/
│   ├── Enums/
│   │   ├── PengajuanStatus.php      # State machine siklus hidup pengajuan
│   │   └── Role.php                 # Backed string enum 6 peran baku
│   ├── Http/Controllers/
│   │   ├── Admin/                   # Pengaturan umum, master pajak, tautan luar
│   │   ├── Auth/                    # Autentikasi Breeze, registrasi, SSO handler
│   │   ├── Catalog/                 # Halaman beranda dan detail katalog publik
│   │   ├── Customer/                # Alur pemesanan customer & kelola profil tenant
│   │   ├── Direktur/                # Dashboard pemantauan dan laporan eksekutif
│   │   ├── P3M/                     # Pengajuan & opsi produk riset unggulan
│   │   ├── Pimpinan/                # Verifikasi produk unggulan & persetujuan sewa
│   │   ├── Rtpu/                    # Layanan, verifikasi berkas/bayar, validasi tenant
│   │   ├── SuperAdmin/              # Kelola pengguna, izin hak akses, modul fitur
│   │   ├── FileController.php       # Penyajian dokumen privat dengan otorisasi ketat
│   │   └── ReportController.php     # Rekapitulasi transaksi, pendapatan, pajak & audit
│   ├── Models/                      # Model Eloquent (User, Product, Order, TaxRate, RoomBooking, dll)
│   └── Services/
│       ├── AuditLogger.php          # Pencatat log aktivitas administratif
│       ├── PengajuanWorkflow.php    # Transisi status pesanan dan snapshot tagihan
│       ├── PricingService.php       # Kalkulator rincian harga opsi & kuantitas
│       ├── RoomBookingService.php   # Manajemen reservasi slot anti-overlap
│       └── TaxService.php           # Logika perhitungan dan ambang batas PPN
├── database/
│   ├── migrations/                  # 28 file migrasi database terstruktur
│   └── seeders/                     # Seeder kategori, setting, pajak, pengguna, dan hak akses
├── resources/js/
│   ├── Components/                  # Reusable React components (UI, form, modal)
│   ├── Layouts/                     # AuthenticatedLayout, GuestLayout, DashboardLayout
│   └── Pages/                       # Halaman antarmuka Inertia per modul peran
└── tests/
    ├── Feature/                     # Pengujian end-to-end alur transaksi & bisnis
    └── Unit/                        # Pengujian logika terisolasi
```
