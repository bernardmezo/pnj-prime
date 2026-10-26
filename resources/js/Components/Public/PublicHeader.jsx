import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogOut, Menu as MenuIcon, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '@/Components/Logo';
import Menu from '@/Components/ui/Menu';
import { CUSTOMER_MENU, filterMenuByFitur, isStaffRole, normalizeRole, roleHome } from '@/lib/roles';
import { href as navHref } from '@/lib/nav';

const EASE = [0.22, 1, 0.36, 1];

export default function PublicHeader({ auth }) {
    const [scrolled, setScrolled] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const reduce = useReducedMotion();
    const user = auth?.user;
    const role = normalizeRole(user?.role);
    const isCustomer = role === 'customer';
    const isStaff = isStaffRole(user?.role);
    const { url = '/' } = usePage();

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

    const menuUrl = (page) => navHref(page, {}, user?.role);
    const customerMenu = filterMenuByFitur(CUSTOMER_MENU, usePage().props.fitur);

    // Compute active nav item
    const isHomeActive = url === '/' || url === '';
    const isCatalogActive = url.startsWith('/katalog') || url.startsWith('/catalog');
    const isPengajuanActive = url.startsWith('/pengajuan') && !url.includes('/create');
    const isRiwayatActive = url.startsWith('/riwayat');

    // Navigation links per role/audience
    const navLinks = isCustomer
        ? [
              { label: 'Beranda', href: '/', active: isHomeActive },
              { label: 'Katalog', href: '/katalog', active: isCatalogActive },
              { label: 'Pengajuan Saya', href: '/pengajuan', active: isPengajuanActive },
              { label: 'Riwayat', href: '/riwayat', active: isRiwayatActive },
          ]
        : [
              { label: 'Beranda', href: '/', active: isHomeActive },
              { label: 'Katalog', href: '/katalog', active: isCatalogActive },
          ];

    return (
        <header
            className="sticky top-0 z-50 transition-all duration-300"
            style={{
                background: scrolled ? 'rgba(255,255,255,0.94)' : 'var(--color-bg)',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
                boxShadow: scrolled ? '0 4px 20px -6px rgba(6,59,52,0.12)' : 'none',
            }}
        >
            <div
                className="landing-container flex items-center gap-4 transition-all duration-300"
                style={{ height: scrolled ? 64 : 76 }}
            >
                {/* Logo */}
                <Logo />

                {/* Desktop nav */}
                <nav className="ml-6 hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
                    {navLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-current={item.active ? 'page' : undefined}
                            className={`nav-underline text-sm transition ${
                                item.active ? 'font-semibold' : 'font-medium hover:text-[var(--color-ink)]'
                            }`}
                            style={{
                                color: item.active ? 'var(--color-accent-hover)' : 'var(--color-ink)',
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Auth & action controls (desktop) */}
                <div className="ml-auto hidden shrink-0 items-center gap-3 md:flex">
                    {user ? (
                        <>
                            {isCustomer && (
                                <Link
                                    href="/pengajuan/create"
                                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px active:scale-[0.98]"
                                    style={{ background: 'var(--color-accent)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Ajukan Layanan
                                </Link>
                            )}

                            {isStaff && (
                                <Link
                                    href={menuUrl(roleHome(user?.role))}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition hover:-translate-y-px"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-ink)',
                                        background: 'var(--color-surface)',
                                    }}
                                >
                                    <LayoutDashboard className="h-3.5 w-3.5 text-emerald-600" />
                                    Pusat Kendali
                                </Link>
                            )}

                            <Menu
                                buttonClassName="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-1.5 pr-4 text-sm transition hover:border-[var(--color-muted)]"
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
                                    ...(isCustomer
                                        ? customerMenu.map((m) => ({ key: m.key, label: m.label, href: menuUrl(m.page) }))
                                        : isStaff
                                          ? [{ key: 'dash', label: 'Dashboard Staff', href: menuUrl(roleHome(user?.role)) }]
                                          : []),
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
                        </>
                    ) : (
                        <Link
                            href={route('login')}
                            className="inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                            style={{ background: 'var(--color-accent)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
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
                            {navLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setDrawer(false)}
                                    className={`block rounded-lg px-3 py-2.5 text-sm ${
                                        item.active ? 'font-semibold' : 'font-medium'
                                    }`}
                                    style={{
                                        color: item.active ? 'var(--color-accent-hover)' : 'var(--color-ink)',
                                        background: item.active ? 'var(--color-accent-tint)' : 'transparent',
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {user ? (
                                <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                                    {isCustomer && (
                                        <Link
                                            href="/pengajuan/create"
                                            onClick={() => setDrawer(false)}
                                            className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-center text-sm font-semibold text-white"
                                            style={{ background: 'var(--color-accent)' }}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Ajukan Layanan
                                        </Link>
                                    )}

                                    {isStaff && (
                                        <Link
                                            href={menuUrl(roleHome(user?.role))}
                                            onClick={() => setDrawer(false)}
                                            className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-full border py-2.5 text-center text-sm font-semibold"
                                            style={{
                                                borderColor: 'var(--color-border)',
                                                color: 'var(--color-ink)',
                                                background: 'var(--color-surface)',
                                            }}
                                        >
                                            <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                                            Pusat Kendali
                                        </Link>
                                    )}

                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="mt-2 block w-full rounded-full py-2.5 text-center text-sm font-semibold text-white"
                                        style={{ background: 'var(--color-danger)' }}
                                    >
                                        Keluar
                                    </Link>
                                </div>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="mt-3 block rounded-full py-2.5 text-center text-sm font-semibold text-white"
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
