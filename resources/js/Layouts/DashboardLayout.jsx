import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    Award,
    ClipboardCheck,
    Eye,
    FilePlus2,
    History,
    Home,
    KeyRound,
    LayoutGrid,
    LogOut,
    Menu,
    Package,
    SlidersHorizontal,
    Store,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '@/Components/Logo';
import FlashToast from '@/Components/FlashToast';
import SwooshLine from '@/Components/SwooshLine';
import { EASE } from '@/Components/ui';
import { filterMenuByFitur, menuForRole, roleLabel } from '@/lib/roles';
import { href as navHref } from '@/lib/nav';

function getInitials(name) {
    if (!name) return '?';
    return String(name)
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Icon keys from lib/roles.js resolved to clean stroke icons.
const MENU_ICONS = {
    home: Home,
    verify: ClipboardCheck,
    pay: Wallet,
    status: Activity,
    box: Package,
    store: Store,
    sliders: SlidersHorizontal,
    wallet: Wallet,
    history: History,
    plus: FilePlus2,
    eye: Eye,
    award: Award,
    users: Users,
    key: KeyRound,
    grid: LayoutGrid,
    links: LayoutGrid,
    settings: LayoutGrid,
};

const menuFor = (role) =>
    menuForRole(role).map((item) => ({
        ...item,
        icon: MENU_ICONS[item.icon] ?? Home,
    }));

/**
 * Determine if a menu item is active.
 * Exactly one item should be active at a time.
 * Evaluates route prefix and path matching.
 */
function isItemActive(item, activeKey, currentUrl) {
    const url = currentUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
    const cleanUrl = url.split('?')[0].replace(/\/+$/, '');

    // 1. Explicit key match if provided
    if (activeKey && (item.key === activeKey || item.page === activeKey)) {
        return true;
    }

    const key = item.key ?? '';
    const page = item.page ?? item.href ?? '';

    // 2. Katalog: matches /katalog or /catalog and their sub-paths
    if (key === 'catalog' || page === 'catalog') {
        return cleanUrl.startsWith('/katalog') || cleanUrl.startsWith('/catalog');
    }

    // 3. Dashboard: matches exactly /rtpu/dashboard or /dashboard or role-specific dashboard
    if (key === 'dashboard') {
        return (
            cleanUrl === '/rtpu/dashboard' ||
            cleanUrl === '/dashboard' ||
            cleanUrl === '/p3m/dashboard' ||
            cleanUrl === '/pimpinan/dashboard' ||
            cleanUrl === '/direktur/dashboard' ||
            cleanUrl === '/superadmin/dashboard'
        );
    }

    // 4. Verifikasi Layanan / Pengajuan
    if (key === 'verify-layanan' || page === 'rtpu.verify.layanan') {
        return cleanUrl.startsWith('/rtpu/verifikasi/layanan');
    }

    if (key === 'verify-produk' || page === 'rtpu.verify.produk') {
        return cleanUrl.startsWith('/rtpu/verifikasi/produk');
    }
    // 5. Verifikasi Pembayaran
    if (key === 'verify-bayar' || page === 'rtpu.verify.bayar') {
        return cleanUrl.startsWith('/rtpu/verifikasi/pembayaran');
    }
    if (key === 'verify-produk' || page === 'rtpu.verify.produk') {
        return cleanUrl.startsWith('/rtpu/verifikasi/produk');
    }

    // 6. Status Layanan
    if (key === 'status' || page === 'rtpu.status') {
        return cleanUrl.startsWith('/rtpu/status');
    }

    // 7. Kelola Layanan (must not collide with verifikasi)
    if (key === 'layanan' || page === 'rtpu.layanan') {
        return cleanUrl.startsWith('/rtpu/layanan');
    }

    // 8. Metode Pembayaran
    if (key === 'metode' || page === 'rtpu.metode') {
        return cleanUrl.startsWith('/rtpu/metode');
    }

    // 9. Riwayat
    if (key === 'riwayat' || page === 'rtpu.riwayat') {
        return cleanUrl.startsWith('/rtpu/riwayat') || cleanUrl.includes('/riwayat');
    }

    // 10. Super Admin pages matching by path
    if (key === 'users' || page === 'superadmin.users') {
        return cleanUrl.startsWith('/superadmin/users');
    }
    if (key === 'hak' || page === 'superadmin.hakakses') {
        return cleanUrl.startsWith('/superadmin/hak-akses');
    }
    if (key === 'fitur' || page === 'superadmin.fitur') {
        return cleanUrl.startsWith('/superadmin/fitur');
    }

    // 11. P3M & Pimpinan & Direktur pages matching by path
    if (key === 'pantau' || page === 'p3m.produk.index') {
        return cleanUrl.startsWith('/p3m/produk') || cleanUrl.startsWith('/p3m/pemantauan');
    }
    if (key === 'verify-akun' || page === 'pimpinan.verify.akun') {
        return cleanUrl.startsWith('/pimpinan/verifikasi-akun');
    }
    if (key === 'verify-produk' || page === 'pimpinan.verify.produk') {
        return cleanUrl.startsWith('/pimpinan/verifikasi-produk');
    }
    if (key === 'verify' || page === 'pimpinan.verify') {
        return cleanUrl.startsWith('/pimpinan/verifikasi');
    }
    if (page === 'pimpinan.monitor') {
        return cleanUrl.startsWith('/pimpinan/pemantauan');
    }
    if (page === 'direktur.monitor') {
        return cleanUrl.startsWith('/direktur/pemantauan');
    }

    // 12. Fallback: check Ziggy route if available
    try {
        if (typeof route === 'function') {
            if (page && route().current(page)) return true;
            const prefix = String(page).split('.')[0];
            if (prefix && prefix !== 'dashboard' && route().has(`${prefix}.*`)) {
                return route().current(`${prefix}.*`);
            }
        }
    } catch {
        // Fallback silently
    }

    return false;
}

function SidebarBody({ user, menu, activeKey, pendingCounts, currentUrl, onNavigate }) {
    const role = user?.role;

    // Group menu items into defined sections with uppercase labels
    const SECTION_CONFIG = {
        1: { label: 'UTAMA' },
        2: { label: 'VERIFIKASI' },
        3: { label: 'KELOLA' },
    };

    const sections = {};
    menu.forEach((item) => {
        const secIndex = item.section || 1;
        if (!sections[secIndex]) sections[secIndex] = [];
        sections[secIndex].push(item);
    });

    const userInitials = getInitials(user?.name);
    const displayRole = roleLabel(role);

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="relative shrink-0 overflow-hidden border-b border-[var(--color-border)] px-6 py-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                <div className="relative">
                    <Logo height={34} />
                </div>
                <div className="pointer-events-none absolute -right-10 -bottom-8 w-36 opacity-[0.06]" aria-hidden>
                    <SwooshLine size="md" opacity={1} color="var(--color-accent)" stroke={2} />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Navigasi dasbor">
                {Object.entries(sections).map(([secKey, secItems], idx) => {
                    const secLabel = SECTION_CONFIG[secKey]?.label;

                    return (
                        <div key={secKey} className={idx === 0 ? '' : 'mt-5'}>
                            {secLabel && (
                                <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">
                                    {secLabel}
                                </div>
                            )}
                            <div className="space-y-1">
                                {secItems.map((item) => {
                                    const active = isItemActive(item, activeKey, currentUrl);
                                    const Icon = item.icon;
                                    const url = navHref(item.page ?? item.href, {}, role);
                                    const count = item.countKey ? (pendingCounts?.[item.countKey] ?? 0) : 0;

                                    return (
                                        <Link
                                            key={item.key ?? item.label}
                                            href={url}
                                            onClick={onNavigate}
                                            aria-current={active ? 'page' : undefined}
                                            className={`group relative flex h-10 items-center justify-between rounded-lg px-3 text-sm transition-all duration-150 ${
                                                active
                                                    ? 'bg-[var(--color-accent-tint)] text-[var(--color-accent)] font-semibold'
                                                    : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] font-normal'
                                            }`}
                                        >
                                            {active && (
                                                <span
                                                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]"
                                                    aria-hidden
                                                />
                                            )}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Icon
                                                    className={`h-4 w-4 shrink-0 transition-colors ${
                                                        active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] group-hover:text-[var(--color-ink)]'
                                                    }`}
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {/* Count badge with subtle pill */}
                                            {count > 0 && (
                                                <span
                                                    className={`text-xs tabular-nums rounded-full px-2 py-0.5 font-semibold ${
                                                        active
                                                            ? 'bg-white text-[var(--color-accent)] shadow-sm'
                                                            : 'bg-[var(--color-accent-tint)] text-[var(--color-accent)]'
                                                    }`}
                                                >
                                                    {count}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User block at bottom with inline red logout button */}
            <div className="shrink-0 border-t border-[var(--color-border)] p-3.5">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-xs font-bold text-[var(--color-accent)]"
                            aria-hidden
                        >
                            {userInitials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--color-ink)] leading-tight">
                                {user?.name ?? 'Pengguna'}
                            </p>
                            <p className="truncate text-[10px] text-[var(--color-muted)] font-medium leading-tight mt-0.5">
                                {displayRole}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title="Keluar dari akun"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        <span>Keluar</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * DashboardLayout for all staff roles.
 * Clean var(--color-bg) background, 1px right border on sidebar.
 * Top bar content aligned with 32px padding, user on the right.
 * Full width content next to sidebar, centered and max 1400px only on screens > 1600px.
 */
export default function DashboardLayout({ title, activeKey, children }) {
    const pageProps = usePage().props;
    const { auth, pending_counts } = pageProps;
    const activeFitur = pageProps.active_fitur ?? pageProps.fitur;
    const { url = '' } = usePage();
    const user = auth?.user ?? {};
    // Super Admin has access to all modules by definition; other roles filter by active features
    const allMenuItems = menuFor(user.role);
    const menu = user.role === 'super_admin' ? allMenuItems : filterMenuByFitur(allMenuItems, activeFitur);
    const [drawer, setDrawer] = useState(false);
    const reduce = useReducedMotion();
    const userInitials = getInitials(user?.name);

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            {/* Desktop sidebar with 1px right border */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--color-border)] bg-white lg:block">
                <SidebarBody
                    user={user}
                    menu={menu}
                    activeKey={activeKey}
                    pendingCounts={pending_counts}
                    currentUrl={url}
                />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {drawer && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.2 }}
                            onClick={() => setDrawer(false)}
                        />
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden shadow-layered"
                            initial={{ x: reduce ? 0 : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: reduce ? 0 : '-100%' }}
                            transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                        >
                            <button
                                type="button"
                                aria-label="Tutup menu"
                                onClick={() => setDrawer(false)}
                                className="absolute right-3 top-4 rounded-full border border-transparent p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:border-[var(--color-border)] hover:text-[var(--color-ink)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <SidebarBody
                                user={user}
                                menu={menu}
                                activeKey={activeKey}
                                pendingCounts={pending_counts}
                                currentUrl={url}
                                onNavigate={() => setDrawer(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top bar with 1px bottom border, aligned to 32px padding, user menu on the right only */}
                <header className="relative sticky top-0 z-30 border-b border-[var(--color-border)] bg-white">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                    <div className="w-full 2xl:max-w-[1400px] 2xl:mx-auto flex h-14 items-center justify-between px-8">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                aria-label="Buka menu"
                                onClick={() => setDrawer(true)}
                                className="rounded-full border border-transparent p-1.5 text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] hover:border-[var(--color-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {title && title !== 'Dashboard' && (
                                <h1 className="text-base font-semibold text-[var(--color-ink)]">
                                    {title}
                                </h1>
                            )}
                        </div>

                        {/* Top right: small avatar circle with initials and name */}
                        <div className="flex items-center gap-2.5">
                            <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--color-accent-tint)] bg-[var(--color-accent-tint)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-accent-hover)]">
                                {roleLabel(user.role)}
                            </span>
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[11px] font-bold text-[var(--color-accent)]"
                                aria-hidden
                            >
                                {userInitials}
                            </div>
                            <span className="text-sm font-medium text-[var(--color-ink)]">
                                {user?.name}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main content: width: 100%, 32px padding on all sides, max-w-[1400px] centered on >1600px screens */}
                <main className="w-full flex-1 2xl:max-w-[1400px] 2xl:mx-auto p-8">
                    {children}
                </main>
            </div>
            <FlashToast />
        </div>
    );
}


