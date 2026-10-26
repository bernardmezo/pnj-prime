import { Link, usePage } from '@inertiajs/react';
import { AtSign, ExternalLink as ExtIcon, Globe, Mail, MapPin, MessageCircle, Phone, Rss } from 'lucide-react';
import Logo from '@/Components/Logo';
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
            style={{
                background:
                    'linear-gradient(135deg, var(--color-deep) 0%, var(--color-deep-soft) 55%, var(--color-accent-hover) 130%)',
            }}
        >
            <div className="landing-container grid gap-10 pb-12 pt-16 text-sm text-white/75 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
                <div>
                    <Logo onDark />
                    <p className="mt-4 max-w-xs leading-relaxed text-white/65">
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
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/75 transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                            >
                                <Icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>

                <nav aria-label="Jelajahi">
                    <h4 className="mb-4 font-display text-sm font-semibold text-white">Jelajahi</h4>
                    <ul className="space-y-2.5">
                        {[
                            ['Beranda', '/'],
                            ['Katalog', '/katalog'],
                        ].map(([label, href]) => (
                            <li key={label}>
                                <Link href={href} className="footer-link hover:text-white">
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
                                    className="footer-link inline-flex items-center gap-1.5 hover:text-white"
                                >
                                    {link.label}
                                    <ExtIcon className="h-3 w-3 opacity-60" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Akun">
                    <h4 className="mb-4 font-display text-sm font-semibold text-white">Akun</h4>
                    <ul className="space-y-2.5">
                        {auth?.user ? (
                            <>
                                <li>
                                    <a href={navHref('customer.pengajuan.index', {}, auth.user.role)} className="footer-link hover:text-white">
                                        Pengajuan Saya
                                    </a>
                                </li>
                                <li>
                                    <a href={navHref('customer.riwayat', {}, auth.user.role)} className="footer-link hover:text-white">
                                        Riwayat
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href={route('login')} className="footer-link hover:text-white">
                                        Masuk
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('register')} className="footer-link hover:text-white">
                                        Daftar
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                <div>
                    <h4 className="mb-4 font-display text-sm font-semibold text-white">Kontak</h4>
                    <ul className="space-y-2.5">
                        <li className="flex items-start gap-2">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                            <a href="mailto:rtpu@pnj.ac.id" className="footer-link hover:text-white">
                                rtpu@pnj.ac.id
                            </a>
                        </li>
                        <li className="flex items-start gap-2">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                            <a href="tel:+622112345678" className="footer-link hover:text-white">
                                (021) 1234 5678
                            </a>
                        </li>
                        <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                            <span>Jl. Prof. Dr. G.A. Siwabessy, Depok</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="landing-container flex flex-wrap items-center justify-between gap-2 py-5 text-[13px] text-white/55">
                    <span>© 2026 PNJ Prime, UPA RTPU Politeknik Negeri Jakarta.</span>
                    <span>Pembayaran ke rekening resmi PNJ.</span>
                </div>
            </div>
        </footer>
    );
}
