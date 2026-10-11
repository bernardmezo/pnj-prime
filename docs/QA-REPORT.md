# PNJ PRIME — QA Report

QA lead pass. Method: route inventory → automated tests (PHPUnit 57, Vitest 19)
→ targeted fixes with failing-first tests → rebuild. Nothing below is claimed
without pasted command output (see Implementation Evidence).

## 1. Route matrix (method + URI → controller@action → component → protection)

Public (no auth): `GET /` (Catalog@index → Catalog/Index), `GET /katalog`
(Catalog@browse → Catalog/Browse), `GET /catalog/{slug}` (Catalog@show →
Catalog/Show), auth/login/register/password/verification routes (Breeze).

Authenticated (`auth` + `verified` group):
| Method + URI | Action → Component | Gate |
|---|---|---|
| GET /dashboard | closure → Dashboard (thin JS redirect to role home) | auth |
| GET /berkas/{kind}/{id}/{index} | File@show (download) | auth + owner/role check inside |
| pengajuan* (9 routes) | Customer\PengajuanController → Customer/* | role:customer + permission:pengajuan\|pembayaran,* |
| GET /riwayat | Customer\RiwayatController → Customer/Riwayat | role:customer + permission |
| p3m/produk-unggulan* (7) + p3m/riwayat | P3M\ProdukUnggulanController → P3M/* | role:admin_p3m + permission:produk-unggulan,* |
| rtpu/verifikasi/*, /status*, /layanan*, /metode*, /riwayat | Rtpu\* → Rtpu/* | role:admin_rtpu + permission:* |
| pimpinan/verifikasi*, /pemantauan, /riwayat | Pimpinan\VerifikasiController → Pimpinan/* | role:pimpinan_rtpu + permission |
| direktur/pemantauan, /riwayat | Direktur\PemantauanController → Direktur/* | role:direktur + permission |
| superadmin/users*, /hak-akses*, /fitur* | SuperAdmin\* → SuperAdmin/* | role:super_admin (permissions managed here; super_admin bypasses) |
| Legacy kept (TODO-marked): products.*, transactions.*, reports, profile.*, admin.* | old controllers → old pages | unchanged from before |

**Flagged (no missing protection):** every new mutating route carries
`role:` + `permission:` middleware; every new GET carries both as well.
`GET /berkas/*` relies on in-controller authorization (verified by tests:
owner/pimpinan/direktur 200, stranger/other-P3M 403).

## 2. Page inventory
`find resources/js/Pages -name '*.jsx'` returns exactly: the 31 §3 pages +
`Dashboard.jsx` (redirect) + 16 kept-but-TODO-marked legacy files
(Admin/×2, Auth/{Forgot,Reset,Confirm,Verify}, Curation/Index,
Products/{Index,Create}, Profile/Edit+3 partials, Reports/×2,
Transactions/{Index,Checkout,Show}, UserManagement/Index). No other files.
Every `Inertia::render('X')` in app/ resolves to an existing file
(all previously-missing Show/Edit components now exist via the new pages;
the still-missing `Products/Show`, `Products/Edit`, `UserManagement/Create`,
`UserManagement/Edit` are pre-existing gaps listed in BACKEND CLEANUP).

## 3. Scenarios S1–S13 (all in tests/Feature/Flow/, all passing)
- S1: register validation (required/email/unique/min/confirmed/terms),
  field persistence incl. user_type/nik_npwp, forced customer role, wrong-credential
  error, inactive login blocked, per-role dashboard landing.
- S2: catalog shows only approved+active; tipe filter; deactivated/draft
  items 404 on direct URL.
- S3: create for all 3 tipes + invalid cases; Ubah/Batal state guards; IDOR
  across two customers (show/update/cancel → 403).
- S4: approve advances + creates order; reject without note → 422, no state
  change; note visible to customer; resubmit works; 4 wrong roles → 403.
- S5: checkout totals equal order totals (printed figure in output); single
  Mandiri method; proof mime/size/ownership/timing guards; re-upload after
  rejection works.
- S6: reject-note required; accept advances; double verify/reject → 403.
- S7: only NEXT_STATUS transitions; history rows carry from→to/note/by/when;
  edits after close blocked.
- S8: cancel guards; history entry; closed-only in Riwayat, absent from Pemantauan.
- S9: docs valid/invalid; pimpinan approve/reject+note; cross-role verify
  denied; downloads scoped (owner/pimpinan/direktur 200, other-P3M 403).
  **Disetujui publishes NOTHING to the catalog (DECISION NEEDED).**
- S10: direktur denied on 12 mutating routes; monitor/riwayat load with data.
- S11: 5 staff created, all log in, land on dashboard; deactivation blocks
  login; self delete/demote blocked (last-admin invariant holds via actor).
- S12: layanan CRUD validation per tipe; delete-with-pengajuan soft-handled
  (soft delete, reference kept, hidden from catalog); last-active-method
  delete/deactivate blocked with errors.
- S13: open-vs-closed split asserted per role lane.

## 4. PPN evidence
- Computation: `SettingService::calculateTax` (ppn_enabled + ppn_rate, round
  half-up, integer math). No threshold setting exists (DECISION NEEDED).
- Test printed: `PPN 11% atas 2000000: ppn=220000 total=2220000`.
- Rate 11→12 via service: old order stays 2220000, new order taxed 12%.
- Money columns are bigint/integer (asserted for orders/products).
- Settings screen = kept `Admin/Settings` (`admin.settings.index`,
  role:admin_rtpu); changes are NOT audit-logged (finding QA-08, Minor).
- No "Pengaturan" sidebar item added, per spec.

## 5. Security checklist
- Mutating routes: all carry role+permission middleware (matrix §1).
- Mass assignment: store/update use validated subsets only; status/total/
  buyer set server-side; role whitelisted to six; HakAkses keys validated
  against fitur table + known aksi (QA-03).
- IDOR: ownership checks on pengajuan/produk-unggulan/bukti + file downloads
  (tested, QA-02 scope fix).
- Uploads: mime whitelist + 5 MB cap, hashed filenames via store(), served
  only through authorized `berkas.show` (QA-02); traversal impossible (path
  derived server-side).
- Passwords hashed; login throttled (5 attempts, Breeze LoginRequest);
  inactive accounts blocked at login (QA fix); CSRF via web group.
- Demo seeds env-guarded to local/testing (QA fix); register forces customer.
- Inertia shared props: only `auth.user` (password/ktp/npwp hidden by model).

## 6. Findings
| ID | Sev | Expected | Happened | Proof | Fix |
|---|---|---|---|---|---|
| QA-01 | Major | Registration validates + persists extra fields | terms/user_type/nik_npwp silently dropped | test_register_* failing before fix | migration users.user_type/nik_npwp + `sometimes\|accepted` + persist; tests/Feature/Flow/UsecaseFlowTest.php |
| QA-02 | Major | Uploaded docs/proofs downloadable only by entitled roles | Public via /storage symlink, no auth | manual URL reasoning + test | FileController + berkas.show route + download links; tests assert 200/403 |
| QA-03 | Major | HakAkses rejects unknown role/fitur/aksi | Arbitrary rows insertable | test (added unknown-key case during dev) | key validation in HakAksesController@save |
| QA-04 | Major | Cannot leave zero active payment methods | Last method deletable/deactivatable | test failing before fix | guards in MetodeController@update/destroy + error display |
| QA-05 | Major | Permission changes take effect immediately | Static cache survived the request (stale allow) | test_permission_toggle failing before fix | User::flushPermissionCache() on save |
| QA-06 | Major | Deleting a layanan with pengajuan is blocked/soft-handled | Ambiguous | test | Verified soft-handled (soft delete, audit ref kept, hidden from catalog); documented |
| QA-07 | Major | Non-owner P3M blocked from others' docs | FileController allowed any admin_p3m | test failing before fix | Scope narrowed to owner/pimpinan/direktur/super_admin |
| QA-08 | Minor | Settings changes logged | No audit trail | code inspection (SettingController) | Decision needed (no fix applied) |
| QA-09 | Minor | Whole repo pint-clean | Pre-existing violations across untouched files | `pint --test` output | Scoped pint to touched files only; pre-existing left alone |

## 7. DECISION NEEDED
1. **Disetujui publishes nothing.** Pimpinan approval sets status only; no
   catalog product is created. Options: (a) keep manual (RTPU re-enters as
   layanan), (b) auto-create product draft on approval. Current: (a) by code.
2. **No PPN threshold setting exists** (only enabled flag + rate). Options:
   (a) flag IS the threshold (current), (b) add `ppn_threshold` minimum-amount
   key + apply rule. Current: (a).
3. **Settings audit trail.** Options: (a) none (current), (b) activity log
   table. Current: (a).
4. **Fitur deactivation does not gate routes** (flag only; test documents
   current behavior). Options: (a) display-only (current), (b) middleware
   checks fitur.aktif. Current: (a).
5. **Legacy deletions** (Reports/Profile/Settings/old Products/Curation/
   Transactions/password pages + already-missing Show/Edit components):
   all unlinked with TODO markers; deletion needs backend confirmation.

## 8. Proof outputs
- `php artisan test`: 58/58 pass (445 assertions) — pasted in session log.
- `vendor/bin/pint --test` on touched paths: clean after scoped `pint` run;
  repo-wide pint was already red before this pass (pre-existing, untouched).
- `npm run build`: green. `vitest run`: 19/19 green.
- `git diff --stat`: backend + frontend as listed; no tests/ edits except new
  Flow files + RefreshDatabase enable on ExampleTest (documented below).

Note: `tests/Feature/ExampleTest.php` gained only the standard
`RefreshDatabase` trait (it hit an empty :memory: DB); assertions unchanged.

---

# Round 2 — Reconciliation, Decisions & Re-verification

Round 1 above is preserved verbatim. This round (a) reconciles what Round 1
reported, (b) applies the five mandated decisions D1–D5, (c) adds the SSO
scaffold, and (d) re-runs every check. Nothing here is claimed without pasted
command output.

## R2 §1 — No-behaviour-change clarifications

### 1a. QA-06 (delete layanan with pengajuan) and the "4 fixes" vs six

- **QA-06 status/severity:** unchanged from Round 1 — **Major**, status
  **reconciled/documented, not code-fixed** (see Finding QA-06 on line 104).
  Behaviour verified as correct-by-design: deleting a `layanan` that already
  has `pengajuan` is soft-handled (soft delete, audit reference retained,
  hidden from the public catalog). No code change was made and none is claimed.
- **"4 fixes" vs six:** Round 1's prose undercounted. The findings table
  lists **9 findings (QA-01…QA-09)**. At the end of Round 1, **6 were
  code-fixed** (QA-01, QA-02, QA-03, QA-04, QA-05, QA-07), **1 was
  reconciled/documented with no fix** (QA-06), **1 was left for a decision**
  (QA-08 — settings audit; now implemented in Round 2 as D3), and **1 is an
  environment/style finding scoped out** (QA-09, repo-wide pint on pre-existing
  untouched files). The "4 fixes" wording was a counting error in Round 1
  prose; the table is authoritative.

### 1b. Page-by-page smoke coverage + shared components

Round 1 shipped 19 vitest tests. Round 2 adds
`resources/js/__tests__/pages2.test.jsx` (18 page tests) and a direct
`ConfirmModal` + `SsoButton` test, for **3 files / 39 tests**. Every page
component rendered by a controller is now exercised with controller-shaped
props:

| # | Page component | Test that renders it |
|---|---|---|
| 1 | Dashboard.jsx | pages2 · "Dashboard renders nothing (thin redirect)" |
| 2 | Catalog/Index.jsx | pages2 · "Catalog/Index landing renders hero + preview + about" |
| 3 | Catalog/Browse.jsx | pages · "Catalog/Browse renders header + filters" |
| 4 | Catalog/Show.jsx | pages2 · "Catalog/Show renders product + ajukan action" |
| 5 | Customer/Home.jsx | pages2 · "Customer/Home renders greeting + grid + CTA" |
| 6 | Customer/Pengajuan/Index.jsx | pages · "Customer/Pengajuan/Index shows heading + rows" |
| 7 | Customer/Pengajuan/Create.jsx | pages2 · "Customer/Pengajuan/Create renders wizard steps" |
| 8 | Customer/Pengajuan/Show.jsx | pages · "Customer/Pengajuan/Show shows timeline + actions" |
| 9 | Customer/Pengajuan/Edit.jsx | pages2 · "Customer/Pengajuan/Edit renders prefilled form" |
| 10 | Customer/Pembayaran.jsx | pages · "Customer/Pembayaran shows bill + methods" |
| 11 | Customer/Riwayat.jsx | pages · "Customer/Riwayat shows closed items" |
| 12 | Rtpu/Verifikasi/Layanan.jsx | pages · "Rtpu/Verifikasi/Layanan shows queue + review panel" |
| 13 | Rtpu/Verifikasi/Pembayaran.jsx | pages2 · "Rtpu/Verifikasi/Pembayaran renders queue + panel" |
| 14 | Rtpu/StatusLayanan.jsx | pages · "Rtpu/StatusLayanan shows list + stepper area" |
| 15 | Rtpu/Layanan/Index.jsx | pages2 · "Rtpu/Layanan/Index renders tabs + table" |
| 16 | Rtpu/Layanan/Form.jsx | pages2 · "Rtpu/Layanan/Form renders type fields" |
| 17 | Rtpu/MetodePembayaran/Index.jsx | pages2 · "Rtpu/MetodePembayaran/Index renders methods" |
| 18 | Rtpu/Riwayat.jsx | pages2 · "Rtpu/Riwayat renders table" |
| 19 | P3M/ProdukUnggulan/Index.jsx | pages · "P3M index + show render" |
| 20 | P3M/ProdukUnggulan/Show.jsx | pages · "P3M index + show render" |
| 21 | P3M/ProdukUnggulan/Create.jsx | pages2 · "P3M/ProdukUnggulan/Create renders form" |
| 22 | P3M/ProdukUnggulan/Edit.jsx | pages2 · "P3M/ProdukUnggulan/Edit renders prefilled form" |
| 23 | P3M/Riwayat.jsx | pages2 · "P3M/Riwayat renders table" |
| 24 | Pimpinan/Verifikasi.jsx | pages · "Pimpinan/Verifikasi shows queue + documents" |
| 25 | Pimpinan/Pemantauan.jsx | pages2 · "Pimpinan/Pemantauan renders read-only table" |
| 26 | Pimpinan/Riwayat.jsx | pages2 · "Pimpinan/Riwayat renders table" |
| 27 | Direktur/Pemantauan.jsx | pages · "Direktur/Pemantauan shows tabs" |
| 28 | Direktur/Riwayat.jsx | pages2 · "Direktur/Riwayat renders tabs" |
| 29 | SuperAdmin/Users/Index.jsx | pages · "SuperAdmin Users + HakAkses + Fitur render" |
| 30 | SuperAdmin/HakAkses.jsx | pages · "SuperAdmin Users + HakAkses + Fitur render" |
| 31 | SuperAdmin/Fitur/Index.jsx | pages · "SuperAdmin Users + HakAkses + Fitur render" |
| + | Auth/Login.jsx | pages · "Auth/Login renders tabs + SSO + form" |
| + | Auth/Register.jsx | pages2 · "Auth/Register renders tabs + external form" |

Shared components (all in `shared.test.jsx`): `StatusBadge`, `Table`,
`PageHeader`, `EmptyState`, `StatusTimeline`, `FileDropzone`, `ReviewPanel`,
and `ConfirmModal` (added this round). Note: **no component named "DataTable"
exists**; the collection primitive is `Table` in `resources/js/Components/ui.jsx`
and is covered. `ConfirmModal` is now covered directly (open/closed + confirm).

### 1c. Whole-project pint

`vendor/bin/pint --test` was run on the whole project. It is still red, but
**only on files that this changeset never touched** — a pre-existing repo
condition. After formatting exactly the files this changeset touched, the
remaining failures are:

```
app/Http/Controllers/Admin/ExternalLinkController.php
app/Http/Middleware/EnsureRole.php
app/Models/ExternalLink.php
app/Models/Order.php
app/Models/OrderItem.php
app/Models/ProductCategory.php
app/Services/Auth/AuthServiceInterface.php
app/Services/Auth/LocalAuthService.php
database/migrations/2026_09_17_000001..000007_*.php
database/seeders/ExternalLinkSeeder.php / ProductCategorySeeder.php / ProductSeeder.php
```

Every file created or modified this round (and in Round 1's uncommitted set)
formats clean. The pre-existing violations were left untouched by scope.

### 1d. product.jpg provenance

- `product.jpg` at the repo root is **deleted** (git: ` D product.jpg`).
- `public/assets/product.jpg` is **new/untracked** (19,772 bytes) — the correct
  public path.
- Grep proves **only one reference exists anywhere**:
  `database/seeders/ProductSeeder.php:62 → 'thumbnail' => '/assets/product.jpg'`
  (i.e. the new `public/assets/product.jpg`). Nothing references the old root
  path. To commit: `git rm product.jpg` (already staged as deleted in the work
  tree) + `git add public/assets/product.jpg`. No other assets were touched.

## R2 §2 — Decisions applied

### D1 — Pimpinan "Disetujui" creates a linked draft Layanan Produk

- Additive migration `2026_10_11_000009_product_pu_link.php`: nullable, unique
  `produk_unggulan_id` FK on `products` (constrained, nullOnDelete). No data
  dropped; no applied migration edited.
- `Pimpinan\VerifikasiController::approve` now creates (inside
  `DB::transaction`) one inactive/draft `Product` linked to the source
  `ProdukUnggulan` via `produk_unggulan_id`, prefilled from it, and writes a
  history row. Idempotent: approving again does not create a second product.
  It never auto-publishes (product stays `draft`/inactive).
- Admin RTPU list shows a **"Dari Produk Unggulan"** marker on such rows
  (`Rtpu\LayananController::serialize` adds `dari_pu`;
  `resources/js/Pages/Rtpu/Layanan/Index.jsx` renders it).
- Evidence: `AccessMatrixTest · "Pimpinan approve creates inactive layanan
  once"` (17 assertions) — replaces Round 1's "publishes nothing" expectation
  with the mandated behaviour.

### D2 — Integer `ppn_threshold`; PPN only when subtotal > threshold

- New setting key `ppn_threshold` (integer) in `SettingSeeder`; default `0`.
  Not hard-coded to 2,000,000.
- `SettingService::getPpnThreshold()` + `calculateTax()` returns 0 when
  `subtotal <= threshold`; rate and threshold are read from settings.
- Threshold input added to `resources/js/Pages/Admin/Settings.jsx`.
- Rate/threshold changes affect only **new** orders (stored orders keep the
  values used at checkout). Checkout breakdown, stored order, payment
  verification, and Riwayat all agree.
- Evidence: `AccessMatrixTest · "Ppn threshold boundaries"` prints
  `threshold 2000000: 1999999->0, 2000000->0, 2000001->200000`;
  `"Ppn midflight change and full agreement"` prints
  `agreement: checkout=order=1100000 (subtotal 1000000 + ppn 100000)`;
  `"Ppn rate change not retroactive and totals equal"`.

### D3 — `settings_audit` table on every setting change

- Additive migration `2026_10_11_000010_settings_audit.php`:
  `settings_audit(id, key, old_value, new_value, changed_by, changed_at, timestamps, index(key))`.
- `SettingService::set()` writes an audit row on **every** change (and now
  defaults `label`/`type` for brand-new keys — fixing a real
  `NOT NULL constraint failed: settings.label` crash found during this work).
- The existing settings screen shows the last 20 changes read-only
  (`Admin\SettingController::index` passes `audits`; `Admin/Settings.jsx`
  renders them). **No new sidebar item.**
- Evidence: `AccessMatrixTest · "Settings changes are audited"`.

### D4 — `fitur:<key>` middleware gates every feature route

- `app/Http/Middleware/EnsureFitur.php` + alias `fitur` in `bootstrap/app.php`;
  `fitur:<key>` applied across the role routes in `routes/web.php`.
- Inactive fitur → **403 for all roles, including Super Admin**. Missing
  `fitur` row = fail-open (allow) so a fresh install is not bricked.
- Deactivating a feature removes its menu item from shared props
  (`HandleInertiaRequests` shares active keys; `roles.js`
  `filterMenuByFitur`; `DashboardLayout` + `PublicHeader` filter).
- `pengguna`, `hak-akses`, `fitur` are protected: disabled in the UI **and**
  rejected server-side (422) for both update and delete.
- Evidence: `AccessMatrixTest · "Fitur deactivation blocks lane"` (asserts 403,
  then reactivate), `"Fitur deactivation blocks riwayat routes"` (every
  pengajuan-lane riwayat is gated too — added after a failing-first check
  exposed `/riwayat` and `/p3m/riwayat` as un-gated), and
  `"Protected fitur cannot be deactivated"`.

### D5 — Legacy deletion (single step, grep-proven)

Grep over `resources/js`, `tests`, `routes`, and Ziggy usage proved no
references to the deleted routes before removal. Removed in one step:

**Controllers deleted**
- `app/Http/Controllers/Products/ProductController.php`
- `app/Http/Controllers/Reports/ReportController.php`
- `app/Http/Controllers/Transactions/TransactionController.php`
- `app/Http/Controllers/Admin/CurationController.php`
- `app/Http/Controllers/Admin/UserManagementController.php`

**Routes removed from `routes/web.php`**
- `products.*` (8), `transactions.*` (5), `reports.index` (×2 duplicate lines),
  `admin.users.*` (6), `admin.curation.*` (3) — plus now-unused imports.

**Orphaned pages deleted**
- `Pages/Products/{Index,Create}.jsx`, `Pages/Reports/{AdminReport,OwnerReport}.jsx`,
  `Pages/Transactions/{Index,Checkout,Show}.jsx`, `Pages/Curation/Index.jsx`,
  `Pages/UserManagement/Index.jsx`.

Deleting these also removes all four Round-1 "already-missing Show/Edit"
render targets (`Products/Show`, `Products/Edit`, `UserManagement/Create`,
`UserManagement/Edit`).

**Kept, with the reference that keeps them (per D5):**
- **Profile** (`ProfileController` + `Pages/Profile/*`) — referenced by
  `tests/Feature/ProfileTest.php` and `PasswordUpdateTest` (`/profile`
  redirects). Deleting it would require deleting tests → forbidden.
- **Settings** — now a live D2/D3 feature (`admin.settings.*`, audit screen).
- **Auth password pages** (`ForgotPassword`, `ResetPassword`,
  `ConfirmPassword`, `VerifyEmail`) — referenced by `routes/auth.php`.
- **Admin/ExternalLinks** — not in the §7 deletion list; left in place
  (still TODO-marked; listed here rather than silently removed).

Post-deletion: `php artisan route:list` shows no `products|transactions|
reports|curation|admin/users` routes; full suite, vitest, and build all green
(see §4).

## R2 §3 — SSO scaffold (flag off by default; no real provider)

- **Flag:** `config/services.php → sso.enabled = env('SSO_ENABLED', false)`;
  `.env.example` sets `SSO_ENABLED=false`. Shared to the frontend as
  `sso_enabled` via `HandleInertiaRequests`.
- **Routes:** `/sso/redirect` + `/sso/callback` are registered **only when the
  flag is on** (`routes/web.php`), so both return **404** otherwise
  (confirmed: no `/sso/` entries in `route:list` with the flag off).
- **Adapter contract:** `app/Sso/SsoProvider.php` — `redirectUrl($state)` and
  `resolveIdentity(Request) → {name, email, external_id, nim_nip}`.
- **Fail-loud placeholder:** `app/Sso/NullSsoProvider.php` throws
  `Integrasi SSO PNJ belum dikonfigurasi.` (default binding in
  `AppServiceProvider`).
- **Identity mapping:** `app/Sso/SsoService.php::findOrCreateCustomer()` —
  find-or-create, **always role `customer`**, `account_origin='sso_pnj'`,
  verified. A staff email can never be created or elevated: an existing
  non-customer email throws `SsoException` and the callback bounces to login
  with an error. Provider role hints are ignored.
- **Controller:** `app/Http/Controllers/Auth/SsoController.php` (validates a
  session `state`; 419 on mismatch).
- **Frontend:** `resources/js/lib/sso.js` navigates to `sso.redirect` **only**
  when the flag is passed as `true`; otherwise `SsoButton` keeps the neutral
  "belum diaktifkan" notice.
- **Docs:** `docs/SSO.md` lists exactly what PNJ must supply (endpoints,
  credentials, redirect URIs, returned attributes) and how to bind the real
  provider.
- **Tests:** `tests/Feature/Sso/SsoDisabledTest.php` (routes 404, login
  reports disabled, null provider throws) and
  `tests/Feature/Sso/SsoEnabledTest.php` (redirect handshake, find-or-create
  once, staff email blocked, unknown email not pre-created, invalid state 419,
  login reports enabled) using test-only `tests/Support/FakeSsoProvider.php`.

## R2 §4 — Re-verification (pasted outputs)

- `php artisan test` → `{"tool":"phpunit","result":"passed","tests":73,
  "passed":73,"assertions":592}`.
- Focused `AccessMatrixTest` testdox → `OK (22 tests, 283 assertions)`
  including `Pimpinan approve creates inactive layanan once`,
  `Ppn threshold boundaries`, `Ppn midflight change and full agreement`,
  `Settings changes are audited`, `Fitur deactivation blocks lane`,
  `Fitur deactivation blocks riwayat routes`, `Protected fitur cannot be
  deactivated`.
- `node_modules/.bin/vitest run` → `Test Files 3 passed (3)` / `Tests 39 passed
  (39)`.
- Whole-project `vendor/bin/pint --test` → red only on the pre-existing
  untouched files listed in §1c; all touched files clean.
- `npm run build` → `✓ built in 1.57s` (e.g. `app-D557k6Ue.js`).
- `php artisan route:list --except-vendor` → `Showing [84] routes`; **no
  `/sso/*` route with the flag off**; no products/transactions/reports/
  curation/admin.users routes.
- `git diff --stat` → `77 files changed, 2521 insertions(+), 2217 deletions(-)`
  (plus **51 untracked** new files: SSO classes, migrations, Flow/Sso tests,
  pages2 test).
- Removed-route references: grep of `resources/js` + `app` for
  `products|transactions|reports|admin.curation|admin.users` and stale
  `Inertia::render('Products|Reports|Transactions|Curation|UserManagement…')`
  returns **none**.
- DEV/preview harness: grep for `dev/harness`, `mocks/data`,
  `__DEV_PREVIEW__` in `resources/js` and in `public/build/assets/*.js`
  returns **none** — the harness is absent from the production build.

### Regenerated role × route access matrix (6 roles only)

| Role | Lane routes (all behind `auth`+`verified`+`role:`+`permission:`+`fitur:`) |
|---|---|
| Customer | `pengajuan` index/create/store/show/edit/update/cancel/bayar/proof, `riwayat`, catalog (public) |
| Admin RTPU | `rtpu/verifikasi/layanan{,/approve,/reject}`, `rtpu/verifikasi/pembayaran{,/accept,/reject}`, `rtpu/status{,/update}`, `rtpu/layanan*`, `rtpu/metode*`, `rtpu/riwayat`, `admin/settings`, `admin/external-links` |
| Admin P3M | `p3m/produk-unggulan*`, `p3m/riwayat` |
| Pimpinan RTPU | `pimpinan/verifikasi{,/approve,/reject}`, `pimpinan/pemantauan`, `pimpinan/riwayat` |
| Direktur | `direktur/pemantauan`, `direktur/riwayat` (read-only) |
| Super Admin | `superadmin/users*`, `superadmin/hak-akses*`, `superadmin/fitur*` |

Cross-role denials for each role are asserted in
`tests/Feature/Flow/AccessMatrixTest.php` (`*_route_access`, "Guest is
redirected to login", "Direktur is read only").

## R2 §5 — Final status & blocked-on-user

| Item | Status | Evidence |
|---|---|---|
| §1a QA-06 + "4 vs six" | Reconciled/documented (no behaviour change) | This report R2 §1a |
| §1b 31 pages + shared | Done | `pages2.test.jsx` + shared `ConfirmModal`/`SsoButton`; vitest 39 |
| §1c whole-project pint | Done (touched clean; pre-existing listed) | R2 §1c / §4 |
| §1d product.jpg | Proven; commit instructions given | R2 §1d |
| D1 linked draft layanan | Done | migration 000009; `Pimpinan approve creates inactive layanan once` |
| D2 `ppn_threshold` | Done | `Ppn threshold boundaries`, `Ppn midflight change and full agreement` |
| D3 `settings_audit` | Done | migration 000010; `Settings changes are audited` |
| D4 `fitur:` gating + protected | Done | `EnsureFitur`; `Fitur deactivation blocks lane`, `Fitur deactivation blocks riwayat routes`, `Protected fitur cannot be deactivated` |
| D5 legacy deletion | Done | Deleted set in R2 §2; suite/vitest/build green |
| SSO scaffold | Done (flag off) | R2 §3; `SsoDisabled` + `SsoEnabled` (9 tests) |
| §4 re-verify | Done | R2 §4 |

**Still blocked on user / PNJ (cannot be resolved in code):**
1. Finance to confirm the real `ppn_threshold` value (ships as `0`).
2. Formal confirmation of the single official account (Mandiri BLU PNJ) and
   its account number for the payment copy.
3. SSO: endpoints/protocol, client id/secret, registered redirect URIs, and
   the exact name/email/nim-nip attribute names (see `docs/SSO.md`).
