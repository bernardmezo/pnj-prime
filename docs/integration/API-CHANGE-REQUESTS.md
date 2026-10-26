# Daftar Permintaan Perubahan API (Untuk Bernard)

Halo Bernard! Terima kasih banyak atas kerja kerasnya membangun REST API v1 untuk PNJ PRIME. Struktur kodenya sangat rapi, bersih, dan menggunakan best practice Laravel modern.

Berikut adalah daftar temuan, masukan perbaikan, dan permintaan penambahan endpoint agar API dapat terintegrasi penuh dengan frontend PNJ PRIME tanpa hambatan:

---

## 1. Kategori: BLOCKER (Menghalangi Integrasi Penuh Frontend)

### 1.1 Endpoint Upload Dokumen & Registrasi Tidak Tersedia
- **Domain**: Autentikasi & Pengajuan Layanan
- **Masalah**: 
  - Tidak ada endpoint `POST /api/v1/auth/register` untuk pendaftaran akun customer baru (hanya ada login).
  - Endpoint `POST /api/v1/pengajuan` belum menerima file upload dokumen (array `dokumen` di-hardcode kosong `[]`).
- **Bukti Kode**: `app/Http/Controllers/Api/V1/PengajuanController.php` baris 107:
  ```php
  $pengajuan->dokumen = [];
  ```
- **Saran Perbaikan**:
  1. Tambahkan endpoint `POST /api/v1/auth/register` dengan validasi NIK/NPWP, nomor telepon, instansi, dan hashing password.
  2. Perbarui `StorePengajuanApiRequest` agar mendukung multipart form data dokumen pengajuan, dan simpan file ke storage privat via `FileController` / disk privat.
- **Workaround Frontend Sementara**: Frontend tetap menggunakan controller web legacy untuk registrasi dan submit form pengajuan lengkap.

---

### 1.2 Endpoint Verifikasi & Pembayaran Belum Tersedia
- **Domain**: Verifikasi RTPU, Pembayaran, dan Produk Unggulan
- **Masalah**: 
  - Belum ada endpoint untuk upload bukti pembayaran (`POST /api/v1/pembayaran/{id}/bukti`).
  - Belum ada endpoint untuk aksi verifikasi Admin RTPU (Setujui / Tolak Layanan dan Pembayaran).
  - Belum ada endpoint untuk pengajuan dan verifikasi Produk Unggulan P3M / Pimpinan.
- **Saran Perbaikan**:
  - Implementasikan endpoint verifikasi di `routes/api.php`:
    - `POST /api/v1/pengajuan/{id}/verify` (approve/reject dengan catatan penolakan wajib).
    - `POST /api/v1/pembayaran/{id}/verify` (approve/reject bukti transfer).
- **Workaround Frontend Sementara**: Fitur verifikasi dan pembayaran di frontend tetap diproses oleh controller web legacy.

---

## 2. Kategori: MAJOR (Masalah Keamanan & Integritas Data)

### 2.1 Ketiadaan Rate Limiting pada Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Tingkat Keparahan**: Major
- **Masalah**: Rute login tidak memiliki middleware throttle, membuka peluang brute-force password.
- **Bukti Kode**: `routes/api.php` baris 31:
  ```php
  Route::post('/auth/login', [AuthController::class, 'login']);
  ```
- **Saran Perbaikan**:
  Tambahkan rate limiting middleware pada rute login:
  ```php
  Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
  ```
- **Workaround Frontend**: Frontend Inertia menggunakan rute login web yang telah dilengkapi throttle.

---

### 2.2 Total Pengajuan Tidak Menyertakan Pajak PPN
- **Endpoint**: `POST /api/v1/pengajuan`
- **Tingkat Keparahan**: Major
- **Masalah**: Pada saat quote dihitung, kalkulasi PPN tersedia. Namun saat pengajuan disimpan di database, kolom `total` hanya diisi nilai `subtotal` murni, sehingga nominal tagihan yang tersimpan tidak mencakup PPN.
- **Bukti Kode**: `app/Http/Controllers/Api/V1/PengajuanController.php` baris 109–111:
  ```php
  if ($quote !== null) {
      $pengajuan->total = $quote['subtotal'];
  }
  ```
- **Saran Perbaikan**:
  Hitung pajak menggunakan `TaxService` dan simpan total akhir (subtotal + tax):
  ```php
  $taxCalc = $this->taxService->calculate((int) $quote['subtotal'], $product->taxRate, $product->category?->slug);
  $pengajuan->total = $taxCalc['total'];
  ```
- **Workaround Frontend**: Menggunakan perhitungan quote server-side sebagai preview sebelum submit.

---

### 2.3 Validasi Persetujuan PDP (Perlindungan Data Pribadi)
- **Endpoint**: `POST /api/v1/pengajuan`
- **Tingkat Keparahan**: Major
- **Masalah**: Pengajuan dapat dibuat tanpa memverifikasi apakah pemohon telah menyetujui syarat persetujuan pemrosesan data pribadi (PDP).
- **Saran Perbaikan**:
  Tambahkan aturan `'pdp_consent' => ['accepted']` atau periksa status `pdp_consent` pada user di `StorePengajuanApiRequest`.

---

## 3. Kategori: MINOR (Kerapian & Konsistensi API)

### 3.1 Paginasi `per_page` pada Pengajuan
- **Endpoint**: `GET /api/v1/pengajuan`
- **Masalah**: Array `meta` tidak mengembalikan kunci `per_page` seperti halnya di endpoint `/api/v1/catalog`.
- **Saran Perbaikan**: Tambahkan `'per_page' => $pengajuans->perPage()` pada array `meta` respons.

### 3.2 Konsistensi Bahasa
- **Masalah**: Kunci response envelope menggunakan bahasa Inggris (`success`, `message`, `data`), namun kunci parameter form menggunakan bahasa Indonesia (`jumlah`, `keperluan`, `opsi`).
- **Saran**: Dokumentasikan kamus parameter ini secara konsisten di file OpenAPI specification agar pengembang frontend eksternal mudah memahami.
