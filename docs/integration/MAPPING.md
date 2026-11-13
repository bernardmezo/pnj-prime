# Matriks Pemetaan Halaman ke Endpoint API (Mapping Matrix)

Tabel pemetaan antara setiap halaman/modal di antarmuka frontend, endpoint API Bernard yang tersedia, adapter perantara, serta status flag environment yang mengontrolnya.

| Halaman / Komponen UI | Aksi / Data Pengguna | Endpoint API Bernard | Adapter Frontend / BFF | Domain Flag | Status Integrasi |
|---|---|---|---|---|---|
| **Katalog Publik** (`Catalog/Index.jsx`) | Menampilkan daftar layanan, filter kategori, search, paginasi | `GET /api/v1/catalog` | `resources/js/api/catalog.js` (`getCatalog`) | `DATA_SOURCE_CATALOG` | **Integrated via API v1** |
| **Detail Layanan** (`Catalog/Show.jsx`) | Spesifikasi layanan, opsi add-on, deskripsi | `GET /api/v1/catalog/{slug}` | `resources/js/api/catalog.js` (`getProductDetail`) | `DATA_SOURCE_CATALOG` | **Integrated via API v1** |
| **Detail Layanan - Modal Estimasi** (`Catalog/Show.jsx`) | Perhitungan estimasi biaya, jumlah peserta, PPN | `POST /api/v1/pengajuan/quote` | `resources/js/api/quote.js` (`calculateQuote`) | `DATA_SOURCE_QUOTE` | **Integrated via API v1** |
| **Form Pengajuan Layanan** (`Customer/Pengajuan/Create.jsx`) | Submit pengajuan, upload dokumen, consent PDP | `POST /api/v1/pengajuan` (Parsial - no docs/PDP) | `CustomerPengajuanController@store` | `DATA_SOURCE_PENGAJUAN` | **Kept on Legacy** (API lacks file upload & PDP) |
| **Riwayat Pengajuan** (`Customer/Riwayat/Index.jsx`) | Melihat status dan riwayat pengajuan | `GET /api/v1/pengajuan` | `CustomerRiwayatController@index` | `DATA_SOURCE_PENGAJUAN` | **Kept on Legacy** (Rich status & timeline needed) |
| **Detail Pengajuan** (`Customer/Riwayat/Show.jsx`) | Detail pengajuan, breakdown biaya & invoice | `GET /api/v1/pengajuan/{id}` | `CustomerPengajuanController@show` | `DATA_SOURCE_PENGAJUAN` | **Kept on Legacy** (Perlu relasi dokumen & bukti) |
| **Upload Bukti Bayar** (`Customer/Pengajuan/Payment.jsx`) | Upload struk transfer Mandiri BLU | *Tidak ada di API* | `CustomerPengajuanController@proof` | `DATA_SOURCE_PEMBAYARAN` | **Kept on Legacy** |
| **Verifikasi RTPU** (`Rtpu/Verifikasi/Layanan.jsx`) | Approve/reject pengajuan layanan | *Tidak ada di API* | `RtpuVerifikasiController` | `DATA_SOURCE_VERIFIKASI` | **Kept on Legacy** |
| **Verifikasi Pembayaran** (`Rtpu/Verifikasi/Pembayaran.jsx`)| Approve/reject bukti transfer | *Tidak ada di API* | `RtpuVerifikasiController` | `DATA_SOURCE_VERIFIKASI` | **Kept on Legacy** |
| **Produk Unggulan P3M** (`P3M/ProdukUnggulan/Index.jsx`) | Ajukan produk unggulan, upload HKI | *Tidak ada di API* | `ProdukUnggulanController` | `DATA_SOURCE_PRODUK_UNGGULAN` | **Kept on Legacy** |
| **Verifikasi Pimpinan** (`Pimpinan/Verifikasi.jsx`) | Validasi produk unggulan riset | *Tidak ada di API* | `PimpinanController` | `DATA_SOURCE_VERIFIKASI` | **Kept on Legacy** |
| **Dashboard & Pemantauan Direktur** | Monitoring KPI pengajuan & pendapatan | *Tidak ada di API* | `DirekturController` | `DATA_SOURCE_MANAGEMENT` | **Kept on Legacy** |
| **Kelola Layanan RTPU** (`Rtpu/Layanan/Index.jsx`) | Buat & edit layanan, opsi add-on | *Tidak ada di API* | `RtpuLayananController` | `DATA_SOURCE_MANAGEMENT` | **Kept on Legacy** |
| **Kelola User & Hak Akses** (`SuperAdmin/HakAkses/Index.jsx`)| Manajemen user & matriks hak akses | *Tidak ada di API* | `HakAksesController` | `DATA_SOURCE_MANAGEMENT` | **Kept on Legacy** |
| **Login / Logout** (`Auth/Login.jsx`) | Masuk ke sistem via web | `POST /api/v1/auth/login` (Bearer) | `AuthenticatedSessionController` (Session Cookie) | `DATA_SOURCE_AUTH` | **Kept on Legacy** (Web uses session cookie) |
| **Registrasi Akun** (`Auth/Register.jsx`) | Pendaftaran akun customer baru | *Tidak ada di API* | `RegisteredUserController` | `DATA_SOURCE_AUTH` | **Kept on Legacy** |
