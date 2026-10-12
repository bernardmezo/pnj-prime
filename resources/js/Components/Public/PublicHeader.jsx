import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '@/Components/Logo';
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
    const [dropOpen, setDropOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
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
                            <div
                                key={item.label}
                                className="relative"
                                onMouseEnter={() => setDropOpen(true)}
                                onMouseLeave={() => setDropOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setDropOpen((v) => !v)}
                                    aria-expanded={dropOpen}
                                    className="nav-underline flex items-center gap-1 text-sm font-medium"
                                    style={{ color: 'var(--color-ink)' }}
                                >
                                    {item.label}
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <AnimatePresence>
                                    {dropOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: reduce ? 0 : 8 }}
                                            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                                            className="absolute left-0 top-full w-72 pt-3"
                                        >
                                            <div
                                                className="overflow-hidden rounded-2xl border bg-white p-2"
                                                style={{
                                                    borderColor: 'var(--color-border)',
                                                    boxShadow:
                                                        '0 18px 44px -12px rgba(6,59,52,0.28)',
                                                }}
                                            >
                                                {item.children.map((c) => (
                                                    <a
                                                        key={c.label}
                                                        href={c.href}
                                                        onClick={() => setDropOpen(false)}
                                                        className="block rounded-xl px-4 py-3 transition hover:bg-[var(--color-accent-tint)]"
                                                    >
                                                        <span
                                                            className="block text-sm font-semibold"
                                                            style={{ color: 'var(--color-ink)' }}
                                                        >
                                                            {c.label}
                                                        </span>
                                                        <span
                                                            className="block text-xs"
                                                            style={{ color: 'var(--color-muted)' }}
                                                        >
                                                            {c.desc}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                        <div className="relative" onMouseLeave={() => setUserOpen(false)}>
                            <button
                                type="button"
                                onClick={() => setUserOpen((v) => !v)}
                                onMouseEnter={() => setUserOpen(true)}
                                aria-expanded={userOpen}
                                className="flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition"
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
                            >
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
                            </button>
                            <AnimatePresence>
                                {userOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: reduce ? 0 : 8 }}
                                        transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                                        className="absolute right-0 top-full w-56 pt-2"
                                    >
                                        <div
                                            className="overflow-hidden rounded-2xl border bg-white p-2"
                                            style={{ borderColor: 'var(--color-border)', boxShadow: '0 18px 44px -12px rgba(6,59,52,0.28)' }}
                                        >
                                            {customerMenu.map((m) => (
                                                <a
                                                    key={m.key}
                                                    href={menuUrl(m.page)}
                                                    className="block rounded-xl px-4 py-2.5 text-sm font-medium transition"
                                                    style={{ color: 'var(--color-ink)' }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-tint)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {m.label}
                                                </a>
                                            ))}
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-start text-sm font-medium transition"
                                                style={{ color: 'var(--color-danger)' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-tint)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <LogOut className="h-4 w-4" /> Keluar
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
                        <Menu className="h-5 w-5" style={{ color: 'var(--color-ink)' }} />
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
