# PNJ PRIME — Frontend ↔ Use Case Traceability

Source: Use Case Diagram §1. Every row names the page file(s), shared
component(s), and role(s). Pemantauan = in-progress items; Riwayat = closed
items (Selesai/Ditolak/Dibatalkan final or full archive per role scope).

| Use case | Page file(s) | Shared component(s) | Role(s) |
|---|---|---|---|
| Mendaftar Akun + Memvalidasi Data Registrasi | `Pages/Auth/Register.jsx` | `Layouts/AuthLayout.jsx`, `Components/SsoButton.jsx`, `Components/ui.jsx` (Field) | Customer |
| Melakukan Login + Memverifikasi Kredensial | `Pages/Auth/Login.jsx` | `Layouts/AuthLayout.jsx`, `Components/SsoButton.jsx`, `lib/sso.js` | all six roles |
| Mengajukan Layanan (Jasa) | `Pages/Customer/Pengajuan/Create.jsx` (step 2, tipe Jasa) | `Components/FileDropzone.jsx` | Customer |
| Mengajukan Layanan (Ruangan) | `Pages/Customer/Pengajuan/Create.jsx` (step 2, tipe Ruangan) | — | Customer |
| Mengajukan Layanan (Produk) | `Pages/Customer/Pengajuan/Create.jsx` (step 2, tipe Produk) | — | Customer |
| Melihat Katalog Layanan | `Pages/Catalog/Browse.jsx` | `Components/Public/CatalogCard.jsx` | guest, Customer |
| Melakukan Pembayaran + Memilih Metode Pembayaran | `Pages/Customer/Pembayaran.jsx` (steps 1–2) | `lib/statuses.js` | Customer |
| Mengunggah Bukti Pembayaran (extend) | `Pages/Customer/Pembayaran.jsx` (step 3) | `Components/FileDropzone.jsx` | Customer |
| Mengubah Pengajuan Layanan | `Pages/Customer/Pengajuan/Edit.jsx` | `lib/statuses.js` (canUbahLayanan) | Customer |
| Memantau Pengajuan Layanan + Memantau Status Pengajuan | `Pages/Customer/Pengajuan/Index.jsx`, `Pages/Customer/Pengajuan/Show.jsx` | `Components/CustomerTabs.jsx`, `Components/StatusTimeline.jsx` | Customer |
| Membatalkan Pengajuan Layanan (extend) | `Pages/Customer/Pengajuan/Show.jsx` (ConfirmModal) | `Components/ui.jsx` (ConfirmModal) | Customer |
| Mengajukan Produk Unggulan + Mengunggah Dokumen Pendukung | `Pages/P3M/Dashboard.jsx`, `Pages/P3M/ProdukUnggulan/Index.jsx` (`Components/PengajuanProdukModal.jsx`) | `Components/FileDropzone.jsx` | Admin P3M |
| Memantau Pengajuan Produk Unggulan | `Pages/P3M/ProdukUnggulan/Index.jsx`, `Pages/P3M/ProdukUnggulan/Show.jsx` | `Components/StatusTimeline.jsx` | Admin P3M |
| Mengubah Pengajuan Produk Unggulan (extend) | `Pages/P3M/ProdukUnggulan/Edit.jsx` | `lib/statuses.js` (canUbahProduk) | Admin P3M |
| Membatalkan Pengajuan Produk Unggulan (extend) | `Pages/P3M/ProdukUnggulan/Show.jsx` (ConfirmModal) | `Components/ui.jsx` (ConfirmModal) | Admin P3M |
| Melihat Riwayat (Riwayat Transaksi Layanan) | `Pages/Customer/Riwayat.jsx`, `Pages/Rtpu/Riwayat.jsx` | `Components/CustomerTabs.jsx` | Customer, Admin RTPU |
| Melihat Riwayat (Riwayat Produk Unggulan) | `Pages/P3M/Riwayat.jsx`, `Pages/Pimpinan/Riwayat.jsx`, `Pages/Direktur/Riwayat.jsx` | — | Admin P3M, Pimpinan RTPU, Direktur |
| Memverifikasi Pengajuan Layanan (checklist + data + tolak-bercatatan) | `Pages/Rtpu/Verifikasi/Layanan.jsx` | `Components/ReviewPanel.jsx` | Admin RTPU |
| Memverifikasi Pembayaran | `Pages/Rtpu/Verifikasi/Pembayaran.jsx` | `Components/ReviewPanel.jsx` | Admin RTPU |
| Memverifikasi Pengajuan Produk Unggulan | `Pages/Pimpinan/Verifikasi.jsx` | `Components/ReviewPanel.jsx` | Pimpinan RTPU |
| Memperbarui Status Layanan | `Pages/Rtpu/StatusLayanan.jsx` | `Components/StatusTimeline.jsx`, `lib/statuses.js` (NEXT_STATUS) | Admin RTPU |
| Mengelola Layanan Jasa | `Pages/Rtpu/Layanan/Index.jsx` (tab Jasa), `Pages/Rtpu/Layanan/Form.jsx` | — | Admin RTPU |
| Mengelola Layanan Ruangan | `Pages/Rtpu/Layanan/Index.jsx` (tab Ruangan), `Pages/Rtpu/Layanan/Form.jsx` | — | Admin RTPU |
| Mengelola Layanan Produk | `Pages/Rtpu/Layanan/Index.jsx` (tab Produk), `Pages/Rtpu/Layanan/Form.jsx` | — | Admin RTPU |
| Mengelola Metode Pembayaran | `Pages/Rtpu/MetodePembayaran/Index.jsx` | `Components/ui.jsx` (ConfirmModal) | Admin RTPU |
| Mengelola User | `Pages/SuperAdmin/Users/Index.jsx` | `lib/roles.js` (ROLE_KEYS) | Super Admin |
| Mengelola Hak Akses | `Pages/SuperAdmin/HakAkses.jsx` | — | Super Admin |
| Mengelola Fitur | `Pages/SuperAdmin/Fitur/Index.jsx` | — | Super Admin |
| Pemantauan (Pimpinan: produk unggulan) | `Pages/Pimpinan/Pemantauan.jsx` | — | Pimpinan RTPU |
| Pemantauan (Direktur: dua aliran) | `Pages/Direktur/Pemantauan.jsx` | — | Direktur |
| Landing / About (dukungan Melihat Katalog) | `Pages/Catalog/Index.jsx` | `Layouts/PublicLayout.jsx` | guest, Customer |
| Detail Layanan (dukungan Mengajukan) | `Pages/Catalog/Show.jsx` | — | guest, Customer |
| Role home redirect | `Pages/Dashboard.jsx` | `lib/roles.js` (roleHome), `lib/nav.js` | all six roles |

Notes:
- Backend is real: every page above receives server props (no mocks; the
  DEV preview harness and `resources/js/mocks/` were removed once routes
  landed). `lib/nav.js` resolves pageKeys to named routes only.
- Includes/extends covered inline: Memvalidasi Data Registrasi (Register
  field errors), Memverifikasi Kredensial (Login error banner), Memilih
  Metode Pembayaran + Mengunggah Bukti (Pembayaran steps), Membatalkan
  (ConfirmModal on Show pages), Memeriksa Kelengkapan Data + Memverifikasi
  Data + Menolak dan Memberi Catatan (shared ReviewPanel on all three
  verify pages).
- Every verify/reject-with-note action uses the same `ReviewPanel`; rejection
  always requires a non-empty catatan (enforced in the component).
