import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '@/Components/Logo';
import Menu from '@/Components/ui/Menu';
import { CUSTOMER_MENU, filterMenuByFitur } from '@/lib/roles';
import { href as navHref } from '@/lib/nav';

const EASE = [0.22, 1, 0.36, 1];

const NAV = [
    { label: 'Beranda', href: '/' },
    { label: 'Katalog', href: '/katalog' },
    { label: 'Tentang', href: '/#tentang' },
    {
        label: 'Layanan',
        children: [
            { label: 'Jasa', href: '/katalog', desc: 'Jasa pengujian dan layanan PNJ' },
            { label: 'Ruangan', href: '/katalog', desc: 'Sewa ruangan dan fasilitas' },
            { label: 'Produk', href: '/katalog', desc: 'Produk unggulan hasil riset' },
        ],
    },
];

export default function PublicHeader({ auth }) {
    const [scrolled, setScrolled] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const [mobileLayanan, setMobileLayanan] = useState(false);
    const reduce = useReducedMotion();
    const user = auth?.user;
    const role = user?.role ?? 'guest';

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    const menuUrl = (page) => navHref(page, {}, role);
    const customerMenu = filterMenuByFitur(CUSTOMER_MENU, usePage().props.fitur);

    return (
        <header
            className="sticky top-0 z-50 transition-all duration-300"
            style={{
                background: scrolled ? 'rgba(255,255,255,0.92)' : 'var(--color-bg)',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
                boxShadow: scrolled ? '0 4px 20px -6px rgba(6,59,52,0.14)' : 'none',
            }}
        >
            <div
                className="landing-container flex items-center gap-4 transition-all duration-300"
                style={{ height: scrolled ? 64 : 76 }}
            >
                {/* Logo */}
                <Logo />

                {/* Desktop nav */}
                <nav className="ml-4 hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
                    {NAV.map((item) =>
                        item.children ? (
                            <Menu
                                key={item.label}
                                align="start"
                                buttonClassName="nav-underline text-sm font-medium text-[var(--color-ink)]"
                                button={
                                    <>
                                        {item.label}
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                }
                                items={item.children.map((c) => ({
                                    key: c.label,
                                    label: c.label,
                                    href: c.href,
                                }))}
                            />
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className="nav-underline text-sm font-medium"
                                style={{ color: 'var(--color-ink)' }}
                            >
                                {item.label}
                            </a>
                        ),
                    )}
                </nav>

                {/* Auth control: one Masuk button for guests, user menu when logged in */}
                <div className="ml-auto hidden shrink-0 md:block">
                    {user ? (
                        <Menu
                            buttonClassName="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-1.5 pr-4 text-sm transition"
                            menuClassName="w-56"
                            button={
                                <>
                                    <span
                                        className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold"
                                        style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                                    >
                                        {String(user.name ?? '?').charAt(0).toUpperCase()}
                                    </span>
                                    <span className="max-w-[120px] truncate text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                        {user.name}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-muted)' }} />
                                </>
                            }
                            items={[
                                ...customerMenu.map((m) => ({ key: m.key, label: m.label, href: menuUrl(m.page) })),
                                { type: 'divider' },
                                {
                                    key: 'logout',
                                    label: 'Keluar',
                                    icon: LogOut,
                                    destructive: true,
                                    onClick: () => router.post(route('logout')),
                                },
                            ]}
                        />
                    ) : (
                        <Link
                            href={route('login')}
                            className="inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                            style={{ background: 'var(--color-accent)' }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = 'var(--color-accent-hover)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'var(--color-accent)')
                            }
                        >
                            Masuk
                        </Link>
                    )}
                </div>

                {/* Hamburger (mobile) */}
                <button
                    type="button"
                    className="ml-auto rounded-lg p-2 lg:hidden"
                    aria-label={drawer ? 'Tutup menu' : 'Buka menu'}
                    aria-expanded={drawer}
                    onClick={() => setDrawer((v) => !v)}
                >
                    {drawer ? (
                        <X className="h-5 w-5" style={{ color: 'var(--color-ink)' }} />
                    ) : (
                        <MenuIcon className="h-5 w-5" style={{ color: 'var(--color-ink)' }} />
                    )}
                </button>
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {drawer && (
                    <motion.nav
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                        className="overflow-hidden border-t bg-white lg:hidden"
                        style={{ borderColor: 'var(--color-border)' }}
                        aria-label="Navigasi seluler"
                    >
                        <div className="space-y-1 px-5 py-4">
                            {NAV.map((item) =>
                                item.children ? (
                                    <div key={item.label}>
                                        <button
                                            type="button"
                                            onClick={() => setMobileLayanan((v) => !v)}
                                            className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium"
                                            style={{ color: 'var(--color-ink)' }}
                                        >
                                            {item.label}
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${mobileLayanan ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {mobileLayanan &&
                                            item.children.map((c) => (
                                                <a
                                                    key={c.label}
                                                    href={c.href}
                                                    onClick={() => setDrawer(false)}
                                                    className="block rounded-lg px-4 py-2 text-sm"
                                                    style={{ color: 'var(--color-muted)' }}
                                                >
                                                    {c.label}
                                                </a>
                                            ))}
                                    </div>
                                ) : (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setDrawer(false)}
                                        className="block rounded-lg px-2 py-2.5 text-sm font-medium"
                                        style={{ color: 'var(--color-ink)' }}
                                    >
                                        {item.label}
                                    </a>
                                ),
                            )}
                            {user ? (
                                <>
                                    {customerMenu.map((m) => (
                                        <a
                                            key={m.key}
                                            href={menuUrl(m.page)}
                                            onClick={() => setDrawer(false)}
                                            className="block rounded-lg px-2 py-2.5 text-sm font-medium"
                                            style={{ color: 'var(--color-ink)' }}
                                        >
                                            {m.label}
                                        </a>
                                    ))}
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="mt-2 block w-full rounded-full py-2.5 text-center text-sm font-semibold text-white"
                                        style={{ background: 'var(--color-danger)' }}
                                    >
                                        Keluar
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="mt-2 block rounded-full py-2.5 text-center text-sm font-semibold text-white"
                                    style={{ background: 'var(--color-accent)' }}
                                >
                                    Masuk
                                </Link>
                            )}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}
