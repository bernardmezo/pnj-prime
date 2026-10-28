/**
 * SINGLE SOURCE OF TRUTH for roles (frontend).
 * Exactly six roles. Layout, home page, and sidebar menu per role.
 *
 * normalizeRole(rawBackendRole): backend currently sends admin_rtpu,
 * dosen_peneliti, mahasiswa, eksternal.
 *   - admin_rtpu -> admin_rtpu
 *   - dosen_peneliti, mahasiswa, eksternal -> customer (they act as
 *     PNJ-civitas/external customers; TODO(backend): introduce dedicated
 *     admin_p3m / pimpinan_rtpu / direktur / super_admin role values)
 * Also accepts the six normalized keys directly (future backend values).
 * Anything else -> 'guest' (no layout, landing only).
 */

// TODO(backend): backend role enum must gain admin_p3m, pimpinan_rtpu,
// direktur, super_admin. Until then those roles exist only as normalized
// frontend keys (preview + display).
export const ROLES = {
    customer:      { label: 'Customer',      layout: 'public',    home: 'landing' },
    admin_rtpu:    { label: 'Admin RTPU',    layout: 'dashboard', home: 'rtpu.dashboard' },
    admin_p3m:     { label: 'Admin P3M',     layout: 'dashboard', home: 'p3m.dashboard' },
    pimpinan_rtpu: { label: 'Pimpinan RTPU', layout: 'dashboard', home: 'pimpinan.dashboard' },
    direktur:      { label: 'Direktur',      layout: 'dashboard', home: 'direktur.dashboard' },
    super_admin:   { label: 'Super Admin',   layout: 'dashboard', home: 'superadmin.dashboard' },
};

export const ROLE_KEYS = Object.keys(ROLES);
export const ROLE_LABELS = Object.fromEntries(ROLE_KEYS.map((k) => [k, ROLES[k].label]));

export function normalizeRole(raw) {
    if (raw === 'admin_rtpu') return 'admin_rtpu';
    if (raw === 'super_admin') return 'super_admin';
    if (raw === 'admin_p3m' || raw === 'pimpinan_rtpu' || raw === 'direktur') return raw;
    if (raw === 'dosen_peneliti' || raw === 'mahasiswa' || raw === 'eksternal') return 'customer';
    if (raw === 'customer') return 'customer';
    return 'guest';
}

export const roleLabel = (raw) => ROLES[normalizeRole(raw)]?.label ?? 'Tamu';
export const roleLayout = (raw) => ROLES[normalizeRole(raw)]?.layout ?? 'public';
export const roleHome = (raw) => ROLES[normalizeRole(raw)]?.home ?? 'landing';
export const isStaffRole = (raw) => roleLayout(raw) === 'dashboard';

// Sidebar menus, exactly per spec, in order. `page` is a nav pageKey,
// `fitur` is the feature flag gating the item (null = always shown).
// Icons are string keys resolved by DashboardLayout.
export const MENUS = {
    admin_rtpu: [
        { key: 'dashboard', label: 'Dashboard', page: 'rtpu.dashboard', icon: 'home', fitur: 'verifikasi', section: 1 },
        { key: 'catalog', label: 'Katalog', page: 'catalog', icon: 'store', fitur: 'katalog', section: 1 },
        { key: 'verify-layanan', label: 'Verifikasi Pengajuan', page: 'rtpu.verify.layanan', icon: 'verify', fitur: 'verifikasi', section: 2, countKey: 'menunggu_verifikasi' },
        { key: 'verify-bayar', label: 'Verifikasi Pembayaran', page: 'rtpu.verify.bayar', icon: 'pay', fitur: 'pembayaran', section: 2, countKey: 'verifikasi_bayar' },
        { key: 'status', label: 'Status Layanan', page: 'rtpu.status', icon: 'status', fitur: 'pengajuan', section: 2 },
        { key: 'layanan', label: 'Kelola Layanan', page: 'rtpu.layanan', icon: 'sliders', fitur: 'katalog', section: 3 },
        { key: 'metode', label: 'Metode Pembayaran', page: 'rtpu.metode', icon: 'wallet', fitur: 'pembayaran', section: 3 },
        { key: 'riwayat', label: 'Riwayat', page: 'rtpu.riwayat', icon: 'history', fitur: 'pengajuan', section: 3 },
    ],
    admin_p3m: [
        { key: 'dashboard', label: 'Dashboard', page: 'p3m.dashboard', icon: 'home', fitur: 'produk-unggulan', section: 1 },
        { key: 'catalog', label: 'Katalog', page: 'catalog', icon: 'store', fitur: 'katalog', section: 1 },
        { key: 'pantau', label: 'Pemantauan', page: 'p3m.produk.index', icon: 'eye', fitur: 'produk-unggulan', section: 2 },
        { key: 'riwayat', label: 'Riwayat', page: 'p3m.riwayat', icon: 'history', fitur: 'produk-unggulan', section: 2 },
    ],
    pimpinan_rtpu: [
        { key: 'dashboard', label: 'Dashboard', page: 'pimpinan.dashboard', icon: 'home', fitur: 'produk-unggulan', section: 1 },
        { key: 'catalog', label: 'Katalog', page: 'catalog', icon: 'store', fitur: 'katalog', section: 1 },
        { key: 'verify', label: 'Verifikasi Produk Unggulan', page: 'pimpinan.verify', icon: 'verify', fitur: 'produk-unggulan', section: 2, countKey: 'menunggu_pimpinan' },
        { key: 'pantau', label: 'Pemantauan', page: 'pimpinan.monitor', icon: 'eye', fitur: 'produk-unggulan', section: 2 },
        { key: 'riwayat', label: 'Riwayat', page: 'pimpinan.riwayat', icon: 'history', fitur: 'produk-unggulan', section: 2 },
    ],
    direktur: [
        { key: 'dashboard', label: 'Dashboard', page: 'direktur.dashboard', icon: 'home', fitur: 'produk-unggulan', section: 1 },
        { key: 'catalog', label: 'Katalog', page: 'catalog', icon: 'store', fitur: 'katalog', section: 1 },
        { key: 'pantau', label: 'Pemantauan', page: 'direktur.monitor', icon: 'eye', fitur: 'produk-unggulan', section: 2 },
        { key: 'riwayat', label: 'Riwayat', page: 'direktur.riwayat', icon: 'history', fitur: 'produk-unggulan', section: 2 },
    ],
    super_admin: [
        { key: 'dashboard', label: 'Dashboard', page: 'superadmin.dashboard', icon: 'home', fitur: 'pengguna', section: 1 },
        { key: 'catalog', label: 'Katalog', page: 'catalog', icon: 'store', fitur: 'katalog', section: 1 },
        { key: 'users', label: 'Kelola User', page: 'superadmin.users', icon: 'users', fitur: 'pengguna', section: 3 },
        { key: 'hak', label: 'Hak Akses', page: 'superadmin.hakakses', icon: 'key', fitur: 'hak-akses', section: 3 },
        { key: 'fitur', label: 'Kelola Fitur', page: 'superadmin.fitur', icon: 'grid', fitur: 'fitur', section: 3 },
    ],
    customer: [],
};

export const menuForRole = (raw) => MENUS[normalizeRole(raw)] ?? [];

/**
 * Live menu preview for the Super Admin "Hak Akses" editor. Reuses the same
 * MENUS config the real sidebar consumes — do not duplicate it here.
 *
 * @param {string} raw            role (raw or normalized)
 * @param {object} matrix         role -> fitur -> aksi -> boolean (may be unsaved)
 * @param {Array}  fiturList      [{ key, active }] from the server; missing = active
 * @returns {Array} visible menu items, in config order
 */
export function previewMenuForRole(raw, matrix, fiturList = []) {
    const role = normalizeRole(raw);
    const items = MENUS[role] ?? [];
    const activeByKey = new Map((fiturList ?? []).map((f) => [f.key, f.active !== false]));
    return items.filter((item) => {
        if (!item.fitur) return true;
        const active = activeByKey.has(item.fitur) ? activeByKey.get(item.fitur) : true;
        // Super Admin bypasses granular Lihat, mirroring User::canDo().
        const canSee = role === 'super_admin' ? true : Boolean(matrix?.[role]?.[item.fitur]?.Lihat);
        return active && canSee;
    });
}

/**
 * Filter a menu by the active feature keys from shared props.
 * `activeKeys === null/undefined` (props absent, e.g. old responses or
 * tests) means show everything.
 */
export function filterMenuByFitur(menu, activeKeys) {
    if (!Array.isArray(activeKeys)) return menu;
    return menu.filter((m) => !m.fitur || activeKeys.includes(m.fitur));
}

// Customer header user menu (PublicLayout).
export const CUSTOMER_MENU = [
    { key: 'ajukan', label: 'Ajukan Layanan', page: 'customer.pengajuan.create', fitur: 'pengajuan' },
    { key: 'pengajuan', label: 'Pengajuan Saya', page: 'customer.pengajuan.index', fitur: 'pengajuan' },
    { key: 'riwayat', label: 'Riwayat', page: 'customer.riwayat', fitur: 'pengajuan' },
];
