# Review Backend API PNJ PRIME (bernardmezo)

**Tanggal Evaluasi**: 26 Oktober 2026  
**Pemeriksa**: Antigravity Pair Programmer  
**Branch Sumber**: `origin/feature/backend` (`https://github.com/bernardmezo/pnj-prime.git`)  
**Commit Ditinjau**: `dbdb03d` (feat(api): implement REST API v1 endpoints, Sanctum tokens, and resources)

---

## 1. Candid Verdict: Are the Endpoints Good?

### **VERDICT: MOSTLY (Dengan Catatan Kritis — Belum Siap Menjadi Backend Utama)**

Endpoints yang dibuat oleh Bernard pada dasarnya **terstruktur dengan rapi** menggunakan konvensi Laravel modern (Form Requests, Eloquent API Resources, versioning `v1`), memiliki validasi dasar yang baik, dan berhasil lolos unit/feature tests Sanctum. Namun, API ini **hanya meng-cover ~20% dari seluruh Use Case aplikasi**, dan memiliki celah keamanan serta batasan fungsional penting yang harus diselesaikan sebelum bisa menggantikan backend legacy.

### 4 Alasan Utama:
1. **Cakupan Sangat Terbatas (Coverage Gap)**: Bernard baru membuat **10 endpoints** (hanya mencakup Health, Katalog Publik, Login/Logout, Quote, dan Pengajuan dasar). Sebanyak **10 domain inti lainnya** (Registrasi, Pembayaran & Bukti Transfer, Verifikasi Admin RTPU, Produk Unggulan P3M, Verifikasi Pimpinan, Kelola Layanan, Kelola User, Hak Akses RBAC, Kelola Fitur, dan Laporan Direktur) **BELUM MEMILIKI ENDPOINT API SAMA SEKALI**.
2. **Arsitektur Auth Kurang Sesuai untuk SPA Inertia**: Bernard mengimplementasikan Sanctum Bearer Token (`createToken('device')->plainTextToken`) yang ditujukan untuk mobile apps atau external clients. Jika browser/frontend SPA menyimpannya di `localStorage`, hal ini rentan terhadap serangan XSS dan melanggar Ground Rule keamanan. Frontend PNJ PRIME adalah Inertia React yang berjalan satu origin dan sudah menggunakan session cookie berbasis CSRF yang jauh lebih aman.
3. **Celah Keamanan: Ketiadaan Rate Limiting pada Login**: Endpoint `/api/v1/auth/login` tidak dipasangi throttle middleware (`throttle:api` atau `throttle:6,1`), sehingga rentan terhadap serangan brute-force kredensial akun staf maupun customer.
4. **Kalkulasi & Snapshot Pajak Tidak Konsisten pada Store Pengajuan**: Pada endpoint `POST /api/v1/pengajuan/quote`, pajak PPN dihitung secara rapi. Namun pada `POST /api/v1/pengajuan` (`store`), total pengajuan hanya diisi dengan subtotal murni (`$pengajuan->total = $quote['subtotal']`) tanpa memasukkan tax breakdown atau total akhir dengan PPN ke snapshot pengajuan. Selain itu, file dokumen pengajuan dan persetujuan PDP (Perlindungan Data Pribadi) belum didukung pada request `store`.

---

## 2. Scorecard Per Endpoint Group

| Endpoint Group | Cakupan Endpoint | Status Score | Rangkuman Evaluasi |
|---|---|---|---|
| **Health Probe** | `GET /health` | **GOOD** | Respon JSON cepat, informatif, memeriksa koneksi database dan environment. |
| **Katalog Layanan** | `GET /catalog`, `GET /catalog/{slug}` | **GOOD** | Filtering rapi (`category`, `tipe`, `search`), paginasi teratur, eager loading `category` & `opsi`, menyaring item aktif & kurasi disetujui. |
| **Pricing Engine** | `POST /pengajuan/quote` | **GOOD** | Perhitungan server-side melalui `PricingService` dan `TaxService`, snapshot persentase & nominal PPN akurat. |
| **Autentikasi (Auth)** | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | **NEEDS WORK** | Token Bearer Sanctum berfungsi dengan baik dan pencabutan token valid, namun **tidak ada rate limiter** dan tidak ada endpoint **Registrasi akun customer**. |
| **Pengajuan Layanan** | `GET /pengajuan`, `POST /pengajuan`, `GET /pengajuan/{id}` | **NEEDS WORK** | Otorisasi IDOR dicegah (`$pengajuan->buyer_id !== $user->id`), namun `store` tidak mendukung upload dokumen, persetujuan PDP belum divalidasi, dan total belum include PPN. |
| **Pembayaran & Verifikasi** | *Tidak ada* | **UNACCEPTABLE (GAP)** | Belum diimplementasikan sama sekali dalam API v1. |
| **Produk Unggulan & Dokumen** | *Tidak ada* | **UNACCEPTABLE (GAP)** | Belum diimplementasikan sama sekali dalam API v1. |
| **Master Data & RBAC** | *Tidak ada* | **UNACCEPTABLE (GAP)** | Belum diimplementasikan sama sekali dalam API v1. |

---

## 3. Matriks Paritas vs Backend Legacy

| Domain Fungsional | Use Case Terkait | Backend Legacy (Web/Inertia) | API v1 Bernard (`routes/api.php`) | Status Integrasi |
|---|---|---|---|---|
| **Autentikasi & Registrasi** | UC-01, UC-02 | Lengkap (Login, Register, Logout, Profile) | Parsial (Login, Me, Logout. **No Register**) | Parsial (BFF / hybrid) |
| **Katalog & Detail** | UC-08, UC-09 | Lengkap (Filter, Search, Kategori, Detail) | Lengkap (`/catalog`, `/catalog/{slug}`) | **Siap Diintegrasikan** |
| **Pricing & Quote PPN** | UC-10 | Lengkap (PricingService) | Lengkap (`/pengajuan/quote`) | **Siap Diintegrasikan** |
| **Pengajuan Layanan** | UC-10, UC-11 | Lengkap (Form bertahap, berkas, PDP) | Parsial (Draft tanpa berkas/PDP) | Parsial (Gunakan Legacy untuk berkas) |
| **Riwayat & Monitoring** | UC-12, UC-18 | Lengkap (Tabel status, filter, riwayat) | Parsial (`GET /pengajuan`, `{id}`) | Parsial |
| **Pembayaran & Bukti** | UC-13, UC-14 | Lengkap (Mandiri BLU, upload bukti, status) | **Tidak Ada** | **Wajib Legacy** |
| **Verifikasi RTPU** | UC-15, UC-16, UC-17 | Lengkap (Setujui/Tolak berkas, pembayaran) | **Tidak Ada** | **Wajib Legacy** |
| **Produk Unggulan P3M** | UC-21 s/d UC-25 | Lengkap (Ajukan, upload HKI/berkas, monitoring) | **Tidak Ada** | **Wajib Legacy** |
| **Verifikasi Pimpinan** | UC-26 s/d UC-30 | Lengkap (Approve/Reject produk unggulan) | **Tidak Ada** | **Wajib Legacy** |
| **Pemantauan Direktur** | UC-31, UC-32 | Lengkap (Read-only dashboard & laporan) | **Tidak Ada** | **Wajib Legacy** |
| **Kelola Layanan RTPU** | UC-33 s/d UC-36 | Lengkap (CRUD layanan, opsi add-on) | **Tidak Ada** | **Wajib Legacy** |
| **Kelola User & RBAC** | UC-37 s/d UC-44 | Lengkap (Manajemen akun, hak akses matriks) | **Tidak Ada** | **Wajib Legacy** |

---

## 4. Evaluasi Kualitas Desain API (Section 2.2)

1. **Struktur Resource & Konvensi Penamaan**:
   - URL terstruktur dengan baik menggunakan prefix `/api/v1/`.
   - Terjadi pencampuran bahasa pada parameter/payload: kunci wrapper berbahasa Inggris (`success`, `message`, `data`, `meta`), tetapi field body berbahasa Indonesia (`tipe`, `keperluan`, `jumlah`, `peserta`, `jam_mulai`, `jam_selesai`). Disarankan untuk konsisten menggunakan Bahasa Indonesia untuk domain model atau memetakannya secara standar.
2. **HTTP Verbs & Status Codes**:
   - `GET` untuk retrieval, `POST` untuk creation & calculation.
   - Menggunakan kode status yang tepat: `200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, dan `422 Unprocessable Entity`.
3. **Format Paginasi**:
   - Format envelope paginasi pada katalog:
     `"meta": { "current_page": 1, "last_page": 5, "per_page": 12, "total": 60 }`.
   - Pada endpoint `/pengajuan`, field `per_page` terlewat di array meta.
4. **Format Uang & Tanggal**:
   - Nilai uang direpresentasikan dalam integer Rupiah (contoh: `500000`), tidak menggunakan floating point.
   - Tanggal menggunakan format standar ISO 8601.

---

## 5. Analisis Keamanan (Section 2.4)

| Aspek Keamanan | Temuan | Tingkat Keparahan | Rekomendasi |
|---|---|---|---|
| **Rate Limiting** | Endpoint `POST /api/v1/auth/login` tidak dilindungi throttle middleware. | **Major** | Tambahkan `throttle:6,1` pada rute login di `routes/api.php`. |
| **Token Handling** | Menggunakan Bearer token untuk otentikasi. Jika frontend menyimpannya di `localStorage`, rentan serangan XSS. | **Major** | Gunakan cookie sesi terenkripsi (Sanctum SPA cookie) atau jalankan melalui BFF Controller di Laravel. |
| **IDOR Protection** | Endpoint `GET /api/v1/pengajuan/{id}` memeriksa kepemilikan (`$pengajuan->buyer_id !== $user->id`) dan role staf. | **Good** | Sudah aman dari serangan IDOR. |
| **PDP Consent** | Endpoint `POST /api/v1/pengajuan` tidak memvalidasi persetujuan PDP sebelum menyimpan transaksi. | **Major** | Tambahkan validasi persetujuan PDP pada `StorePengajuanApiRequest`. |
| **File Upload Handling** | Endpoint API saat ini belum menangani multipart file upload dokumen. | **Minor** | Tambahkan endpoint khusus upload dokumen dengan validasi tipe mime dan penyimpanan di private disk. |

---

## 6. Matriks Akses Peran × Endpoint (Section 2.6)

| Endpoint | Guest | Customer | Admin RTPU | Admin P3M | Pimpinan | Direktur | Super Admin |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/health` | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `GET /api/v1/catalog` | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `GET /api/v1/catalog/{slug}` | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `POST /api/v1/pengajuan/quote`| Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `POST /api/v1/auth/login` | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `GET /api/v1/auth/me` | Deny (401) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `POST /api/v1/auth/logout` | Deny (401) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) | Allow (200) |
| `GET /api/v1/pengajuan` | Deny (401) | Allow (Own) | Allow (All) | Allow (All) | Allow (All) | Allow (All) | Allow (All) |
| `POST /api/v1/pengajuan` | Deny (401) | Allow (201) | Deny (403)* | Deny (403)* | Deny (403)* | Deny (403)* | Deny (403)* |
| `GET /api/v1/pengajuan/{id}` | Deny (401) | Allow (Own) | Allow (200) | Deny (403) | Allow (200) | Allow (200) | Allow (200) |

*\*Catatan: Pada implementasi Bernard, `store` saat ini mengizinkan setiap user terautentikasi membuat pengajuan. Seharusnya hanya role Customer yang diizinkan mengajukan.*

---

## 7. Rekomendasi Integrasi Per Domain

1. **Domain Katalog (`DATA_SOURCE_CATALOG=bernard`)**: **BISA DIINTEGRASIKAN**. Endpoint `/api/v1/catalog` dan detail `/api/v1/catalog/{slug}` sudah matang dan cocok dengan UI katalog.
2. **Domain Pricing / Quote (`DATA_SOURCE_QUOTE=bernard`)**: **BISA DIINTEGRASIKAN**. Endpoint `/api/v1/pengajuan/quote` memberikan perhitungan harga dan pajak PPN yang akurat.
3. **Domain Autentikasi (`DATA_SOURCE_AUTH=legacy`)**: **TETAPKAN PADA LEGACY**. Frontend Inertia membutuhkan session cookie dan fitur registrasi yang tidak disediakan oleh API Bearer token Bernard.
4. **Domain Pengajuan & Transaksi (`DATA_SOURCE_PENGAJUAN=legacy`)**: **TETAPKAN PADA LEGACY**. Form pengajuan frontend memerlukan upload multi-dokumen dan persetujuan PDP yang belum ada pada endpoint API Bernard.
5. **Domain Pembayaran, Verifikasi, Produk Unggulan, RBAC, dan Manajemen (`DATA_SOURCE_*=legacy`)**: **TETAPKAN PADA LEGACY** karena Bernard belum menyediakan endpoint untuk domain-domain ini.
