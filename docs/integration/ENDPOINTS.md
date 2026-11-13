# Catalog Endpoint REST API v1 (bernardmezo)

Daftar lengkap endpoint API backend yang dikembangkan oleh **bernardmezo** pada branch `origin/feature/backend` (`routes/api.php`).

---

## Ringkasan Endpoint

| No | Method | Path | Auth | Role / Perms | Controller & Action | Status Implementasi |
|---|---|---|---|---|---|---|
| 1 | `GET` | `/api/v1/health` | Public | None | `HealthController@status` | Siap |
| 2 | `GET` | `/api/v1/catalog` | Public | None | `CatalogController@index` | Siap |
| 3 | `GET` | `/api/v1/catalog/{slug}` | Public | None | `CatalogController@show` | Siap |
| 4 | `POST` | `/api/v1/pengajuan/quote`| Public | None | `PengajuanController@quote` | Siap |
| 5 | `POST` | `/api/v1/auth/login` | Public | None | `AuthController@login` | Siap (Perlu Rate Limit) |
| 6 | `GET` | `/api/v1/auth/me` | Bearer (Sanctum) | Any Active User | `AuthController@me` | Siap |
| 7 | `POST` | `/api/v1/auth/logout` | Bearer (Sanctum) | Any Active User | `AuthController@revoke` | Siap |
| 8 | `GET` | `/api/v1/pengajuan` | Bearer (Sanctum) | Customer / Staff | `PengajuanController@index` | Siap |
| 9 | `POST` | `/api/v1/pengajuan` | Bearer (Sanctum) | Customer | `PengajuanController@store` | Siap (Perlu File/PDP) |
| 10 | `GET` | `/api/v1/pengajuan/{id}` | Bearer (Sanctum) | Buyer / Staff | `PengajuanController@show` | Siap |

---

## Rincian Spesifikasi Endpoint

### 1. `GET /api/v1/health`
- **Controller**: `App\Http\Controllers\Api\V1\HealthController::status`
- **Tujuan**: Liveness probe & health monitor sistem.
- **Request**: Tidak ada parameter.
- **Response Success (200 OK)**:
```json
{
  "status": "healthy",
  "api_version": "v1.0.0",
  "timestamp": "2026-10-26T12:00:00Z",
  "database": "connected",
  "environment": "local"
}
```

---

### 2. `GET /api/v1/catalog`
- **Controller**: `App\Http\Controllers\Api\V1\CatalogController::index`
- **Tujuan**: Daftar katalog layanan & produk riset yang aktif dan telah disetujui kurasi (`curation_status = 'approved'`).
- **Query Parameters**:
  - `category` (string, opsional): Filter berdasarkan slug kategori produk.
  - `tipe` (string, opsional): Filter tipe layanan (produk, ruangan, sewa_alat, dll).
  - `search` (string, opsional): Pencarian nama atau deskripsi.
  - `per_page` (integer, default 12, max 50): Jumlah item per halaman.
  - `page` (integer, default 1): Halaman saat ini.
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jasa Kalibrasi Alat",
      "slug": "jasa-kalibrasi-alat",
      "category": { "id": 2, "name": "Pengujian & Kalibrasi", "slug": "pengujian-kalibrasi" },
      "base_price": 750000,
      "curation_status": "approved"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 12,
    "total": 60
  }
}
```

---

### 3. `GET /api/v1/catalog/{slug}`
- **Controller**: `App\Http\Controllers\Api\V1\CatalogController::show`
- **Tujuan**: Mengambil detail spesifikasi layanan/produk berdasarkan slug.
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jasa Kalibrasi Alat",
    "slug": "jasa-kalibrasi-alat",
    "description": "Deskripsi lengkap...",
    "base_price": 750000,
    "category": { "id": 2, "name": "Pengujian & Kalibrasi", "slug": "pengujian-kalibrasi" },
    "opsi": []
  }
}
```
- **Error Responses**:
  - `404 Not Found`: Jika item tidak ditemukan atau belum `curation_status = approved`.

---

### 4. `POST /api/v1/pengajuan/quote`
- **Controller**: `App\Http\Controllers\Api\V1\PengajuanController::quote`
- **Tujuan**: Menghitung estimasi subtotal dan snapshot tarif PPN di sisi server.
- **Request Body (JSON)**:
```json
{
  "product_id": 1,
  "jumlah_peserta": 5,
  "opsi_ids": [1, 2]
}
```
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "quote": {
      "subtotal": 500000
    },
    "tax": {
      "subtotal": 500000,
      "rate_percent": 12.0,
      "tax_amount": 60000,
      "total": 560000
    }
  }
}
```

---

### 5. `POST /api/v1/auth/login`
- **Controller**: `App\Http\Controllers\Api\V1\AuthController::login`
- **Tujuan**: Otentikasi pengguna menggunakan kredensial email & password, mengembalikan personal access token Sanctum (Bearer).
- **Request Body (JSON)**:
```json
{
  "email": "customer@pnjprime.test",
  "password": "password123",
  "device_name": "browser-client"
}
```
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "message": "Autentikasi berhasil.",
  "token": "1|ABCDefgh123456...",
  "token_type": "Bearer",
  "user": {
    "id": 10,
    "name": "Budi Santoso",
    "email": "customer@pnjprime.test",
    "role": "customer",
    "is_active": true
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Kredensial tidak valid.
  - `403 Forbidden`: Akun dinonaktifkan (`is_active = false`).
  - `422 Unprocessable Entity`: Validasi format gagal.

---

### 6. `GET /api/v1/auth/me`
- **Controller**: `App\Http\Controllers\Api\V1\AuthController::me`
- **Header**: `Authorization: Bearer <token>`
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": 10,
    "name": "Budi Santoso",
    "email": "customer@pnjprime.test",
    "role": "customer"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Token tidak ada, invalid, atau dicabut.

---

### 7. `POST /api/v1/auth/logout`
- **Controller**: `App\Http\Controllers\Api\V1\AuthController::revoke`
- **Header**: `Authorization: Bearer <token>`
- **Tujuan**: Mencabut (delete) token akses yang sedang digunakan.
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "message": "Token berhasil dicabut."
}
```

---

### 8. `GET /api/v1/pengajuan`
- **Controller**: `App\Http\Controllers\Api\V1\PengajuanController::index`
- **Header**: `Authorization: Bearer <token>`
- **Query Parameters**: `per_page` (integer, default 10).
- **Tujuan**: Daftar pengajuan milik pengguna yang login (berdasarkan `buyer_id`).
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 25,
      "code": "PNJ-20261026-0025",
      "tipe": "produk",
      "status": "Menunggu Review",
      "total": 500000,
      "created_at": "2026-10-26T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "total": 25
  }
}
```

---

### 9. `POST /api/v1/pengajuan`
- **Controller**: `App\Http\Controllers\Api\V1\PengajuanController::store`
- **Header**: `Authorization: Bearer <token>`
- **Request Body (JSON)**:
```json
{
  "tipe": "produk",
  "product_id": 1,
  "keperluan": "Penelitian riset mahasiswa",
  "jumlah": "2 unit",
  "opsi": [
    { "id": 1, "qty": 1 }
  ]
}
```
- **Response Success (201 Created)**:
```json
{
  "success": true,
  "message": "Pengajuan berhasil dibuat.",
  "data": {
    "id": 26,
    "code": "PNJ-20261026-0026",
    "tipe": "produk",
    "status": "Menunggu Review",
    "total": 1000000
  }
}
```

---

### 10. `GET /api/v1/pengajuan/{id}`
- **Controller**: `App\Http\Controllers\Api\V1\PengajuanController::show`
- **Header**: `Authorization: Bearer <token>`
- **Tujuan**: Mengambil detail pengajuan.
- **Otorisasi**: Hanya pemilik (`buyer_id`) atau peran staf (`super_admin`, `admin_rtpu`, `pimpinan_rtpu`, `direktur`).
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 26,
    "code": "PNJ-20261026-0026",
    "tipe": "produk",
    "status": "Menunggu Review",
    "total": 1000000,
    "buyer": { "id": 10, "name": "Budi Santoso" },
    "product": { "id": 1, "name": "Jasa Kalibrasi Alat" }
  }
}
```
- **Error Responses**:
  - `403 Forbidden`: Pengguna lain mencoba mengakses pengajuan bukan miliknya (IDOR protection).
  - `404 Not Found`: Pengajuan tidak ditemukan.
