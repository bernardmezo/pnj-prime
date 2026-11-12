import { Link, usePage } from '@inertiajs/react';
import { AtSign, ExternalLink as ExtIcon, Globe, Mail, MapPin, MessageCircle, Phone, Rss } from 'lucide-react';
import Logo from '@/Components/Logo';
import SwooshLine from '@/Components/SwooshLine';
import { href as navHref } from '@/lib/nav';

const SOCIALS = [
    { icon: Globe, label: 'Website' },
    { icon: AtSign, label: 'Media sosial' },
    { icon: MessageCircle, label: 'Komunitas' },
    { icon: Rss, label: 'Berita' },
];

export default function PublicFooter({ auth }) {
    const { external_links = [] } = usePage().props;

    return (
        <footer
            className="relative overflow-hidden"
            style={{
                background:
                    'linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-deep-soft) 55%, var(--color-accent-hover) 130%)',
            }}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--color-dark-border)' }} />
            <div className="pointer-events-none absolute -right-10 top-0 w-[520px] opacity-25">
                <SwooshLine size="lg" opacity={0.5} color="var(--color-gold)" stroke={1.5} />
            </div>

            <div className="landing-container relative grid gap-10 pb-12 pt-16 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]" style={{ color: 'var(--color-dark-muted)' }}>
                <div>
                    <Logo onDark />
                    <p className="mt-4 max-w-xs leading-relaxed" style={{ color: 'var(--color-dark-muted)' }}>
                        Wadah resmi hilirisasi inovasi Politeknik Negeri Jakarta, produk, jasa
                        pengujian, dan fasilitas unggulan hasil riset kampus untuk masyarakat dan
                        industri.
                    </p>
                    <div className="mt-5 flex gap-2.5">
                        {SOCIALS.map(({ icon: Icon, label }) => (
                            <a
                                key={label}
                                href="#"
                                aria-label={label}
                                className="flex h-9 w-9 items-center justify-center rounded-full border transition duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2"
                                style={{ borderColor: 'var(--color-dark-border)', color: 'var(--color-dark-muted)' }}
                            >
                                <Icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>

                <nav aria-label="Jelajahi">
                    <h4 className="mb-4 font-display text-sm font-semibold" style={{ color: 'var(--color-dark-text)' }}>Jelajahi</h4>
                    <ul className="space-y-2.5">
                        {[
                            ['Beranda', '/'],
                            ['Katalog', '/katalog'],
                        ].map(([label, href]) => (
                            <li key={label}>
                                <Link href={href} className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                    {label}
                                </Link>
                            </li>
                        ))}
                        {external_links.map((link) => (
                            <li key={link.id}>
                                <a
                                    href={link.url}
                                    target={link.target || '_blank'}
                                    rel="noopener noreferrer"
                                    className="footer-link inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-[var(--color-dark-text)]"
                                >
                                    {link.label}
                                    <ExtIcon className="h-3 w-3 opacity-60" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Akun">
                    <h4 className="mb-4 font-display text-sm font-semibold" style={{ color: 'var(--color-dark-text)' }}>Akun</h4>
                    <ul className="space-y-2.5">
                        {auth?.user ? (
                            <>
                                <li>
                                    <a href={navHref('customer.pengajuan.index', {}, auth.user.role)} className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                        Pengajuan Saya
                                    </a>
                                </li>
                                <li>
                                    <a href={navHref('customer.riwayat', {}, auth.user.role)} className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                        Riwayat
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href={route('login')} className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                        Masuk
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('register')} className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                        Daftar
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                <div>
                    <h4 className="mb-4 font-display text-sm font-semibold" style={{ color: 'var(--color-dark-text)' }}>Kontak</h4>
                    <ul className="space-y-2.5">
                        <li className="flex items-start gap-2">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-dark-muted)' }} />
                            <a href="mailto:rtpu@pnj.ac.id" className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                rtpu@pnj.ac.id
                            </a>
                        </li>
                        <li className="flex items-start gap-2">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-dark-muted)' }} />
                            <a href="tel:+622****5678" className="footer-link transition-colors duration-150 hover:text-[var(--color-dark-text)]">
                                (021) 1234 5678
                            </a>
                        </li>
                        <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-dark-muted)' }} />
                            <span>Jl. Prof. Dr. G.A. Siwabessy, Depok</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="relative border-t" style={{ borderColor: 'var(--color-dark-border)' }}>
                <div className="landing-container flex flex-wrap items-center justify-between gap-2 py-5 text-[13px]" style={{ color: 'var(--color-dark-muted)' }}>
                    <span>© 2026 PNJ Prime, UPA RTPU Politeknik Negeri Jakarta.</span>
                    <span>Pembayaran ke rekening resmi PNJ.</span>
                </div>
            </div>
        </footer>
    );
}
