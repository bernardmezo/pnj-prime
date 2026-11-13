# Rencana Integrasi API (Integration Plan)

Dokumen ini mendefinisikan strategi teknis, arsitektur data source flag, adapter layer, dan mitigasi rollback untuk mengintegrasikan backend API yang dibangun oleh **bernardmezo** ke dalam aplikasi **PNJ PRIME**.

---

## 1. Strategi Arsitektur (Section 4.1)

### Pattern Pilihan: **Hybrid Same-Origin Adapter & Server BFF (Backend-for-Frontend)**
Karena API Bernard berada di dalam repositori Laravel yang sama (`routes/api.php`) dan frontend dibangun menggunakan **Inertia.js + React**:
1. **Keamanan Token**: Ground rules secara ketat melarang penyimpanan token autentikasi di `localStorage` karena risiko eksfiltrasi XSS.
2. **Autentikasi Session Cookie**: Untuk alur web Inertia pengguna, aplikasi tetap memanfaatkan session cookie berbasis HTTP-only yang terlindungi CSRF.
3. **Adapter & BFF**: Untuk endpoint yang sudah matang di API Bernard (seperti Katalog dan Quote perhitungan harga), frontend dapat memanggil endpoint `/api/v1/*` menggunakan axios yang meneruskan CSRF cookie atau diakses melalui controller BFF dengan memetakan respons API ke props Inertia yang diharapkan halaman.
4. **Zero UI Regressions**: Desain antarmuka, copy, skema token warna, route Inertia, dan nama halaman tidak diubah sedikit pun.

---

## 2. Arsitektur Data-Source Flag (Section 4.2)

Untuk memastikan adanya jalur **rollback instan** jika terjadi kendala pada endpoint API, sistem mengadopsi mekanisme feature-toggle konfigurasi environment:

### Variabel Environment (.env)
```env
# Master Data Source: 'legacy' (default) atau 'bernard'
DATA_SOURCE=legacy

# Granular per-domain overrides (mengoverride nilai master di atas jika diset):
DATA_SOURCE_AUTH=legacy
DATA_SOURCE_CATALOG=bernard
DATA_SOURCE_QUOTE=bernard
DATA_SOURCE_PENGAJUAN=legacy
DATA_SOURCE_PEMBAYARAN=legacy
DATA_SOURCE_VERIFIKASI=legacy
DATA_SOURCE_PRODUK_UNGGULAN=legacy
DATA_SOURCE_MANAGEMENT=legacy
```

- Ketika `DATA_SOURCE_CATALOG=bernard`, data katalog diambil dan dinormalisasi dari format REST API `/api/v1/catalog`.
- Ketika `DATA_SOURCE_CATALOG=legacy`, sistem mengeksekusi Eloquent controller web legacy seperti biasa.
- Rollback dapat dilakukan dalam 1 detik hanya dengan mengubah nilai di `.env`.

---

## 3. Client Layer & Adapter (Section 4.3)

Struktur modul adapter pada frontend:
- `resources/js/api/client.js`: Konfigurasi dasar Axios (baseURL `/api/v1`, header `Accept: application/json`, handling X-CSRF-TOKEN).
- `resources/js/api/catalog.js`: Adapter untuk `/api/v1/catalog` dan detail `/api/v1/catalog/{slug}` yang memetakan format resource API ke format properti yang dikonsumsi oleh `resources/js/Pages/Catalog/Index.jsx` dan `Show.jsx`.
- `resources/js/api/quote.js`: Adapter untuk `/api/v1/pengajuan/quote` yang memetakan estimasi subtotal dan snapshot tarif PPN.

### Normalisasi Error (Section 4.4)
- **401 Unauthorized**: Redirect ke halaman login (`/login`) dengan mempertahankan return URL.
- **403 Forbidden**: Menampilkan notifikasi atau status forbidden yang ramah.
- **404 Not Found**: Mengembalikan fallback empty state "Layanan tidak ditemukan".
- **409 Conflict**: Toast alert `"Status pengajuan sudah berubah. Halaman diperbarui."` lalu reload data.
- **422 Unprocessable Entity**: Memetakan validasi field-level error dari Laravel FormRequest ke input form frontend.
- **5xx / Network Error**: Menampilkan pesan kesalahan ramah dengan tombol "Coba Lagi" tanpa merusak UI.

---

## 4. Tahapan Integrasi Per Domain (Order of Work)

| Tahap | Domain | Target Flag | Aksi & Komponen |
|---|---|---|---|
| **Tahap 1** | **Katalog Publik** | `DATA_SOURCE_CATALOG=bernard` | Hubungkan fetch data katalog & detail produk ke `/api/v1/catalog`. Validasi sorting, filter kategori, search, dan paginasi. |
| **Tahap 2** | **Pricing & Tax Quote** | `DATA_SOURCE_QUOTE=bernard` | Hubungkan estimasi subtotal dan tarif PPN kalkulasi server di halaman detail layanan. |
| **Tahap 3** | **Pengajuan & Transaksi** | `DATA_SOURCE_PENGAJUAN=legacy` | Tetap menggunakan legacy sampai Bernard menambahkan dukungan upload dokumen & consent PDP pada API. |
| **Tahap 4** | **Pembayaran & Verifikasi** | `DATA_SOURCE_*=legacy` | Tetap menggunakan legacy (belum ada endpoint API v1). |
| **Tahap 5** | **Kelola & RBAC** | `DATA_SOURCE_*=legacy` | Tetap menggunakan legacy (belum ada endpoint API v1). |
