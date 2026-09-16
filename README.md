# PNJ PRIME

**Product Research Innovation and Market Excellence**

Platform Marketplace Digital Politeknik Negeri Jakarta untuk hilirisasi dan komersialisasi produk fisik, jasa/layanan, sewa fasilitas, dan inovasi unggulan PNJ.

> **Status:** Draft/Prototype — dikembangkan oleh Tim PBL iKAMAS sebagai bagian dari Project-Based Learning.
> Sejumlah keputusan bisnis-teknis masih TBD (lihat bagian [Area yang Masih Sementara](#area-yang-masih-sementara)).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Dev Server](#menjalankan-dev-server)
- [Struktur Folder](#struktur-folder)
- [Akun Demo (Seeder)](#akun-demo-seeder)
- [Area yang Masih Sementara](#area-yang-masih-sementara)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.4+) |
| Frontend | React 18 via Inertia.js v2 |
| Styling | Tailwind CSS v3 + PostCSS |
| Database | PostgreSQL (rekomendasi) |
| Auth Starter | Laravel Breeze (React/Inertia preset) |
| Testing | Pest |
| Build Tool | Vite 8 + laravel-vite-plugin |

---

## Instalasi & Setup

### Prasyarat

- PHP 8.2+
- Composer 2+
- Node.js 20+ & npm
- PostgreSQL 14+ (atau MySQL 8+)

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <url-repo> pnj-prime
cd pnj-prime

# 2. Install PHP dependencies
composer install

# 3. Install Node dependencies
npm install

# 4. Salin environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Konfigurasi database di .env
#    DB_CONNECTION=pgsql
#    DB_DATABASE=pnj_prime
#    DB_USERNAME=postgres
#    DB_PASSWORD=your_password

# 7. Buat database (PostgreSQL)
psql -U postgres -c "CREATE DATABASE pnj_prime;"

# 8. Jalankan migration
php artisan migrate

# 9. Jalankan seeder (data demo)
php artisan db:seed
```

---

## Menjalankan Dev Server

Jalankan dua terminal secara bersamaan:

```bash
# Terminal 1 — Laravel backend
php artisan serve

# Terminal 2 — Vite frontend
npm run dev
```

Akses di: **http://localhost:8000**

---

## Struktur Folder

```
pnj-prime/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/           # UserManagement, Curation, Setting, ExternalLink
│   │   │   ├── Catalog/         # CatalogController (public)
│   │   │   ├── Products/        # ProductController
│   │   │   ├── Reports/         # ReportController
│   │   │   └── Transactions/    # TransactionController
│   │   └── Middleware/
│   │       └── EnsureRole.php   # Role guard (usage: middleware('role:admin_rtpu'))
│   ├── Models/                  # User, Product, Order, OrderItem, PaymentProof,
│   │                            # ProductCategory, Setting, ExternalLink
│   ├── Services/
│   │   ├── Auth/
│   │   │   ├── AuthServiceInterface.php   # Contract (swap untuk SSO)
│   │   │   └── LocalAuthService.php       # Implementasi simulasi
│   │   └── SettingService.php             # Cached setting accessor
│   └── Providers/
│       └── AppServiceProvider.php         # IoC bindings
├── database/
│   ├── migrations/              # 10 migration files
│   └── seeders/                 # User, ProductCategory, Setting, ExternalLink
├── resources/
│   └── js/
│       ├── Pages/               # Inertia React pages per modul
│       │   ├── Admin/           # Settings, ExternalLinks
│       │   ├── Catalog/         # Index, Show
│       │   ├── Curation/        # Index
│       │   ├── Products/        # Index, Create
│       │   ├── Reports/         # AdminReport, OwnerReport
│       │   ├── Transactions/    # Index, Checkout
│       │   └── UserManagement/  # Index
│       └── Layouts/             # AuthenticatedLayout, GuestLayout
├── routes/
│   └── web.php                  # Route groups per modul
├── tailwind.config.js           # PNJ Prime brand tokens
└── .env.example                 # Environment template
```

---

## Akun Demo (Seeder)

Setelah `php artisan db:seed`, akun berikut tersedia:

| Email | Password | Role |
|---|---|---|
| `admin@pnjprime.test` | `password` | admin_rtpu |
| `dosen@pnjprime.test` | `password` | dosen_peneliti |
| `mahasiswa@pnjprime.test` | `password` | mahasiswa |
| `mitra@pnjprime.test` | `password` | eksternal |

---

## Area yang Masih Sementara

Arsitektur dirancang **mudah diubah** untuk keputusan bisnis yang belum final (Bab 14):

| Area | Status | Catatan Teknis |
|---|---|---|
| **Autentikasi SSO PNJ** | TBD | Swap `LocalAuthService` → `SsoAuthService` di `AppServiceProvider`. Tidak ada perubahan lain. |
| **Payment Gateway** | Out-of-scope (fase ini) | Gunakan upload bukti transfer. Tambahkan gateway hanya setelah ada keputusan. |
| **PPN** | TBD (Bab 14) | Konfigurasi di `/admin/settings`. Default: nonaktif, tarif null. |
| **KTP/NPWP wajib** | TBD (Bab 14) | Field ada di tabel `users`, saat ini nullable/opsional. |
| **Model B2B** | TBD (Bab 14) | Kolom `order_type` (b2c/b2b) ada di tabel `orders`, belum diaktifkan. |
| **Status pesanan final** | TBD (Bab 14) | Enum mudah ditambah dengan migration baru. |
| **URL LMS/RTPU** | Perlu konfirmasi | Update di `/admin/external-links` setelah URL resmi tersedia. |

---

## Catatan Developer

- Proyek ini adalah **MVP/Prototype** untuk demonstrasi ke RTPU dan dosen pembimbing.
- Semua `// TODO:` di controller menandai implementasi yang belum selesai.
- Gunakan `php artisan route:list` untuk melihat semua route yang tersedia.
- Konfigurasi `legacy-peer-deps=true` di `.npmrc` diperlukan karena `@vitejs/plugin-react` belum update peer dep untuk Vite 8 — tidak mempengaruhi runtime.
