---
paths:
  - 'tests/**'
  - 'phpunit.xml'
  - 'database/factories/**'
---

# Backend Testing

## WAJIB: suite jalan di PostgreSQL, bukan SQLite

`phpunit.xml` saat ini pin:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

Akibatnya `CREATE EXTENSION btree_gist` gagal → **72 dari 73 test error**. Hijau di SQLite **tidak membuktikan apa pun** tentang jalur produksi.

ADR-03: PostgreSQL satu-satunya DB target **dan** DB test. Ganti env itu ke `pgsql` + database terpisah (`pnj_prime_test`).

Jalankan:

```bash
DB_CONNECTION=pgsql DB_DATABASE=pnj_prime_test php artisan test
```

## Target suite

- 73 test, 22 di antaranya `AccessMatrixTest`. Semua harus hijau.
- Ejecutar `php artisan test --compact` (output JSON ringkas) atau `vendor/bin/phpunit` dengan path/`--filter`.
- Jalankan **setengah** test yang paling sempit yang menutup perubahan.

## PG-only pitfall: sequence tidak transaksional

`RefreshDatabase` memakai transaksi → rollback. Tapi sequence PostgreSQL **tidak** di-rollback. Akibatnya `last_value` terus naik sementara baris hilang.

Akibat nyata: `UsecaseSeeder` insert `metode_pembayaran`, tapi test meng-hardcode `metode_id => 1`. Setelah test sebelumnya berjalan, `exists:metode_pembayaran,id` gagal → upload bukti tertahan → status **tidak** berubah ke "Menunggu Verifikasi Pembayaran" (K-12).

**Jangan** hardcode ID hasil insert di test. Ambil dari model:

```php
$metode = MetodePembayaran::firstOrFail();
// ...
'metode_id' => $metode->id,
```

## Assertion yang salah kalau dipindah ke PG

`test_money_stored_as_integers` hanya menerima `['bigint','integer','decimal']`, tapi `getColumnType()` di PostgreSQL mengembalikan **`int8`** untuk `unsignedBigInteger`. Assertion harus menerima `int8` juga.

## Jenis test

| Level | Tool | Cakupan |
|---|---|---|
| Unit | PHPUnit | `TaxService`, `StockService`, `RoomBookingService`, `PengajuanWorkflow`, `QuoteService` |
| Feature (HTTP) | PHPUnit + PostgreSQL | tiap route × tiap peran; alur lengkap jasa/ruangan/produk/produk unggulan/bayar |
| Konkurensi | PHPUnit + proses paralel di DB nyata | slot ruangan sama → tepat satu menang; stok terakhir → tidak ada stok negatif |
| Frontend | Vitest | komponen & halaman (sudah ada, 39 test) |
| Non-fungsional | k6, OWASP ZAP | NFR3, NFR6, NFR7 |

## Aturan penulisan

- Buat test: `php artisan make:test --phpunit {name}`. **Jangan** sertakan `Feature/` di nama — pakai `SomeFeatureTest`.
- **Feature test** untuk mayoritas. Unit test untuk logika murni.
- Pakai factory: `User::factory()->customer()->create()`. State yang tersedia: `customer`, `adminRtpu`, `adminP3m`, `pimpinanRtpu`, `direktur`, `superAdmin`, `unverified`, `eksternal`.
- **Jangan** bikin model di dalam test — pakai factory.
- Setiap FR punya ≥ 1 test bernama `FR{n}` supaya mudah ditelusuri di TSTPLN.
- Factory/seed demo dipisah dari seed produksi. Seed produksi tidak boleh membuat akun password bawaan.

##Isolasi antar test

Test suite tidak boleh bergantung pada urutan eksekusi. Kalau sebuah test bergantung pada state test sebelumnya, itu bug di test, bukan fitur.

## CI (WP-1.5)

Tahapan wajib: `composer install` → `pint --test` → `migrate:fresh --seed` di service PostgreSQL → `php artisan test` → `npm ci` → `npm run build` → `vitest run` → `composer audit` → cek `public/hot` tidak ada.
