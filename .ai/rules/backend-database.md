---
paths:
  - 'database/migrations/**'
  - 'database/seeders/**'
  - 'database/factories/**'
  - 'app/Models/**'
---

# Database — PostgreSQL

## Aturan dasar

- **PostgreSQL satu-satunya** DB target dan DB test (ADR-03). Tidak ada cabang SQLite/MySQL yang boleh hidup di migrasi.
- Primary key = **bigint** (D-02 opsi A). Runtime pakai bigint di 13 model. **Jangan** tulis `uuid('id')` atau `foreignUuid()`.
- Money = integer rupiah. Kolom `unsignedBigInteger` untuk nominal.
- Migrasi **forward-only**: migrasi yang sudah ter-apply di lingkungan mana pun **tidak diedit**. Buat migrasi baru.

## Fitur PostgreSQL yang boleh dipakai

- `btree_gist` (extensi *trusted*, PG 13+) → exclusion constraint untuk anti-bentrok jadwal.
- `pg_trgm` → index GIN untuk pencarian fuzzy nama produk.
- `jsonb` untuk payload yang fleksibel.

## Exclusion constraint anti-bentrok

```sql
ALTER TABLE room_bookings ADD CONSTRAINT room_bookings_no_overlap
  EXCLUDE USING gist (product_id WITH =, tsrange(starts_at, ends_at) WITH &&)
  WHERE (released_at IS NULL);
```

Service wajib menangkap `SQLSTATE 23P01` dan mengubahnya jadi pesan validasi Indonesia ("Jadwal bentrok dengan pengajuan lain"), bukan 500.

## FK uuid → bigint adalah jebakan

`foreignUuid()` ke PK `bigint` **membatalkan migrasi** saat constraint dibuat. Pesan: `Key columns "user_id" and "id" are of incompatible types: uuid and bigint`.

Semua tabel runtime (users, products, orders, pengajuan, …) PK-nya bigint. Kalau sebuah tabel butuh relasi ke data runtime, pakai `foreignId()`.

## Stok: update atomik

Jangan pakai `stock = stock - X` lewat read-modify-write. Pakai satu UPDATE berkondisi dan batalkan bila tidak ada baris yang berubah:

```sql
UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
```

Bila jumlah baris terpengaruh = 0 → tolak. Balikkan stok saat pengajuan ditolak, dibatalkan, atau tagihan kedaluwarsa.

## 5 migrasi draft (2026_10_13_*)

File-file ini **scaffolding mati** dan **belum pernah berhasil** di PostgreSQL:

- `2026_10_13_000100_create_rbac_tables.php`
- `2026_10_13_000200_create_customers_and_documents.php`
- `2026_10_13_000300_create_catalog_master.php`
- `2026_10_13_000400_create_transactions.php`
- `2026_10_13_000500_create_featured_support.php`

Isinya: 41 `foreignUuid`, 28 `uuid('id')` — bentrok dengan runtime bigint. planned: arsipkan ke `draft_schema/` (WP-1.1). **Sampai itu terjadi, `migrate:fresh` DI PostgreSQL akan gagal di `2026_10_13_000100`.** Jangan tambah migrasi baru di atasnya tanpa menyelesaikan lebih dulu ini.

## Constraint role users (T-26) — belum diperbaiki

`users_role_check` di PostgreSQL masih membatasi 4 role legacy (`admin_rtpu`, `dosen_peneliti`, `mahasiswa`, `eksternal`). Akibatnya:

- `INSERT role='customer'` → `SQLSTATE[23514]` — **registrasi publik 100% gagal**
- `mapUp()` di `expand_user_roles` menulis `customer` ke constraint yang belum dilepas → UPDATE itu sendiri gagal
- branch `pgsql` di `2026_10_11_000001_expand_user_roles.php` **tidak pernah mengubah constraint**, hanya memetakan data

Urutan perbaikan yang benar (bukan sekadar "jalankan mapUp"):

1. `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`
2. Tambah constraint superset (role lama **dan** baru)
3. Jalankan `mapUp()`
4. Persempit ke 6 role final

## Idempoten & rollback

- Seeder harus idempoten (`updateOrCreate`, bukan `create`).
- Seeder **produksi** tidak boleh membuat akun dengan password bawaan. Seeder demo (UserSeeder, ProductSeeder) hanya jalan di `local`/`testing`.
- Command yang memindahkan/menghapus file wajib: `--dry-run`, verifikasi checksum, backup sebelum jalan, hapus sumber **terakhir**.

## Index

Tambahkan index untuk kolom yang sering difilter/sortir. Saat ini `products` **tidak punya index sama sekali** — bukan hanya index pencarian. `pengajuan (user_id, status)`, `pengajuan (status, created_at)`, `orders (status)`, `payment_proofs (verification_status)`.

## Pencarian di PostgreSQL

`LIKE` di PostgreSQL **membedakan huruf besar-kecil**. Untuk pencarian yang mengabaikan case, pakai `ILIKE` atau `whereLike(..., caseSensitive: false)`. `CatalogController` saat ini pakai `->where('name', 'like', ...)` — audit ke behavior ini sebelum ubah.
