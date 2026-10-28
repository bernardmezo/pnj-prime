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

    // 5. Verifikasi Pembayaran
    if (key === 'verify-bayar' || page === 'rtpu.verify.bayar') {
        return cleanUrl.startsWith('/rtpu/verifikasi/pembayaran');
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
            <div className="shrink-0 border-b border-slate-200 px-6 py-5">
                <Logo height={32} />
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Navigasi dasbor">
                {Object.entries(sections).map(([secKey, secItems], idx) => {
                    const secLabel = SECTION_CONFIG[secKey]?.label;

                    return (
                        <div key={secKey} className={idx === 0 ? '' : 'mt-5'}>
                            {secLabel && (
                                <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">
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
                                            className={`group relative flex h-10 items-center justify-between rounded-[6px] px-3 text-sm transition-colors ${
                                                active
                                                    ? 'bg-teal-500/[0.08] text-[var(--color-accent)] font-semibold'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-normal'
                                            }`}
                                        >
                                            {active && (
                                                <span
                                                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[var(--color-accent)]"
                                                    aria-hidden
                                                />
                                            )}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Icon
                                                    className={`h-4 w-4 shrink-0 transition-colors ${
                                                        active ? 'text-[var(--color-accent)]' : 'text-slate-500 group-hover:text-slate-800'
                                                    }`}
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {/* Plain right-aligned count at far edge with tabular-nums */}
                                            {count > 0 && (
                                                <span
                                                    className={`text-xs tabular-nums ${
                                                        active ? 'text-[var(--color-accent)] font-semibold' : 'text-slate-500 font-medium'
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
            <div className="shrink-0 border-t border-slate-200 p-3.5">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700"
                            aria-hidden
                        >
                            {userInitials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                                {user?.name ?? 'Pengguna'}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title="Keluar dari akun"
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 shrink-0"
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
 * Clean #F7F8FA background, 1px right border on sidebar.
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
        <div className="min-h-screen bg-[#F7F8FA]">
            {/* Desktop sidebar with 1px right border */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#E5E7EB] bg-white lg:block">
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
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden shadow-lg"
                            initial={{ x: reduce ? 0 : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: reduce ? 0 : '-100%' }}
                            transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                        >
                            <button
                                type="button"
                                aria-label="Tutup menu"
                                onClick={() => setDrawer(false)}
                                className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
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
                <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
                    <div className="w-full 2xl:max-w-[1400px] 2xl:mx-auto flex h-14 items-center justify-between px-8">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                aria-label="Buka menu"
                                onClick={() => setDrawer(true)}
                                className="rounded-md p-1.5 text-slate-700 hover:bg-slate-100 lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {title && title !== 'Dashboard' && (
                                <h1 className="text-base font-semibold text-[#111827]">
                                    {title}
                                </h1>
                            )}
                        </div>

                        {/* Top right: small avatar circle with initials and name */}
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700"
                                aria-hidden
                            >
                                {userInitials}
                            </div>
                            <span className="text-sm font-medium text-[#111827]">
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


