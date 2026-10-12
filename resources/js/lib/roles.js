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
    customer:      { label: 'Customer',      layout: 'public',    home: 'customer.pengajuan.index' },
    admin_rtpu:    { label: 'Admin RTPU',    layout: 'dashboard', home: 'rtpu.verify.layanan' },
    admin_p3m:     { label: 'Admin P3M',     layout: 'dashboard', home: 'p3m.produk.index' },
    pimpinan_rtpu: { label: 'Pimpinan RTPU', layout: 'dashboard', home: 'pimpinan.verify' },
    direktur:      { label: 'Direktur',      layout: 'dashboard', home: 'direktur.monitor' },
    super_admin:   { label: 'Super Admin',   layout: 'dashboard', home: 'superadmin.users' },
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
        { key: 'verify-layanan', label: 'Verifikasi Pengajuan', page: 'rtpu.verify.layanan', icon: 'verify', fitur: 'verifikasi' },
        { key: 'verify-bayar', label: 'Verifikasi Pembayaran', page: 'rtpu.verify.bayar', icon: 'pay', fitur: 'pembayaran' },
        { key: 'status', label: 'Status Layanan', page: 'rtpu.status', icon: 'status', fitur: 'pengajuan' },
        { key: 'layanan', label: 'Kelola Layanan', page: 'rtpu.layanan', icon: 'box', fitur: 'katalog' },
        { key: 'metode', label: 'Metode Pembayaran', page: 'rtpu.metode', icon: 'wallet', fitur: 'pembayaran' },
        { key: 'riwayat', label: 'Riwayat', page: 'rtpu.riwayat', icon: 'history', fitur: 'pengajuan' },
    ],
    admin_p3m: [
        { key: 'pantau', label: 'Pemantauan', page: 'p3m.produk.index', icon: 'eye', fitur: 'produk-unggulan' },
        { key: 'ajukan', label: 'Ajukan Produk Unggulan', page: 'p3m.produk.create', icon: 'plus', fitur: 'produk-unggulan' },
        { key: 'riwayat', label: 'Riwayat', page: 'p3m.riwayat', icon: 'history', fitur: 'produk-unggulan' },
    ],
    pimpinan_rtpu: [
        { key: 'verify', label: 'Verifikasi Produk Unggulan', page: 'pimpinan.verify', icon: 'verify', fitur: 'produk-unggulan' },
        { key: 'pantau', label: 'Pemantauan', page: 'pimpinan.monitor', icon: 'eye', fitur: 'produk-unggulan' },
        { key: 'riwayat', label: 'Riwayat', page: 'pimpinan.riwayat', icon: 'history', fitur: 'produk-unggulan' },
    ],
    direktur: [
        { key: 'pantau', label: 'Pemantauan', page: 'direktur.monitor', icon: 'eye', fitur: 'produk-unggulan' },
        { key: 'riwayat', label: 'Riwayat', page: 'direktur.riwayat', icon: 'history', fitur: 'produk-unggulan' },
    ],
    super_admin: [
        { key: 'users', label: 'Kelola User', page: 'superadmin.users', icon: 'users', fitur: 'pengguna' },
        { key: 'hak', label: 'Hak Akses', page: 'superadmin.hakakses', icon: 'key', fitur: 'hak-akses' },
        { key: 'fitur', label: 'Kelola Fitur', page: 'superadmin.fitur', icon: 'grid', fitur: 'fitur' },
    ],
    customer: [],
};

export const menuForRole = (raw) => MENUS[normalizeRole(raw)] ?? [];

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
