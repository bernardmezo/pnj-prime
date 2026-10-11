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
    Menu,
    Package,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '@/Components/Logo';
import { EASE, menuForRole, roleLabel } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

function initials(name) {
    return String(name ?? '?')
        .split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Icon keys from lib/roles.js resolved to lucide components.
const MENU_ICONS = {
    home: Home,
    verify: ClipboardCheck,
    pay: Wallet,
    status: Activity,
    box: Package,
    wallet: Wallet,
    history: History,
    plus: FilePlus2,
    eye: Eye,
    award: Award,
    users: Users,
    key: KeyRound,
    grid: LayoutGrid,
    curation: ClipboardCheck,
    products: Package,
    transactions: Activity,
    reports: Activity,
    links: LayoutGrid,
    settings: LayoutGrid,
};
const menuFor = (role) =>
    menuForRole(role).map((item) => ({ ...item, icon: MENU_ICONS[item.icon] ?? Home }));

// Route-name prefix that marks a menu item active (real routes only).
function activeFor(href) {
    try {
        if (href === 'dashboard') return route().current('dashboard');
        return route().current(`${String(href).split('.')[0]}.*`);
    } catch {
        return false;
    }
}

function SidebarBody({ user, menu, activeKey, onNavigate }) {
    const role = user?.role;
    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b px-5 pb-4 pt-5" style={{ borderColor: 'var(--color-border)' }}>
                <Logo height={34} />
                <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>
                    {String(roleLabel(role)).toUpperCase()}
                </p>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Navigasi dasbor">
                <ul className="space-y-1">
                    {menu.map((item) => {
                        const active = activeKey ? item.key === activeKey : activeFor(item.href);
                        const Icon = item.icon;
                        const url = navHref(item.page ?? item.href, {}, role);
                        return (
                            <li key={item.key ?? item.label}>
                                <Link
                                    href={url}
                                    onClick={onNavigate}
                                    aria-current={active ? 'page' : undefined}
                                    className="relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition"
                                    style={
                                        active
                                            ? { color: 'var(--color-accent-hover)' }
                                            : { color: 'var(--color-muted)' }
                                    }
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2"
                                            style={{ background: 'var(--color-accent)' }}
                                        />
                                    )}
                                    <Icon className="h-[18px] w-[18px] shrink-0" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="shrink-0 border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3 rounded-2xl p-2" style={{ background: 'var(--color-surface)' }}>
                    <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
                        style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                    >
                        {initials(user?.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {user?.name}
                        </span>
                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                            {roleLabel(role)}
                        </span>
                    </span>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title="Keluar"
                        aria-label="Keluar"
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition"
                        style={{ color: 'var(--color-danger)' }}
                    >
                        Keluar
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * DashboardLayout for all five staff roles.
 * Full left sidebar on every page; slim top bar; calm motion only.
 * `activeKey` marks the active sidebar item when previewing pages
 * without a backend route.
 */
export default function DashboardLayout({ title, breadcrumb, activeKey, children }) {
    const { auth } = usePage().props;
    const user = auth?.user ?? {};
    const menu = menuFor(user.role);
    const [drawer, setDrawer] = useState(false);
    const reduce = useReducedMotion();

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
            {/* Desktop sidebar */}
            <aside
                className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white lg:block"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <SidebarBody user={user} menu={menu} activeKey={activeKey} />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {drawer && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.2 }}
                            onClick={() => setDrawer(false)}
                        />
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden"
                            initial={{ x: reduce ? 0 : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: reduce ? 0 : '-100%' }}
                            transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                        >
                            <button
                                type="button"
                                aria-label="Tutup menu"
                                onClick={() => setDrawer(false)}
                                className="absolute right-3 top-4 rounded-lg p-1.5"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <SidebarBody user={user} menu={menu} activeKey={activeKey} onNavigate={() => setDrawer(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="lg:pl-64">
                {/* Slim top bar */}
                <header
                    className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                        <button
                            type="button"
                            aria-label="Buka menu"
                            onClick={() => setDrawer(true)}
                            className="rounded-lg p-2 lg:hidden"
                            style={{ color: 'var(--color-ink)' }}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                            {breadcrumb && (
                                <p className="truncate text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {breadcrumb}
                                </p>
                            )}
                            {title && (
                                <h1 className="truncate font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                                    {title}
                                </h1>
                            )}
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <span
                                className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold"
                                style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                            >
                                {initials(user.name)}
                            </span>
                            <span className="hidden text-left sm:block">
                                <span className="block max-w-[140px] truncate text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                    {user.name}
                                </span>
                                <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {roleLabel(user.role)}
                                </span>
                            </span>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">{children}</main>
            </div>
        </div>
    );
}
