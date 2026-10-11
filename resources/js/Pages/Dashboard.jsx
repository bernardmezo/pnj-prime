import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    ClipboardCheck,
    Package,
    ShoppingCart,
    Store,
    Users,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, FadeIn, isInternalRole, normalizeRole, roleLabel } from '@/Components/ui';

function QuickAction({ href, title, desc, icon: Icon }) {
    return (
        <Link href={href}>
            <Card className="group flex h-full items-start gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition"
                    style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <span>
                    <span className="block font-display text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {title}
                    </span>
                    <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--color-muted)' }}>
                        {desc}
                    </span>
                </span>
            </Card>
        </Link>
    );
}

function actionsFor(role) {
    const n = normalizeRole(role);
    const all = [
        { href: 'home', title: 'Katalog Produk', desc: 'Jelajahi produk, jasa, dan fasilitas unggulan PNJ.', icon: Store, roles: ['admin_rtpu', 'admin_p3m', 'customer', 'super_admin'] },
        { href: 'products.index', title: 'Pengajuan Inovasi', desc: 'Kelola produk dan pengajuan kurasi Anda.', icon: Package, roles: ['admin_rtpu', 'admin_p3m'] },
        { href: 'admin.curation.index', title: 'Antrian Kurasi', desc: 'Tinjau dan setujui produk yang diajukan Admin P3M.', icon: ClipboardCheck, roles: ['admin_rtpu'] },
        { href: 'admin.users.index', title: 'Manajemen Pengguna & Role', desc: 'Kelola akun, peran, dan hak akses.', icon: Users, roles: ['admin_rtpu', 'super_admin'] },
        { href: 'transactions.index', title: 'Transaksi', desc: 'Lihat riwayat pesanan dan status pembayaran.', icon: ShoppingCart, roles: ['admin_rtpu', 'admin_p3m', 'customer'] },
        { href: 'reports.index', title: 'Laporan', desc: 'Ringkasan transaksi dan performa produk.', icon: BarChart3, roles: ['admin_rtpu', 'admin_p3m', 'super_admin'] },
    ];
    return all
        .filter((a) => a.roles.includes(n))
        .map((a) => {
            let href = '/';
            try { href = route(a.href); } catch { href = '/'; }
            return { ...a, href };
        });
}

export default function Dashboard({ auth }) {
    const user = auth.user;
    const actions = actionsFor(user.role);

    if (!isInternalRole(user.role)) {
        // Customer: public layout, no sidebar.
        return (
            <PublicLayout auth={auth}>
                <Head title="Dashboard" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Customer</p>
                    <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                        Selamat datang, {user.name}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--color-muted)' }}>
                        Kelola pesanan Anda dan jelajahi katalog inovasi PNJ.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {actions.map((a) => (
                            <QuickAction key={a.title} {...a} />
                        ))}
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <DashboardLayout title="Dashboard" breadcrumb="PNJ Prime / Dashboard">
            <Head title="Dashboard" />
            <FadeIn>
                <Card className="mb-6 p-6 sm:p-8" style={{ background: 'var(--color-bg)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                        {roleLabel(user.role)}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                        Selamat datang, {user.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        Anda masuk ke PNJ Prime — kelola pengajuan, kurasi, transaksi, dan laporan dari satu tempat.
                    </p>
                </Card>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {actions.map((a) => (
                        <QuickAction key={a.title} {...a} />
                    ))}
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
