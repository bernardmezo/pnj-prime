import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    ClipboardCheck,
    Home,
    Link2,
    Menu,
    Package,
    Settings,
    ShoppingCart,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '@/Components/Logo';
import { EASE, menuForRole, roleLabel } from '@/Components/ui';

function initials(name) {
    return String(name ?? '?')
        .split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Central menu map lives in ui.jsx (MENU_BY_ROLE); keys resolved here.
const MENU_ICONS = {
    home: Home,
    curation: ClipboardCheck,
    products: Package,
    transactions: ShoppingCart,
    reports: BarChart3,
    users: Users,
    links: Link2,
    settings: Settings,
};
const menuFor = (role) =>
    menuForRole(role).map((item) => ({ ...item, icon: MENU_ICONS[item.icon] ?? Home }));

// Route-name prefix that marks a menu item active.
function activeFor(href) {
    const base = href.split('.')[0];
    if (href === 'dashboard') return route().current('dashboard');
    if (href.startsWith('admin.curation')) return route().current('admin.curation.*');
    if (href.startsWith('admin.users')) return route().current('admin.users.*');
    if (href.startsWith('admin.external-links')) return route().current('admin.external-links.*');
    if (href === 'admin.settings.index') return route().current('admin.settings.*');
    if (href.startsWith('products')) return route().current('products.*');
    if (href.startsWith('transactions')) return route().current('transactions.*');
    if (href.startsWith('reports')) return route().current('reports.*');
    try {
        return route().current(`${base}.*`);
    } catch {
        return false;
    }
}

function SidebarBody({ user, menu, onNavigate }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center border-b px-5" style={{ borderColor: 'var(--color-border)' }}>
                <Logo height={34} />
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Navigasi dasbor">
                <ul className="space-y-1">
                    {menu.map((item) => {
                        const active = activeFor(item.href);
                        const Icon = item.icon;
                        let href = '/';
                        try {
                            href = route(item.href);
                        } catch {
                            href = '/';
                        }
                        return (
                            <li key={item.label}>
                                <Link
                                    href={href}
                                    onClick={onNavigate}
                                    aria-current={active ? 'page' : undefined}
                                    className="relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition"
                                    style={
                                        active
                                            ? { background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }
                                            : { color: 'var(--color-muted)' }
                                    }
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
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
                            {roleLabel(user?.role)}
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
 * DashboardLayout — Admin P3M channel, Admin RTPU, Super Admin.
 * Left sidebar on desktop, slide-in drawer on mobile. Slim top bar.
 * Calm motion only (fade 200ms); no blobs/parallax/shimmer.
 */
export default function DashboardLayout({ title, breadcrumb, children }) {
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
                <SidebarBody user={user} menu={menu} />
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
                            <SidebarBody user={user} menu={menu} onNavigate={() => setDrawer(false)} />
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
                            <button
                                type="button"
                                aria-label="Notifikasi"
                                className="rounded-full p-2.5 transition"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                <Bell className="h-5 w-5" />
                            </button>
                            <Link href={route('profile.edit')} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition">
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
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">{children}</main>
            </div>
        </div>
    );
}

