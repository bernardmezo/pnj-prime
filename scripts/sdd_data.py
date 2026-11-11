# scripts/sdd_data.py
# Data structures and content for Software Design Document (SDD) PNJ PRIME

TEAM_MEMBERS = [
    ("Muhammad Irzaldi Alamsyah", "Team Leader, Frontend Programmer", "TIK - Teknik Informatika"),
    ("Muhammad Fatih Ammario Seno Riyadi", "System Analyst", "TIK - Teknik Informatika"),
    ("Hari Bernardo", "Backend Programmer", "TIK - Teknik Informatika"),
    ("Ahmad Raihan", "UI/UX Designer, Frontend Developer", "TIK - Teknik Informatika"),
    ("Christino Hirasdo Wiryawan", "Business Analyst, Software Tester", "TIK - Teknik Informatika")
]

REVISION_HISTORY = [
    ("08/Okt/2026", "Revision 1.0: Pembuatan draf awal perancangan perangkat lunak PNJ PRIME berdasarkan SRS draft, notulensi pertemuan 1-2, dan Backend Plan.", "Tim PBL Suka Suka"),
    ("11/Okt/2026", "Revision 1.1: Penyesuaian arsitektur teknologi stack (Laravel, PostgreSQL/SQLite, React, Inertia.js), pembagian WBS, peran tim, dan milestone.", "Tim PBL Suka Suka"),
    ("01/Nov/2026", "Revision 1.2: Sinkronisasi dengan notulensi stakeholder 22-23 Oktober dan SRS v1.2: penambahan peran Admin Pengelola unit, kurasi 2 tahap, dual-payment, dan pemetaan 23 FR.", "Tim PBL Suka Suka"),
    ("09/Nov/2026", "Revision 1.3: Integrasi SDPLN v1.3: perancangan kamus data 12 entitas, spesifikasi RUP 5 iterasi, dan pembaruan alur proses bisnis BPMN.", "Tim PBL Suka Suka"),
    ("11/Nov/2026", "Revision 2.0: Finalisasi Software Design Document (SDD) lengkap: perincian kelas implementasi Laravel/Inertia, arsitektur multi-tier, kamus data lengkap, dan desain UI.", "Tim PBL Suka Suka")
]

PROJECT_CONSTRAINTS = [
    ("Jadwal Pengembangan", "Mengikuti jadwal kurikulum perkuliahan PBL selama 16 minggu efektif (17 Agustus 2026 – 6 Desember 2026)."),
    ("Tim Pengembang", "Terdiri dari 5 mahasiswa PBL Jurusan TIK PNJ dengan peran ganda; tidak ada penambahan staf atau pihak ketiga (subkontraktor)."),
    ("Anggaran & Kapasitas Usaha", "Total kapasitas usaha dibatasi pada 124 Manday (setara 992 jam kerja) dengan nilai estimasi tenaga kerja akademis Rp15.500.000."),
    ("Mekanisme Pembayaran", "Penerimaan dana transfer bank terpusat pada rekening resmi PNJ (Bank Mandiri BLU) dengan verifikasi bukti bayar manual oleh Admin RTPU. Modul payment gateway pada tahap PBL dijalankan secara simulasi."),
    ("Autentikasi & SSO", "Autentikasi akun internal PNJ disimulasikan melalui login internal berbasis SSO ID lokal sampai API SSO resmi kampus disediakan oleh UPT TIK PNJ."),
    ("Integrasi Eksternal", "Integrasi ke Learning Management System (LMS RTPU) dan Website Informasi RTPU Baru dibatasi pada tautan eksternal (hyperlink keluar) tanpa pertukaran data API dua arah.")
]

ESTIMATES_DATA = [
    ("1", "Modul Autentikasi, Registrasi Mandiri, & Verifikasi Akun Pengelola (FR-01, FR-02, FR-03)", "96 Jam (12 Manday)"),
    ("2", "Modul Tata Kelola Akun, Dynamic RBAC, & Manajemen Fitur Granular (FR-21, FR-22)", "64 Jam (8 Manday)"),
    ("3", "Modul Katalog Publik, Navigasi Kategori, & Detail Produk/Layanan (FR-04)", "48 Jam (6 Manday)"),
    ("4", "Modul Manajemen Katalog Unit & Alur Kurasi Dua Tahap (FR-16, FR-17, FR-18)", "144 Jam (18 Manday)"),
    ("5", "Modul Master Data, Master Pajak Dinamis, & Rekening Pembayaran (FR-10, FR-19, FR-20)", "64 Jam (8 Manday)"),
    ("6", "Modul Pengajuan Layanan, Sewa Ruangan, & Verifikasi Dokumen Penyewa (FR-05, FR-06, FR-07, FR-08)", "160 Jam (20 Manday)"),
    ("7", "Modul Penagihan (Invoice), Pembayaran Transfer/Gateway, & Verifikasi Kasir (FR-09, FR-11, FR-12)", "176 Jam (22 Manday)"),
    ("8", "Modul Pelacakan Status Layanan & Riwayat Transaksi Lintas Peran (FR-13, FR-14)", "80 Jam (10 Manday)"),
    ("9", "Modul Dashboard Monitoring Eksekutif, Laporan Transaksi, & Integrasi LMS (FR-15, FR-23)", "80 Jam (10 Manday)"),
    ("10", "Perancangan Basis Data, Setup Environment Laravel/Inertia, & Deployment Pipeline", "80 Jam (10 Manday)")
]

TRACEABILITY_MATRIX = [
    ("FR-01: Registrasi Akun", "Identity & Access: Pendaftaran Akun Customer & Pengajuan Akun Admin Pengelola Unit", "RegisteredUserController.php", "Auth/Register.jsx"),
    ("FR-02: Login Sistem", "Identity & Access: Otentikasi Email/Password & Simulasi SSO PNJ", "AuthenticatedSessionController.php", "Auth/Login.jsx"),
    ("FR-03: Verifikasi Akun Admin Pengelola", "Identity & Access: Persetujuan Pimpinan RTPU atas Permohonan Akun Unit", "PengelolaVerificationController.php", "Pimpinan/VerifikasiPengelola.jsx"),
    ("FR-04: Lihat & Pilih Item Katalog", "Catalog Domain: Katalog publik multi-kategori (Produk, Jasa, Ruangan) & detail", "CatalogController.php", "Catalog/Index.jsx, Catalog/Show.jsx"),
    ("FR-05: Ajukan Layanan / Checkout", "Service & Order: Pengajuan layanan, booking ruangan, & checkout ready stock", "PengajuanController.php, OrderController.php", "Customer/Pengajuan/Create.jsx, Checkout.jsx"),
    ("FR-06: Isi Data Penyewa", "Service & Order: Pengunggahan identitas KTP/NPWP penanggung jawab sewa fasilitas", "TenantProfileController.php", "Customer/TenantProfileForm.jsx"),
    ("FR-07: Ubah & Batalkan Pengajuan", "Service & Order: Modifikasi pengajuan layanan berstatus awal 'Diajukan'", "PengajuanController.php (update, cancel)", "Customer/PengajuanDetail.jsx"),
    ("FR-08: Verifikasi Pengajuan Layanan", "Service & Order: Validasi kelayakan pengajuan layanan & berkas penyewa oleh Admin RTPU", "AdminPengajuanController.php", "Rtpu/Pengajuan/Review.jsx"),
    ("FR-09: Terbitkan Invoice", "Financial & Billing: Penerbitan tagihan resmi bernomor unik dengan kalkulasi pajak", "InvoiceController.php", "Rtpu/Invoice/Create.jsx, Show.jsx"),
    ("FR-10: Hitung Pajak Otomatis", "Financial & Billing: Kalkulasi PPN dinamis berbasis tabel master tarif pajak", "TaxCalculationService.php", "Components/PriceSummary.jsx"),
    ("FR-11: Lakukan Pembayaran", "Financial & Billing: Transfer bank (upload bukti) & Payment Gateway simulasi", "PaymentController.php", "Customer/Pembayaran.jsx"),
    ("FR-12: Verifikasi Pembayaran Transfer", "Financial & Billing: Validasi bukti mutasi bank oleh Admin RTPU & penerbitan kuitansi", "AdminPaymentController.php", "Rtpu/Pembayaran/Verifikasi.jsx"),
    ("FR-13: Perbarui Status Layanan", "Service & Order: Transisi status pengerjaan layanan (Diproses, Selesai) & notifikasi", "PengajuanProgressController.php", "Rtpu/Pengajuan/StatusModal.jsx"),
    ("FR-14: Pantau Status & Riwayat", "Service & Order: Pelacakan riwayat transaksi & pengajuan sesuai batas akses peran", "TrackingController.php", "Customer/History.jsx, Pengelola/History.jsx"),
    ("FR-15: Akses Layanan LMS", "External Integration: Hyperlink keluar menuju LMS RTPU eksternal", "ExternalLinkController.php", "Components/LmsBanner.jsx"),
    ("FR-16: Kelola Katalog Unit", "Catalog Domain: Pengelolaan produk/layanan per jurusan oleh Admin Pengelola", "ProductManagementController.php", "Pengelola/Products/Index.jsx, Form.jsx"),
    ("FR-17: Periksa Katalog (Tahap 1)", "Catalog Domain: Pemeriksaan kelayakan teknis item oleh Admin RTPU", "AdminKurasiController.php", "Rtpu/Verifikasi/Produk.jsx"),
    ("FR-18: Setujui Katalog (Tahap 2)", "Catalog Domain: Persetujuan eksekutif final oleh Pimpinan RTPU", "PimpinanKurasiController.php", "Pimpinan/Verifikasi/Produk.jsx"),
    ("FR-19: Kelola Metode Pembayaran", "Financial & Billing: Pengaturan kanal pembayaran & rekening resmi Bank Mandiri BLU", "PaymentMethodController.php", "Rtpu/Settings/PaymentMethods.jsx"),
    ("FR-20: Kelola Master Pajak", "Financial & Billing: Konfigurasi tarif PPN dinamis dan kategori pajak produk", "TaxRateController.php", "Rtpu/Settings/TaxRates.jsx"),
    ("FR-21: Kelola Akun Pengguna", "Governance & RBAC: Pengelolaan status pengguna, aktivasi/deaktivasi akun", "UserController.php", "SuperAdmin/Users/Index.jsx"),
    ("FR-22: Kelola Hak Akses & Fitur", "Governance & RBAC: Konfigurasi permission dinamis per role pengguna", "PermissionController.php", "SuperAdmin/Roles/Matrix.jsx"),
    ("FR-23: Dashboard & Laporan", "Governance & Reporting: Statistik transaksi, kurasi produk, & ekspor laporan", "DashboardController.php, ReportController.php", "Dashboard/SharedDashboard.jsx, Reports.jsx")
]

DATA_DICTIONARY = {
    "users": [
        ("id", "Primary Key (Auto Increment)", "BIGINT UNSIGNED", "20"),
        ("name", "Nama lengkap pengguna", "VARCHAR", "255"),
        ("email", "Alamat email unik (username login)", "VARCHAR", "255"),
        ("password", "Hash password pengguna (Bcrypt)", "VARCHAR", "255"),
        ("role", "Peran utama (customer, admin_pengelola, admin_rtpu, pimpinan, superadmin, direktur)", "VARCHAR", "50"),
        ("jurusan_unit", "Nama jurusan atau unit kerja kampus pengusul katalog", "VARCHAR", "100"),
        ("status_verifikasi", "Status akun pengelola (verified, pending, rejected)", "VARCHAR", "30"),
        ("remember_token", "Token sesi persistent login", "VARCHAR", "100"),
        ("created_at / updated_at", "Waktu pembuatan dan pembaruan data pengguna", "TIMESTAMP", "Nullable")
    ],
    "roles_and_permissions": [
        ("id", "Primary Key", "BIGINT UNSIGNED", "20"),
        ("name", "Nama role atau izin (mis. kelola_katalog_unit, verifikasi_katalog)", "VARCHAR", "100"),
        ("guard_name", "Guard otentikasi (web)", "VARCHAR", "50"),
        ("created_at / updated_at", "Waktu pencatatan hak akses", "TIMESTAMP", "Nullable")
    ],
    "product_categories": [
        ("id", "Primary Key", "BIGINT UNSIGNED", "20"),
        ("name", "Nama kategori (Produk Fisik, Jasa Pengujian Lab, Fasilitas/Ruangan)", "VARCHAR", "100"),
        ("slug", "Slug kategori untuk filter URL katalog", "VARCHAR", "100"),
        ("deskripsi", "Deskripsi lingkup kategori", "TEXT", "Nullable")
    ],
    "products": [
        ("id", "Primary Key", "BIGINT UNSIGNED", "20"),
        ("category_id", "Foreign Key mengarah ke product_categories.id", "BIGINT UNSIGNED", "20"),
        ("user_id", "Foreign Key pengusul item (users.id Admin Pengelola)", "BIGINT UNSIGNED", "20"),
        ("nama_produk", "Nama resmi produk, layanan, atau ruangan fasilitas", "VARCHAR", "255"),
        ("slug", "Slug URL unik untuk penayangan katalog", "VARCHAR", "255"),
        ("deskripsi", "Spesifikasi teknis dan rincian fasilitas", "TEXT", "Nullable"),
        ("harga", "Harga dasar produk atau tarif dasar sewa", "DECIMAL", "15,2"),
        ("stok", "Jumlah ketersediaan stok fisik (nullable untuk jasa/ruangan)", "INT", "11"),
        ("status_kurasi", "Status alur kurasi (draft, pending, approved_admin, approved_leader, rejected)", "VARCHAR", "50"),
        ("catatan_kurasi", "Catatan revisi atau alasan penolakan kurasi", "TEXT", "Nullable"),
        ("target_audience", "Segmentasi pembeli (public, internal_pnj)", "VARCHAR", "50"),
        ("poster_path", "Path lokasi penyimpanan file foto poster produk", "VARCHAR", "255"),
        ("meta", "Data atribut tambahan berbasis JSON (termasuk bobot berat gram)", "JSON", "Nullable")
    ],
    "tenant_profiles": [
        ("id", "Primary Key data penyewa", "BIGINT UNSIGNED", "20"),
        ("user_id", "Foreign Key penyewa (users.id Customer)", "BIGINT UNSIGNED", "20"),
        ("nama_instansi", "Nama instansi / industri / lembaga penyewa", "VARCHAR", "255"),
        ("npwp", "Nomor Pokok Wajib Pajak instansi", "VARCHAR", "50"),
        ("ktp_path", "Path file foto kartu identitas KTP penanggung jawab", "VARCHAR", "255"),
        ("status_verifikasi", "Status kelengkapan dan validitas berkas (pending, verified, rejected)", "VARCHAR", "30")
    ],
    "pengajuan": [
        ("id", "Primary Key pengajuan", "BIGINT UNSIGNED", "20"),
        ("nomor_pengajuan", "Nomor unik pengajuan layanan (mis. REQ-202611-001)", "VARCHAR", "50"),
        ("user_id", "Foreign Key pemohon layanan (users.id Customer)", "BIGINT UNSIGNED", "20"),
        ("product_id", "Foreign Key produk/jasa yang diajukan (products.id)", "BIGINT UNSIGNED", "20"),
        ("status", "Status pengajuan (Diajukan, Diverifikasi, Menunggu Pembayaran, Diproses, Selesai, Dibatalkan)", "VARCHAR", "50"),
        ("catatan_pemohon", "Catatan teknis spesifikasi pengujian dari customer", "TEXT", "Nullable"),
        ("tanggal_mulai / tanggal_selesai", "Rentang waktu sewa fasilitas ruangan (bila tipe ruangan)", "DATETIME", "Nullable"),
        ("created_at", "Tanggal dan waktu pengajuan diajukan", "TIMESTAMP", "Nullable")
    ],
    "invoices": [
        ("id", "Primary Key invoice", "BIGINT UNSIGNED", "20"),
        ("nomor_invoice", "Nomor tagihan resmi legal (mis. INV-RTPU-2026-0042)", "VARCHAR", "50"),
        ("pengajuan_id", "Foreign Key mengarah ke pengajuan.id (nullable bila ready stock)", "BIGINT UNSIGNED", "20"),
        ("user_id", "Foreign Key pembeli/pemohon yang ditagih (users.id)", "BIGINT UNSIGNED", "20"),
        ("subtotal", "Total nilai tagihan sebelum pengenaan pajak", "DECIMAL", "15,2"),
        ("tax_amount", "Nominal pajak PPN terhitung dari tabel master pajak", "DECIMAL", "15,2"),
        ("total_amount", "Total akhir kewajiban bayar customer (subtotal + tax)", "DECIMAL", "15,2"),
        ("status", "Status tagihan (Unpaid, Paid, Cancelled, Expired)", "VARCHAR", "30"),
        ("due_date", "Batas waktu jatuh tempo transfer pembayaran", "DATE", "Nullable")
    ],
    "invoice_lines": [
        ("id", "Primary Key baris item tagihan", "BIGINT UNSIGNED", "20"),
        ("invoice_id", "Foreign Key mengarah ke invoices.id", "BIGINT UNSIGNED", "20"),
        ("product_id", "Foreign Key mengarah ke products.id", "BIGINT UNSIGNED", "20"),
        ("description", "Deskripsi rincian item atau jasa pengujian", "VARCHAR", "255"),
        ("quantity", "Kuantitas unit barang atau jam sewa", "INT", "11"),
        ("unit_price", "Harga satuan per item", "DECIMAL", "15,2"),
        ("amount", "Subtotal baris (quantity * unit_price)", "DECIMAL", "15,2")
    ],
    "payments": [
        ("id", "Primary Key transaksi pembayaran", "BIGINT UNSIGNED", "20"),
        ("invoice_id", "Foreign Key mengarah ke invoices.id", "BIGINT UNSIGNED", "20"),
        ("payment_method_id", "Foreign Key mengarah ke payment_methods.id", "BIGINT UNSIGNED", "20"),
        ("channel", "Jalur bayar (manual_transfer, payment_gateway)", "VARCHAR", "50"),
        ("amount", "Nominal dana yang dibayarkan", "DECIMAL", "15,2"),
        ("status", "Status verifikasi pembayaran (pending, verified, rejected)", "VARCHAR", "30"),
        ("kuitansi_nomor", "Nomor kuitansi elektronik resmi setelah pembayaran sah", "VARCHAR", "50"),
        ("verified_by", "Foreign Key Admin RTPU yang memvalidasi mutasi (users.id)", "BIGINT UNSIGNED", "20"),
        ("verified_at", "Waktu pembayaran disahkan menjadi lunas", "TIMESTAMP", "Nullable")
    ],
    "payment_proofs": [
        ("id", "Primary Key berkas bukti transfer", "BIGINT UNSIGNED", "20"),
        ("payment_id", "Foreign Key mengarah ke payments.id", "BIGINT UNSIGNED", "20"),
        ("file_path", "Path berkas gambar bukti mutasi transfer bank", "VARCHAR", "255"),
        ("bank_pengirim", "Nama bank asal pengirim transfer", "VARCHAR", "100"),
        ("nama_pengirim", "Nama pemilik rekening pengirim transfer", "VARCHAR", "255"),
        ("catatan", "Keterangan tambahan dari customer", "TEXT", "Nullable")
    ],
    "payment_methods": [
        ("id", "Primary Key kanal pembayaran", "BIGINT UNSIGNED", "20"),
        ("name", "Nama metode pembayaran (Transfer Bank Mandiri BLU, Gateway)", "VARCHAR", "100"),
        ("bank_name", "Nama bank resmi penerima (Bank Mandiri)", "VARCHAR", "100"),
        ("account_number", "Nomor rekening resmi institusi PNJ", "VARCHAR", "50"),
        ("account_holder", "Nama atas nama rekening resmi (BLU PNJ RTPU)", "VARCHAR", "255"),
        ("is_active", "Status keaktifan metode pembayaran", "BOOLEAN", "1")
    ],
    "tax_rates": [
        ("id", "Primary Key master pajak", "BIGINT UNSIGNED", "20"),
        ("name", "Nama tarif pajak (mis. PPN Standar 11%, Bebas Pajak)", "VARCHAR", "100"),
        ("percentage", "Persentase tarif pajak (desimal)", "DECIMAL", "5,2"),
        ("is_default", "Indikator tarif standar yang otomatis diaplikasikan", "BOOLEAN", "1"),
        ("is_active", "Status keaktifan tarif", "BOOLEAN", "1")
    ]
}

GLOSSARY_ITEMS = [
    ("PNJ", "Politeknik Negeri Jakarta; institusi pendidikan tinggi vokasi pengembang dan pemilik platform."),
    ("RTPU", "Unit Rekayasa Teknologi dan Pusat Unggulan PNJ; pemilik kebutuhan utama sistem (klien), penanggung jawab operasional komersialisasi riset."),
    ("P3M", "Pusat Penelitian dan Pengabdian kepada Masyarakat PNJ; unit mitra penentu produk inovasi hilirisasi."),
    ("BLU", "Badan Layanan Umum; pola pengelolaan keuangan fleksibel milik institusi Politeknik Negeri Jakarta."),
    ("PNJ PRIME", "Products, Research, Innovation, and Market Excellence; merek dan platform e-commerce hilirisasi produk PNJ."),
    ("Admin Pengelola", "Pengelola katalog di masing-masing jurusan/unit PNJ yang memiliki hak kelola terbatas pada produk unitnya."),
    ("Kurasi Dua Tahap", "Prosedur peninjauan katalog: verifikasi kelayakan teknis oleh Admin RTPU dan persetujuan penayangan oleh Pimpinan RTPU."),
    ("Customer", "Pengguna eksternal (masyarakat, akademisi, mitra industri) yang membeli produk atau mengajukan sewa fasilitas."),
    ("Invoice", "Dokumen tagihan resmi bernomor unik yang diterbitkan Admin RTPU memuat rincian harga, pajak, dan rekening Mandiri BLU."),
    ("Kuitansi", "Tanda bukti penerimaan pembayaran elektronik yang diterbitkan sistem secara otomatis setelah verifikasi sah."),
    ("Master Pajak", "Tabel konfigurasi tarif persentase Pajak Pertambahan Nilai (PPN) yang dapat diperbarui secara dinamis."),
    ("SSO", "Single Sign-On; sistem otentikasi tunggal terpadu untuk sivitas akademika PNJ."),
    ("RBAC", "Role-Based Access Control; sistem kontrol akses berbasis peran untuk membatasi fitur sesuai wewenang pengguna."),
    ("Inertia.js", "Protokol dan adapter yang menghubungkan backend Laravel dengan frontend React tanpa perancangan REST API terpisah."),
    ("UAT", "User Acceptance Test; pengujian penerimaan sistem bersama klien RTPU sebelum penyerahan final (BAST).")
]
