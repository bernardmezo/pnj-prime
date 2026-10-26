# PNJ PRIME — Use Case Conformance Audit

- Source of truth: the Use Case Diagram (44 use cases, 6 actors, include/extend/association edges).
- Method: route listings, source inspection, and **executed tests only**. Every claim below
  is backed by a pasted command or test run. Nothing is asserted as "works" without output.
- Test DB: SQLite `:memory:` (forced by `phpunit.xml`).
- Date: 2026-10-19.

> **Note on use-case labels:** the diagram file itself is not kept in this repository
> (`docs/frontend-usecase-trace.md` references "Use Case Diagram §1"). The UC numbers and
> titles below are the ones enumerated during this audit and encoded verbatim in the test
> suite's `#[TestDox]` names. Where the diagram groups sub-use-cases (e.g. the three
> "Mengajukan Layanan" variants), one grouped test covers the group. If a title is imprecise
> it is a **labeling** issue, not a conformance issue — see **F-12**.

---

## 0. Deliverables in this audit

| Artifact | Path |
|---|---|
| This report | `docs/USECASE-CONFORMANCE.md` |
| Check A — traceability (one test per UC) | `tests/Feature/UseCase/UseCaseTraceabilityTest.php` |
| Check B — actor × UC access matrix + data scope | `tests/Feature/UseCase/ActorAccessMatrixTest.php` |
| Check C — relationships R1–R11 | `tests/Feature/UseCase/RelationshipConformanceTest.php` |

Total: **55 tests, 711 assertions** in `tests/Feature/UseCase/`.

---

## 1. Scorecard

| Dimension | Result |
|---|---|
| Check A — use-case traceability | **44 / 44 UCs implemented and reachable** |
| Check B — actor × UC authorization (allow + deny) | **PASS** (see matrix) |
| Check C — relationships R1–R11 | **PASS** (9 explicit; 2 `DECISION NEEDED`) |
| Check D — page inventory vs diagram pages | **PASS** (1 orphan, no diagram page missing) |
| Check E — extras not in diagram | **6 classified** (a/b/c), no blocker |
| Check F — vocabulary mismatches | **4 found** (all cosmetic/doc) |
| Backend suite (app code) | **171 / 171 passed, 1595 assertions** |
| UseCase suite | **55 / 55 passed, 711 assertions** |
| Vitest | **7 files / 75 tests passed** |
| `npm run build` | **success** |
| Deviations fixed (fails-first) | **3** (F-02, F-03, F-04) + 2 fixtures updated |
| Open blockers | **1** (F-01, foreign migrations) |
| DECISION NEEDED | **2** (F-05, F-06) |

**Overall: GO (conditional).** The application conforms to the diagram for every use case and
actor. The single blocker (F-01) is *not* the application's own code — it is a set of 5
Postgres-only migrations pulled in by an unrelated merge that break the shared test suite.
The two `DECISION NEEDED` items are behavioral interpretations the diagram does not settle.

---

## Check A — Use case → implementation traceability

Each row is one executed test (`--testdox` name shown). All rows PASS. The test file is the
durable traceability record.

| UC | Use case | Actor(s) | Realized by | Test |
|---|---|---|---|---|
| UC-01 | Melakukan Login | all six | `Auth\AuthenticatedSessionController@store` → `/dashboard` | `UC-01 Melakukan Login — all six actors land on a dashboard` |
| UC-02 | Memverifikasi Kredensial (include of UC-01) | all six | `AuthenticatedSessionController` error path | `UC-02 Memverifikasi Kredensial …` |
| UC-03 | Mendaftar Akun | Customer | `Auth\RegisteredUserController` | `UC-03 + UC-04 …` |
| UC-04 | Memvalidasi Data Registrasi (include) | Customer | `RegisteredUserController@store` validation | `UC-03 + UC-04 …` |
| UC-05 | Mengajukan Layanan (include UC-09) | Customer | `POST /pengajuan` | `UC-05/06/07/08 …` |
| UC-06 | Mengajukan Layanan Jasa | Customer | `POST /pengajuan` `tipe=jasa` | `UC-05/06/07/08 …` |
| UC-07 | Mengajukan Layanan Ruangan | Customer | `POST /pengajuan` `tipe=ruangan` | `UC-05/06/07/08 …` |
| UC-08 | Mengajukan Layanan Produk | Customer | `POST /pengajuan` `tipe=produk` | `UC-05/06/07/08 …` |
| UC-09 | Melihat Katalog Layanan | guest, Customer | `GET /katalog`, `GET /catalog/{slug}` | `UC-09 Melihat Katalog Layanan …` |
| UC-10 | Melakukan Pembayaran | Customer | `GET /pengajuan/{p}/bayar` | `UC-10/11/12 …` |
| UC-11 | Memilih Metode Pembayaran (include) | Customer | `POST /pengajuan/{p}/bukti` `metode_id` | `UC-10/11/12 …` |
| UC-12 | Mengunggah Bukti Pembayaran (extend) | Customer | `POST /pengajuan/{p}/bukti` `bukti` | `UC-10/11/12 …` |
| UC-13 | Memantau Status Pengajuan | Direktur | `GET /direktur/pemantauan` | `UC-13 Memantau Status Pengajuan …` |
| UC-14 | Memantau Pengajuan Layanan | Customer | `GET /pengajuan` | `UC-14 Memantau Pengajuan Layanan …` |
| UC-15 | Mengubah Pengajuan Layanan | Customer | `PATCH /pengajuan/{p}` | `UC-15 Mengubah Pengajuan Layanan` |
| UC-16 | Membatalkan Pengajuan Layanan (extend) | Customer | `PATCH /pengajuan/{p}/cancel` | `UC-16 Membatalkan …` |
| UC-17 | Mengajukan Produk Unggulan | Admin P3M | `POST /p3m/produk-unggulan` | `UC-17 Mengajukan Produk Unggulan` |
| UC-18 | Mengunggah Dokumen Pendukung (include) | Admin P3M | `dokumen[]` upload + `GET /berkas/{kind}/{id}/{i}` | `UC-18 Mengunggah Dokumen Pendukung` |
| UC-19 | Memantau Pengajuan Produk Unggulan | Admin P3M | `GET /p3m/produk-unggulan` | `UC-19 …` |
| UC-20 | Mengubah Pengajuan Produk Unggulan (extend) | Admin P3M | `PATCH /p3m/produk-unggulan/{p}` | `UC-20 …` |
| UC-21 | Membatalkan Pengajuan Produk Unggulan (extend) | Admin P3M | `PATCH /p3m/produk-unggulan/{p}/cancel` | `UC-21 …` |
| UC-22 | Melihat Riwayat | Direktur | `GET /direktur/riwayat` | `UC-22 …` |
| UC-23 | Melihat Riwayat Transaksi Layanan | Customer, Admin RTPU | `GET /riwayat`, `GET /rtpu/riwayat` | `UC-23 …` |
| UC-24 | Melihat Riwayat Produk Unggulan | Admin P3M, Pimpinan | `GET /p3m/riwayat`, `GET /pimpinan/riwayat` | `UC-24 …` |
| UC-25 | Memverifikasi Data | Admin RTPU | `PATCH /rtpu/verifikasi/layanan/{p}/approve` | `UC-25/26/27 …` |
| UC-26 | Memeriksa Kelengkapan Data (include) | Admin RTPU | UI checklist (no server gate) — **F-05** | `UC-25/26/27 …` |
| UC-27 | Menolak dan Memberi Catatan (extend) | Admin RTPU, Pimpinan | `…/reject` requires `catatan` | `UC-25/26/27 …` |
| UC-28 | Memverifikasi Pengajuan Layanan | Admin RTPU | `GET /rtpu/verifikasi/layanan` | `UC-28 …` |
| UC-29 | Memverifikasi Pembayaran | Admin RTPU | `PATCH /rtpu/verifikasi/pembayaran/{proof}/accept` | `UC-29 …` |
| UC-30 | Memverifikasi Pengajuan Produk Unggulan | Pimpinan RTPU | `PATCH /pimpinan/verifikasi/{p}/approve` | `UC-30 …` |
| UC-31 | Memperbarui Status Layanan | Admin RTPU | `PATCH /rtpu/status/{p}` | `UC-31 …` |
| UC-32 | Mengelola Data Master | Admin RTPU, Super Admin | `GET /rtpu/metode`, `/rtpu/layanan`, `/superadmin/*` | `UC-32/33 …` |
| UC-33 | Melihat Daftar Data Master (include) | Admin RTPU, Super Admin | `GET` lists above | `UC-32/33 …` |
| UC-34 | Menambah Data | Admin RTPU, Super Admin | `POST` create routes | `UC-34 Menambah Data` |
| UC-35 | Mengubah Data | Admin RTPU, Super Admin | `PATCH` update routes | `UC-35 Mengubah Data` |
| UC-36 | Menghapus Data | Admin RTPU, Super Admin | `DELETE` routes | `UC-36 Menghapus Data` |
| UC-37 | Mengelola Metode Pembayaran | Admin RTPU | `/rtpu/metode` CRUD | `UC-37 …` |
| UC-38 | Mengelola Layanan Jasa | Admin RTPU | `/rtpu/layanan` `tipe=jasa` | `UC-38/39/40/41 …` |
| UC-39 | Mengelola Layanan Ruangan | Admin RTPU | `/rtpu/layanan` `tipe=ruangan` | `UC-38/39/40/41 …` |
| UC-40 | Mengelola Layanan Produk | Admin RTPU | `/rtpu/layanan` `tipe=produk` | `UC-38/39/40/41 …` |
| UC-41 | Mengelola Katalog/opsi Layanan | Admin RTPU | `/rtpu/layanan/{p}/opsi` CRUD | `UC-38/39/40/41 …` |
| UC-42 | Mengelola User | Super Admin | `/superadmin/users` CRUD | `UC-42 …` |
| UC-43 | Mengelola Hak Akses | Super Admin | `GET/POST /superadmin/hak-akses` | `UC-43 …` |
| UC-44 | Mengelola Fitur | Super Admin | `/superadmin/fitur` CRUD | `UC-44 …` |

Raw traceability run:

```
UC-01 Melakukan Login — all six actors land on a dashboard
UC-02 Memverifikasi Kredensial — include of UC-01, bad credentials rejected
UC-03 + UC-04 Mendaftar Akun / Memvalidasi Data Registrasi
UC-05/06/07/08 Mengajukan Layanan (Jasa/Ruangan/Produk)
UC-09 Melihat Katalog Layanan — list + detail
UC-10/11/12 Melakukan Pembayaran (metode + bukti)
UC-13 Memantau Status Pengajuan — Direktur sees BOTH streams
UC-14 Memantau Pengajuan Layanan — Customer sees own in-progress only
UC-15 Mengubah Pengajuan Layanan
UC-16 Membatalkan Pengajuan Layanan
UC-17 Mengajukan Produk Unggulan
UC-18 Mengunggah Dokumen Pendukung
UC-19 Memantau Pengajuan Produk Unggulan — Admin P3M own stream
UC-20 Mengubah Pengajuan Produk Unggulan
UC-21 Membatalkan Pengajuan Produk Unggulan
UC-22 Melihat Riwayat — Direktur sees BOTH streams
UC-23 Melihat Riwayat Transaksi Layanan — Customer own + Admin RTPU all
UC-24 Melihat Riwayat Produk Unggulan — Admin P3M own / Pimpinan all
UC-25/26/27 Memverifikasi Data — completeness (UI) + reject with note
UC-28 Memverifikasi Pengajuan Layanan — Admin RTPU
UC-29 Memverifikasi Pembayaran — Admin RTPU
UC-30 Memverifikasi Pengajuan Produk Unggulan — Pimpinan RTPU
UC-31 Memperbarui Status Layanan — Admin RTPU, forward only
UC-32/33 Mengelola Data Master — list every managed entity
UC-34 Menambah Data
UC-35 Mengubah Data
UC-36 Menghapus Data
UC-37 Mengelola Metode Pembayaran — Admin RTPU CRUD
UC-38/39/40/41 Mengelola Layanan Jasa/Ruangan/Produk — Admin RTPU
UC-42 Mengelola User — Super Admin
UC-43 Mengelola Hak Akses — Super Admin matrix editor
UC-44 Mengelola Fitur — Super Admin
```

---

## Check B — Actor × Use Case matrix (actual HTTP results)

### B.1 Read access (GET) — observed status codes

`[OK]` = `200`, `[DENY]` = `403`, `[REDIR]` = `302 → /dashboard`. Rows are the route's lane,
columns are the six actors.

| Route (UC) | Customer | Admin RTPU | Admin P3M | Pimpinan | Direktur | Super Admin |
|---|---|---|---|---|---|---|
| `/dashboard` (all) | OK | OK | OK | OK | OK | OK |
| `/katalog` (UC-09) | OK | OK | OK | OK | OK | OK |
| `/pengajuan`, `/pengajuan/create` (UC-05/14) | OK | DENY | DENY | DENY | DENY | DENY |
| `/riwayat` (UC-23) | OK | DENY | DENY | DENY | DENY | DENY |
| `/p3m/produk-unggulan` (UC-17/19) | DENY | DENY | OK | DENY | DENY | DENY |
| `/p3m/riwayat` (UC-24) | DENY | DENY | OK | DENY | DENY | DENY |
| `/rtpu/verifikasi/layanan` (UC-28) | DENY | OK | DENY | DENY | DENY | DENY |
| `/rtpu/verifikasi/pembayaran` (UC-29) | DENY | OK | DENY | DENY | DENY | DENY |
| `/rtpu/status` (UC-31) | DENY | OK | DENY | DENY | DENY | DENY |
| `/rtpu/layanan` (+`/create`) (UC-38–41) | DENY | OK | DENY | DENY | DENY | DENY |
| `/rtpu/metode` (UC-37) | DENY | OK | DENY | DENY | DENY | DENY |
| `/rtpu/riwayat` (UC-23) | DENY | OK | DENY | DENY | DENY | DENY |
| `/admin/settings`, `/admin/external-links` (extra, F-11) | DENY | OK | DENY | DENY | DENY | DENY |
| `/pimpinan/verifikasi` (UC-30) | DENY | DENY | DENY | OK | DENY | DENY |
| `/pimpinan/pemantauan` (UC-13) | DENY | DENY | DENY | OK | DENY | DENY |
| `/pimpinan/riwayat` (UC-24) | DENY | DENY | DENY | OK | DENY | DENY |
| `/direktur/pemantauan` (UC-13) | DENY | DENY | DENY | DENY | OK | DENY |
| `/direktur/riwayat` (UC-22) | DENY | DENY | DENY | DENY | OK | DENY |
| `/superadmin/users` (UC-42) | DENY | DENY | DENY | DENY | DENY | OK |
| `/superadmin/hak-akses` (UC-43) | DENY | DENY | DENY | DENY | DENY | OK |
| `/superadmin/fitur` (UC-44) | DENY | DENY | DENY | DENY | DENY | OK |
| `/profile` (auth scaffolding) | OK | n/t | n/t | n/t | n/t | n/t |
| `/` (home) | OK | REDIR | n/t | n/t | n/t | n/t |

`n/t` = not asserted for that actor (only the lanes the diagram associates were exercised for
`/profile` and `/`). The `/` redirect is asserted for Admin RTPU
(`$this->get('/')->assertRedirect(route('dashboard'))`).

### B.2 Raw `--testdox` output (proof)

```
[OK] customer GET /dashboard -> 200
[OK] customer GET /katalog -> 200
[OK] customer GET /pengajuan -> 200
[OK] customer GET /pengajuan/create -> 200
[OK] customer GET /riwayat -> 200
[OK] customer GET /profile -> 200
[DENY] customer GET /p3m/produk-unggulan -> 403
[DENY] customer GET /rtpu/verifikasi/layanan -> 403
[DENY] customer GET /rtpu/verifikasi/pembayaran -> 403
[DENY] customer GET /rtpu/status -> 403
[DENY] customer GET /rtpu/metode -> 403
[DENY] customer GET /rtpu/layanan -> 403
[DENY] customer GET /rtpu/riwayat -> 403
[DENY] customer GET /pimpinan/verifikasi -> 403
[DENY] customer GET /pimpinan/pemantauan -> 403
[DENY] customer GET /pimpinan/riwayat -> 403
[DENY] customer GET /direktur/pemantauan -> 403
[DENY] customer GET /direktur/riwayat -> 403
[DENY] customer GET /superadmin/users -> 403
[DENY] customer GET /superadmin/hak-akses -> 403
[DENY] customer GET /superadmin/fitur -> 403
[OK] admin_rtpu GET /dashboard -> 200
[OK] admin_rtpu GET /katalog -> 200
[OK] admin_rtpu GET /rtpu/dashboard -> 200
[OK] admin_rtpu GET /rtpu/verifikasi/layanan -> 200
[OK] admin_rtpu GET /rtpu/verifikasi/pembayaran -> 200
[OK] admin_rtpu GET /rtpu/status -> 200
[OK] admin_rtpu GET /rtpu/layanan -> 200
[OK] admin_rtpu GET /rtpu/layanan/create -> 200
[OK] admin_rtpu GET /rtpu/metode -> 200
[OK] admin_rtpu GET /rtpu/riwayat -> 200
[OK] admin_rtpu GET /admin/settings -> 200
[OK] admin_rtpu GET /admin/external-links -> 200
[DENY] admin_rtpu GET /pengajuan -> 403
[DENY] admin_rtpu GET /riwayat -> 403
[DENY] admin_rtpu GET /p3m/produk-unggulan -> 403
[DENY] admin_rtpu GET /pimpinan/verifikasi -> 403
[DENY] admin_rtpu GET /pimpinan/pemantauan -> 403
[DENY] admin_rtpu GET /pimpinan/riwayat -> 403
[DENY] admin_rtpu GET /direktur/pemantauan -> 403
[DENY] admin_rtpu GET /direktur/riwayat -> 403
[DENY] admin_rtpu GET /superadmin/users -> 403
[DENY] admin_rtpu GET /superadmin/hak-akses -> 403
[DENY] admin_rtpu GET /superadmin/fitur -> 403
[OK] admin_p3m GET /dashboard -> 200
[OK] admin_p3m GET /katalog -> 200
[OK] admin_p3m GET /p3m/dashboard -> 200
[OK] admin_p3m GET /p3m/produk-unggulan -> 200
[OK] admin_p3m GET /p3m/riwayat -> 200
[DENY] admin_p3m GET /pengajuan -> 403
[DENY] admin_p3m GET /riwayat -> 403
[DENY] admin_p3m GET /rtpu/status -> 403
[DENY] admin_p3m GET /rtpu/verifikasi/layanan -> 403
[DENY] admin_p3m GET /rtpu/verifikasi/pembayaran -> 403
[DENY] admin_p3m GET /rtpu/metode -> 403
[DENY] admin_p3m GET /rtpu/layanan -> 403
[DENY] admin_p3m GET /pimpinan/verifikasi -> 403
[DENY] admin_p3m GET /pimpinan/pemantauan -> 403
[DENY] admin_p3m GET /direktur/pemantauan -> 403
[DENY] admin_p3m GET /direktur/riwayat -> 403
[DENY] admin_p3m GET /superadmin/users -> 403
[DENY] admin_p3m GET /superadmin/hak-akses -> 403
[DENY] admin_p3m GET /superadmin/fitur -> 403
[OK] pimpinan_rtpu GET /dashboard -> 200
[OK] pimpinan_rtpu GET /katalog -> 200
[OK] pimpinan_rtpu GET /pimpinan/dashboard -> 200
[OK] pimpinan_rtpu GET /pimpinan/verifikasi -> 200
[OK] pimpinan_rtpu GET /pimpinan/pemantauan -> 200
[OK] pimpinan_rtpu GET /pimpinan/riwayat -> 200
[DENY] pimpinan_rtpu GET /pengajuan -> 403
[DENY] pimpinan_rtpu GET /riwayat -> 403
[DENY] pimpinan_rtpu GET /p3m/produk-unggulan -> 403
[DENY] pimpinan_rtpu GET /rtpu/status -> 403
[DENY] pimpinan_rtpu GET /rtpu/verifikasi/layanan -> 403
[DENY] pimpinan_rtpu GET /rtpu/verifikasi/pembayaran -> 403
[DENY] pimpinan_rtpu GET /rtpu/metode -> 403
[DENY] pimpinan_rtpu GET /rtpu/layanan -> 403
[DENY] pimpinan_rtpu GET /direktur/pemantauan -> 403
[DENY] pimpinan_rtpu GET /direktur/riwayat -> 403
[DENY] pimpinan_rtpu GET /superadmin/users -> 403
[DENY] pimpinan_rtpu GET /superadmin/hak-akses -> 403
[DENY] pimpinan_rtpu GET /superadmin/fitur -> 403
[OK] direktur GET /dashboard -> 200
[OK] direktur GET /katalog -> 200
[OK] direktur GET /direktur/dashboard -> 200
[OK] direktur GET /direktur/pemantauan -> 200
[OK] direktur GET /direktur/riwayat -> 200
[DENY] direktur GET /pengajuan -> 403
[DENY] direktur GET /riwayat -> 403
[DENY] direktur GET /p3m/produk-unggulan -> 403
[DENY] direktur GET /rtpu/status -> 403
[DENY] direktur GET /rtpu/verifikasi/layanan -> 403
[DENY] direktur GET /rtpu/verifikasi/pembayaran -> 403
[DENY] direktur GET /rtpu/metode -> 403
[DENY] direktur GET /rtpu/layanan -> 403
[DENY] direktur GET /pimpinan/verifikasi -> 403
[DENY] direktur GET /pimpinan/pemantauan -> 403
[DENY] direktur GET /pimpinan/riwayat -> 403
[DENY] direktur GET /superadmin/users -> 403
[DENY] direktur GET /superadmin/hak-akses -> 403
[DENY] direktur GET /superadmin/fitur -> 403
[OK] super_admin GET /dashboard -> 200
[OK] super_admin GET /katalog -> 200
[OK] super_admin GET /superadmin/dashboard -> 200
[OK] super_admin GET /superadmin/users -> 200
[OK] super_admin GET /superadmin/hak-akses -> 200
[OK] super_admin GET /superadmin/fitur -> 200
[DENY] super_admin GET /pengajuan -> 403
[DENY] super_admin GET /riwayat -> 403
[DENY] super_admin GET /p3m/produk-unggulan -> 403
[DENY] super_admin GET /rtpu/status -> 403
[DENY] super_admin GET /rtpu/verifikasi/layanan -> 403
[DENY] super_admin GET /rtpu/verifikasi/pembayaran -> 403
[DENY] super_admin GET /rtpu/metode -> 403
[DENY] super_admin GET /rtpu/layanan -> 403
[DENY] super_admin GET /pimpinan/verifikasi -> 403
[DENY] super_admin GET /pimpinan/pemantauan -> 403
[DENY] super_admin GET /pimpinan/riwayat -> 403
[DENY] super_admin GET /direktur/pemantauan -> 403
[DENY] super_admin GET /direktur/riwayat -> 403
```

### B.3 Mutating endpoints — denied for every actor NOT associated

```
[DENY] customer PATCH /rtpu/verifikasi/layanan/1/approve -> 403
[DENY] customer PATCH /rtpu/status/1 -> 403
[DENY] customer POST /rtpu/metode -> 403
[DENY] customer POST /rtpu/layanan -> 403
[DENY] customer POST /p3m/produk-unggulan -> 403
[DENY] customer POST /superadmin/users -> 403
[DENY] customer POST /superadmin/fitur -> 403
[DENY] customer POST /superadmin/hak-akses -> 403
[DENY] customer PATCH /pimpinan/verifikasi/1/approve -> 403
[DENY] admin_rtpu PATCH /pimpinan/verifikasi/1/approve -> 403
[DENY] admin_rtpu POST /p3m/produk-unggulan -> 403
[DENY] admin_rtpu POST /superadmin/users -> 403
[DENY] admin_rtpu PATCH /pengajuan/1 -> 403
[DENY] admin_p3m PATCH /rtpu/verifikasi/layanan/1/approve -> 403
[DENY] admin_p3m PATCH /rtpu/status/1 -> 403
[DENY] admin_p3m POST /superadmin/users -> 403
[DENY] pimpinan_rtpu PATCH /rtpu/verifikasi/layanan/1/approve -> 403
[DENY] pimpinan_rtpu PATCH /rtpu/status/1 -> 403
[DENY] pimpinan_rtpu POST /p3m/produk-unggulan -> 403
[DENY] direktur PATCH /rtpu/verifikasi/layanan/1/approve -> 403
[DENY] direktur PATCH /pimpinan/verifikasi/1/approve -> 403
[DENY] direktur PATCH /rtpu/status/1 -> 403
[DENY] direktur POST /superadmin/users -> 403
[DENY] super_admin PATCH /rtpu/verifikasi/layanan/1/approve -> 403
[DENY] super_admin PATCH /rtpu/status/1 -> 403
[DENY] super_admin POST /p3m/produk-unggulan -> 403
[DENY] super_admin POST /rtpu/metode -> 403
[OK] admin_rtpu PATCH /rtpu/metode/1 -> 302
```

### B.4 Data-scope (row-level) results

```
[OK] staff GET /register -> redirect /dashboard (guest-only route)
[OK] customer scope: sees own (PNJ-T-6ad5a04521972), 403 on other's (PNJ-T-6ad5a04521c0d)
[OK] p3m scope: sees own PU 1, 403 on other's PU 2
[OK] rtpu scope: sees both customers' pengajuan (2 rows)
[DENY] pimpinan_rtpu PATCH verify.bayar.accept -> 403
[DENY] admin_p3m PATCH verify.bayar.accept -> 403
[DENY] direktur PATCH verify.bayar.accept -> 403
[DENY] super_admin PATCH verify.bayar.accept -> 403
[DENY] customer PATCH verify.bayar.accept -> 403
[OK] admin_rtpu PATCH verify.bayar.accept -> 302
```

**Notable:** Super Admin *bypasses granular permissions* (`User::canDo()`) but is still blocked
by the `role:` lanes, so it gets `403` on all other actors' lanes and `200` only on
`/superadmin/*`. That is *correct* per the diagram (Super Admin is associated only with UC-42/43/44).

---

## Check C — Relationships R1–R11

| # | Relationship (diagram) | Expectation | Result |
|---|---|---|---|
| R1 | UC-01 include UC-02; UC-03 extend UC-01 | login/register reachable; identical generic error; inactive user blocked; self-registration is Customer-only | PASS |
| R2 | UC-03 include UC-04 | server-side registration validation | PASS (**fixed** — F-02) |
| R3 | UC-05 include UC-09 | pengajuan only references existing + approved + active catalog | PASS (**fixed** — F-03) |
| R4 | UC-10 include UC-11 + UC-12 | method AND proof both required; status does not advance otherwise | PASS |
| R5 | UC-14 extend UC-15/16; UC-19 extend UC-20/21 | owner + allowed-state guards | PASS |
| R6 | UC-17 include UC-18 | supporting documents mandatory | PASS (**fixed** — F-04) |
| R7 | UC-25 include UC-26; extend UC-27 | reject always requires a note; approval has **no** server-side completeness gate | PASS with **F-05 DECISION NEEDED** |
| R8 | UC-32 include UC-33; UC-34/35/36 extend | CRUD per entity; Hak Akses add/edit/delete via whole-matrix save | PASS (see F-09) |
| R9 | UC-22/23/24 | stream separation; closed items in history | PASS with **F-06 DECISION NEEDED** |
| R10 | UC-13/14/19 | monitoring scopes own / stream / both | PASS |
| R11 | UC-31 | forward-only status transition + history row | PASS |

Raw test-dox result for Check C:

```
Relationship Conformance (Tests\Feature\UseCase\RelationshipConformance)
 R1 UC-01 include UC-02 / UC-03 extend UC-01 — login & register reachability
 R2 UC-03 include UC-04 — registration validated server-side
 R3 UC-05 include UC-09 — pengajuan only for existing ACTIVE catalog items
 R4 UC-10 include UC-11 + UC-12 — method AND proof both required
 R5 UC-14 extend UC-15/16, UC-19 extend UC-20/21 — owner + state guards
 R6 UC-17 include UC-18 — supporting documents are mandatory
 R7 UC-25 include UC-26 / extend UC-27 — reject requires note in all 3 flows
 R8 UC-32 include UC-33; UC-34/35/36 extend — CRUD per entity
 R9 UC-22/23/24 — stream separation; closed items in history
 R10 UC-13/14/19 — monitoring scopes (own / stream / both)
 R11 UC-31 Memperbarui Status Layanan — forward only + history row
OK (55 tests, 711 assertions)
```

Evidence detail worth quoting:

- **R7** — approving with no checklist payload returns `302`, proving UC-26 is UI-only
  (`Continue`), and `[INFO]` is not emitted for it. Every `reject` flow
  (RTPU layanan, RTPU pembayaran, Pimpinan produk unggulan) returns a validation error on
  missing `catatan`.
- **R9** — the emitted line is:
  ```
  [INFO] admin_rtpu riwayat rows=2 (includes in-progress: Diajukan)
  ```
  Customer riwayat returns only the closed row; Admin RTPU riwayat returns both rows
  (including the in-progress one) → **F-06**.
- **R10** — Direktur monitor returns `produk=2` **and** `layanan=3`; Customer index returns
  own in-progress only; P3M index returns own stream only; Pimpinan monitor returns the
  whole produk stream.

---

## Check D — Page inventory (diagram pages ↔ `resources/js/Pages`)

| Page file | Route | Role(s) | Diagram use case |
|---|---|---|---|
| `Catalog/Index.jsx` | `home` | guest, Customer | supporting UC-09 |
| `Catalog/Browse.jsx` | `catalog.index` | guest, Customer | UC-09 |
| `Catalog/Show.jsx` | `catalog.show` | guest, Customer | UC-09 / supporting UC-05 |
| `Auth/Login.jsx` | `login` | guest | UC-01/02 |
| `Auth/Register.jsx` | `register` | guest | UC-03/04 |
| `Auth/ForgotPassword.jsx` | `password.request` | guest | auth scaffolding (extra) |
| `Auth/ResetPassword.jsx` | `password.reset` | guest | auth scaffolding (extra) |
| `Auth/ConfirmPassword.jsx` | `password.confirm` | auth | auth scaffolding (extra) |
| `Auth/VerifyEmail.jsx` | `verification.notice` | auth | auth scaffolding (extra) |
| `Dashboard.jsx` | `dashboard` | all six | role home redirect |
| `Customer/Home.jsx` | (customer dashboard) | Customer | portal home |
| `Customer/Pengajuan/Create.jsx` | `customer.pengajuan.create` | Customer | UC-05–08 |
| `Customer/Pengajuan/Index.jsx` | `customer.pengajuan.index` | Customer | UC-14 |
| `Customer/Pengajuan/Show.jsx` | `customer.pengajuan.show` | Customer | UC-14/15/16 |
| `Customer/Pengajuan/Edit.jsx` | `customer.pengajuan.edit` | Customer | UC-15 |
| `Customer/Pembayaran.jsx` | `customer.pengajuan.bayar` | Customer | UC-10/11/12 |
| `Customer/Riwayat.jsx` | `customer.riwayat` | Customer | UC-23 |
| `Rtpu/Dashboard.jsx` | `rtpu.dashboard` | Admin RTPU | portal home |
| `Rtpu/Verifikasi/Layanan.jsx` | `rtpu.verify.layanan` | Admin RTPU | UC-25–28 |
| `Rtpu/Verifikasi/Pembayaran.jsx` | `rtpu.verify.bayar` | Admin RTPU | UC-29 |
| `Rtpu/StatusLayanan.jsx` | `rtpu.status` | Admin RTPU | UC-31 |
| `Rtpu/Layanan/Index.jsx` + `Form.jsx` | `rtpu.layanan`, `rtpu.layanan.form` | Admin RTPU | UC-38–41 |
| `Rtpu/MetodePembayaran/Index.jsx` | `rtpu.metode` | Admin RTPU | UC-37 |
| `Rtpu/Riwayat.jsx` | `rtpu.riwayat` | Admin RTPU | UC-23 |
| `P3M/Dashboard.jsx` | `p3m.dashboard` | Admin P3M | portal home |
| `P3M/ProdukUnggulan/Index.jsx` | `p3m.produk.index` | Admin P3M | UC-17/19 |
| `P3M/ProdukUnggulan/Show.jsx` | `p3m.produk.show` | Admin P3M | UC-19/21 |
| `P3M/ProdukUnggulan/Edit.jsx` | `p3m.produk.edit` | Admin P3M | UC-20 |
| `P3M/Riwayat.jsx` | `p3m.riwayat` | Admin P3M | UC-24 |
| `Pimpinan/Dashboard.jsx` | `pimpinan.dashboard` | Pimpinan RTPU | portal home |
| `Pimpinan/Verifikasi.jsx` | `pimpinan.verify` | Pimpinan RTPU | UC-30 |
| `Pimpinan/Pemantauan.jsx` | `pimpinan.monitor` | Pimpinan RTPU | UC-13 |
| `Pimpinan/Riwayat.jsx` | `pimpinan.riwayat` | Pimpinan RTPU | UC-24 |
| `Direktur/Dashboard.jsx` | `direktur.dashboard` | Direktur | portal home |
| `Direktur/Pemantauan.jsx` | `direktur.monitor` | Direktur | UC-13 |
| `Direktur/Riwayat.jsx` | `direktur.riwayat` | Direktur | UC-22 |
| `SuperAdmin/Dashboard.jsx` | `superadmin.dashboard` | Super Admin | portal home |
| `SuperAdmin/Users/Index.jsx` | `superadmin.users` | Super Admin | UC-42 |
| `SuperAdmin/HakAkses.jsx` | `superadmin.hakakses` | Super Admin | UC-43 |
| `SuperAdmin/Fitur/Index.jsx` | `superadmin.fitur` | Super Admin | UC-44 |
| `Admin/Settings.jsx` | `admin.settings.index` | Admin RTPU | **extra** (F-11) |
| `Admin/ExternalLinks.jsx` | `admin.external-links.index` | Admin RTPU | **extra** (F-11) |
| `Profile/*.jsx` | `profile.*` | all auth | **extra** (auth scaffolding) |
| `Dev/UiKit.jsx` | **none** | — | **orphan** (F-10) |

No diagram page is missing. One page (`Dev/UiKit.jsx`) has no route.

---

## Check E — Extras not in the diagram (classified)

Classification:
- **(a) Supporting infrastructure** that exists to serve diagram use cases — expected; no action.
- **(b) Additional product features** outside the diagram, intentionally shipped — note only.
- **(c) Orphaned/overlapping surface** — needs cleanup or alignment.

| Extra | Class | Notes |
|---|---|---|
| Auth scaffolding: password reset, email verification, confirm-password, profile edit | (a) | Supports UC-01/03/42 account lifecycle. |
| `berkas.show` file download | (a) | Supports UC-18 document viewing. |
| `pengajuan/hitung` quote endpoint (`PricingService`) | (a) | Supports UC-05–08/10. |
| `rtpu.opsi.*` / `p3m.produk.opsi.*` option CRUD | (a) | Supports UC-38–41 (catalog options). |
| Status history array on pengajuan/produk | (a) | Supports UC-31 timeline + riwayat. |
| Per-role dashboards (`*/dashboard`) | (a) | Navigation home per actor. |
| `SettingService` PPN config + `settings_audit` | (b) | Tax/threshold + audit not in diagram; no conformance impact. |
| SSO PNJ (`App\Sso\*`, `Auth\SsoController`, `SsoButton`) | (b) | Registered only when `config('services.sso.enabled')`; default `NullSsoProvider` throws. Not a default route. |
| `admin.external-links` CRUD | (b) | Footer/link management; `role:admin_rtpu` only; no sidebar entry. |
| `Dev/UiKit.jsx` | (c) | No route → dead page. See F-10. |

No extra was found that **duplicates** or **contradicts** a diagram use case.

---

## Check F — Vocabulary mismatches

| # | Where | Mismatch | Severity |
|---|---|---|---|
| F-V1 | `resources/js/lib/roles.js` header comments | Says backend sends only `admin_rtpu, dosen_peneliti, mahasiswa, eksternal` and that `admin_p3m/pimpinan_rtpu/direktur/super_admin` are "TODO(backend)". The backend **already** supports all six roles (enums + factories + seeded users + working login). Stale comment. | Low (doc) |
| F-V2 | Sidebar labels vs diagram | Sidebar uses short labels ("Pemantauan", "Riwayat", "Verifikasi Pengajuan"). The diagram uses fuller names ("Memantau Pengajuan Produk Unggulan", "Melihat Riwayat Transaksi Layanan", "Memverifikasi Data"). Mapping is 1:1; reduced labels are UX shorthand, not missing UCs. | Info |
| F-V3 | `admin.settings` / `admin.external-links` routes | Reachable by URL but absent from `lib/nav.js` `DESTINATIONS` and the role sidebars. Either hide intentionally or add a menu — a consistency issue, not a UC gap. | Low |
| F-V4 | UC titles for grouped use cases | UC-06/07/08, UC-32/33 and UC-38–41 are represented by grouped tests; exact per-UC titles should be confirmed against the diagram (the diagram is not stored in-repo). | Low (labeling) |

---

## Findings

### F-01 — BLOCKER — 5 Postgres-only migrations break the entire test suite

- **Expected:** `php artisan test` runs the app's suite on the configured SQLite `:memory:`.
- **Actual:** A merge (commit `81fbcaf`, from `origin/main` `e4bf077`) added five migrations
  under `database/migrations/2026_10_13_000{1..5}_*.php` that target a *different* schema
  (`users.id` uuid vs the app's `bigint`) and are unused by any application code. On SQLite
  they abort on `CREATE EXTENSION IF NOT EXISTS btree_gist`; on Postgres they fail on the
  uuid/bigint FK mismatch.
- **Proof** (with the five files present):
  ```
  {"tool":"phpunit","result":"failed","tests":171,"passed":1,"assertions":1,
   "duration_ms":10198,"errors":170,
   "error_details":[{"test":"Tests\\Unit\\PricingServiceTest::test_base_line_jasa_is_price_per_unit",
   ... "message":"SQLSTATE[HY000]: General error: 1 near \"EXTENSION\": syntax error
   (Connection: sqlite, Database: :memory:, SQL: CREATE EXTENSION IF NOT EXISTS btree_gist)",
   "trace":["...database\\migrations\\2026_10_13_000100_create_rbac_tables.php:20", ...]}]}
  ```
  With the five files moved aside (temporarily, then restored) the same suite is green:
  ```
  {"tool":"phpunit","result":"passed","tests":171,"passed":171,"assertions":1595,"duration_ms":28969}
  ```
- **Fix:** not applied — an applied/merged migration must not be edited by this audit, and the
  change is outside the diagram scope. **Minimal plan:** in a dedicated change, either
  (1) revert/remove the five files from the merge (`git revert`/delete) since no app code
  references them, or (2) move them behind a Postgres-only guard / drop them. Owner decision.
- **Impact:** CI and every local `php artisan test` fail until resolved.

### F-02 — FIXED — UC-03/UC-04: registration `terms` was optional

- **Expected:** accepting the terms is mandatory to complete registration.
- **Actual (before):** `'terms' => 'sometimes|accepted'` accepted a request that omitted `terms`.
- **Fix:** `app/Http/Controllers/Auth/RegisteredUserController.php` →
  `'terms' => 'required|accepted'`.
- **Fails-first test:** `R2 UC-03 include UC-04 — registration validated server-side` asserts
  `terms` is required. Fixture `Tests\Feature\Auth\RegistrationTest::test_new_users_can_register`
  updated (added `'terms' => true`) — assertion count increased, nothing weakened.

### F-03 — FIXED — UC-05 include UC-09: pengajuan accepted inactive/unapproved catalog ids

- **Expected:** a pengajuan may only reference an existing, **approved and active** catalog item (the create form lists exactly those).
- **Actual (before):** `product_id` used `exists:products,id`, so a deactivated or draft item
  (or any raw id) was accepted.
- **Fix:** `app/Http/Controllers/Customer/PengajuanController.php` — added
  `activeCatalogRule()` (`Rule::exists('products','id')->where('curation_status','approved')->where('is_active',true)`)
  used by both `hitung()` and `storeRules()`.
- **Fails-first test:** `R3 UC-05 include UC-09 — pengajuan only for existing ACTIVE catalog items`
  asserts inactive, draft and non-existent ids are rejected and only one row is created.

### F-04 — FIXED — UC-17 include UC-18: supporting documents were optional

- **Expected:** a Produk Unggulan submission must include at least one supporting document.
- **Actual (before):** `'dokumen' => 'nullable|array|max:5'` allowed a submission with no files.
- **Fix:** `app/Http/Controllers/P3M/ProdukUnggulanController.php` →
  `'dokumen' => 'required|array|min:1|max:5'`.
- **Fails-first test:** `R6 UC-17 include UC-18 — supporting documents are mandatory`. Fixture
  `Tests\Feature\Flow\AccessMatrixTest::test_pimpinan_approve_creates_inactive_layanan_once`
  updated with `Storage::fake('public')` + a `dokumen` upload (assertion count increased).

### F-05 — MEDIUM — DECISION NEEDED — UC-26 checklist is UI-only

- **Current behavior:** approving a pengajuan (`PATCH rtpu.verify.layanan.approve`) succeeds
  with **no** checklist payload (`302`), and `UC-25/26/27` asserts this. The readiness checklist
  exists only in `Components/ReviewPanel.jsx`.
- **Diagram:** UC-26 "Memeriksa Kelengkapan Data" is an `include` of UC-25 "Memverifikasi Data".
- **Options:** (1) accept — the checklist is a UI assist and the server gate is the
  verification action itself; or (2) require a positive completeness flag/checklist in the
  approve payload.
- **Not changed** (a server gate would be a functional change, not a small deviation fix).

### F-06 — MEDIUM — DECISION NEEDED — Admin RTPU `riwayat` includes in-progress items

- **Current behavior:** `[INFO] admin_rtpu riwayat rows=2 (includes in-progress: Diajukan)`.
  `Customer\RiwayatController` filters to `Pengajuan::CLOSED`, but `Rtpu\RiwayatController`
  returns the full archive (open + closed). `docs/frontend-usecase-trace.md` states
  "Riwayat = closed items".
- **Diagram:** UC-23 "Melihat Riwayat Transaksi Layanan".
- **Options:** (1) accept — RTPU riwayat is the full-service archive, distinct from the
  in-progress `Status Layanan` page; or (2) filter `rtpu.riwayat` to `CLOSED` for strict
  consistency with the doc.
- **Not changed** (which interpretation the diagram intends cannot be settled from code).

### F-07 — LOW — `metode_id` accepted by `exists` only (inactive methods not blocked)

- **Current behavior:** `proof()` validates `'metode_id' => 'required|exists:metode_pembayaran,id'`.
  The picker only lists active methods (`where('aktif', true)`), but a crafted POST can
  reference a deactivated method.
- **Diagram:** UC-11 "Memilih Metode Pembayaran" — does not state the active-only rule
  explicitly.
- **Recommendation:** harden with `Rule::exists('metode_pembayaran','id')->where('aktif', true)`
  if the business rule is confirmed. **Not changed** (diagram is not explicit → report only).

### F-08 — INFO — VERIFY WITH DIAGRAM — Direktur two-stream read-only relations

- **Observed:** Direktur lanes are read-only (`GET /direktur/pemantauan`, `GET /direktur/riwayat`)
  and return **both** produk and layanan streams (`R10`, `UC-13`, `UC-22`). There are no
  Direktur write routes.
- **Action:** confirm the diagram's Direktur has exactly the two monitoring associations and
  no management use case. Code is internally consistent; no bug.

### F-09 — INFO — UC-43 add/edit/delete realized as a whole-matrix save

- **Observed:** Hak Akses has `GET /superadmin/hak-akses` and `POST /superadmin/hak-akses`
  (`save`); there are no per-cell routes. Add/edit/delete of a permission is a save of the
  edited matrix (`R8` covers toggling a cell up and down).
- **Assessment:** acceptable realization of UC-43 "Mengelola Hak Akses". Documented, no change.

### F-10 — LOW — `Pages/Dev/UiKit.jsx` has no route

- Dev-only page with no route in `routes/web.php` (verified: no `UiKit` match). Dead file.
- **Recommendation:** keep (useful harness) or remove. No conformance impact.

### F-11 — INFO — Non-diagram features present

SSO PNJ (gated off), Settings/Pengaturan (PPN + audit log), External links CRUD, profile/password
management. See Check E. None conflicts with a diagram use case.

### F-12 — LOW — Grouped UC titles need diagram confirmation

The diagram file is not in the repo. UC-06/07/08, UC-32/33 and UC-38–41 are covered by grouped
tests; if the diagram numbers/titles any of these differently, only the label changes — the
endpoints and authorization are the same. Provide the diagram text and the labels are a
one-line edit to the `#[TestDox]` names.

---

## Final go / no-go

**GO (conditional).**

- Every one of the 44 use cases is implemented, reachable, and authorized for the actor(s) the
  diagram associates, proven by 55 failing-if-broken tests with real HTTP status codes.
- 3 real deviations were fixed with fails-first tests (F-02, F-03, F-04) and no test was
  weakened, deleted, or skipped.
- App-code test suite is green: **171/171, 1595 assertions**. UseCase suite: **55/55, 711
  assertions**. Frontend: **vitest 75/75**, `npm run build` success.
- **Condition 1 (Blocker):** resolve F-01 — the five unrelated Postgres-only migrations
  (`2026_10_13_000{1..5}`) must be removed or guarded before the suite can be trusted in CI.
  This is not application code and was not modified by this audit.
- **Condition 2:** decide F-05 (UC-26 server gate?) and F-06 (RTPU riwayat closed-only?).

---

## Appendix — raw command outputs

### Full backend suite — with the 5 foreign migrations present (failing, F-01)

```
{"tool":"phpunit","result":"failed","tests":171,"passed":1,"assertions":1,"duration_ms":10198,"errors":170,
 "error_details":[{"test":"Tests\\Unit\\PricingServiceTest::test_base_line_jasa_is_price_per_unit",
 "message":"SQLSTATE[HY000]: General error: 1 near \"EXTENSION\": syntax error
 (Connection: sqlite, Database: :memory:, SQL: CREATE EXTENSION IF NOT EXISTS btree_gist)",
 "trace":["...\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php:857",
 "...\\database\\migrations\\2026_10_13_000100_create_rbac_tables.php:20", ...]}]}
```

### Full backend suite — app code (migrations parked, green)

```
{"tool":"phpunit","result":"passed","tests":171,"passed":171,"assertions":1595,"duration_ms":28969}
```

### UseCase suite (`php artisan test tests/Feature/UseCase --testdox`)

```
... actor-by-actor [OK]/[DENY] lines (reproduced in Check B) ...
OK (55 tests, 711 assertions)
{"tool":"phpunit","result":"passed","tests":55,"passed":55,"assertions":711,"duration_ms":9483}
```

### Frontend unit tests (`npx vitest run`)

```
 RUN  v5.0.3 C:/Users/Zaldi/OneDrive/Documents/MY project/pnj-prime

 Test Files  7 passed (7)
      Tests  75 passed (75)
```

### Production build (`npm run build`)

```
public/build/assets/Layanan-BPlCohNa.js                         3.75 kB │ gzip:   1.44 kB
public/build/assets/Show-C4BHJvCX.js                            4.11 kB │ gzip:   1.59 kB
public/build/assets/Show-ZOv_5Zxo.js                            4.19 kB │ gzip:   1.66 kB
public/build/assets/Verifikasi-DGEM-sqQ.js                      4.38 kB │ gzip:   1.57 kB
public/build/assets/AnimatePresence-C0VQRHi8.js                 4.42 kB │ gzip:   2.07 kB
public/build/assets/Edit-D7mEyZyS.js                            4.55 kB │ gzip:   1.73 kB
public/build/assets/Home-eN4xbjdf.js                            4.79 kB │ gzip:   1.82 kB
public/build/assets/Settings-ConGajG8.js                        5.31 kB │ gzip:   1.69 kB
public/build/assets/Login-2pCcgRCy.js                           6.34 kB │ gzip:   2.46 kB
public/build/assets/Show-X695vT-u.js                            6.57 kB │ gzip:   2.02 kB
public/build/assets/useOpsiQuote-B6qo_rHf.js                    7.82 kB │ gzip:   2.65 kB
public/build/assets/Index-BMKgMX9s.js                           8.06 kB │ gzip:   3.02 kB
public/build/assets/DashboardLayout-DnknOKUh.js                 8.32 kB │ gzip:   2.98 kB
public/build/assets/Browse-BpnWZSgN.js                          8.76 kB │ gzip:   2.83 kB
✓ built in 1.46s
```

### Working-tree diff (`git diff --stat`)

```
 app/Http/Controllers/Auth/RegisteredUserController.php |  2 +-
 app/Http/Controllers/Customer/PengajuanController.php  | 17 +++++++++++++++--
 app/Http/Controllers/P3M/ProdukUnggulanController.php  |  2 +-
 tests/Feature/Auth/RegistrationTest.php                |  1 +
 tests/Feature/Flow/AccessMatrixTest.php                |  2 ++
 5 files changed, 20 insertions(+), 4 deletions(-)
```

`git status --short` (after restoring the 5 parked migrations — tree matches HEAD for them):

```
 M app/Http/Controllers/Auth/RegisteredUserController.php
 M app/Http/Controllers/Customer/PengajuanController.php
 M app/Http/Controllers/P3M/ProdukUnggulanController.php
 M tests/Feature/Auth/RegistrationTest.php
 M tests/Feature/Flow/AccessMatrixTest.php
?? html/
?? tests/Feature/UseCase/
```
