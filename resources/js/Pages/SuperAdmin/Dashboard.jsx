import { Head } from '@inertiajs/react';
import { KeyRound, LayoutGrid, Shield, Users } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatCard } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function SuperAdminDashboard({ auth, stats = {} }) {
    const role = auth?.user?.role;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Super Admin / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Super Admin · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title={`Selamat datang, ${auth?.user?.name ?? 'Super Admin'}!`}
                    desc="Kelola pengguna, hak akses, dan fitur aplikasi."
                />

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Total Pengguna" value={stats.total_users ?? 0} icon={Users} tone="teal" index={0} />
                    <StatCard label="Pengguna Aktif" value={stats.active_users ?? 0} icon={Shield} tone="teal" index={1} />
                    <StatCard label="Total Fitur" value={stats.total_fitur ?? 0} icon={LayoutGrid} tone="gold" index={2} />
                </div>

                {/* Quick links */}
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Kelola User', page: 'superadmin.users', icon: Users, desc: 'Tambah, ubah, hapus pengguna' },
                        { label: 'Hak Akses', page: 'superadmin.hakakses', icon: KeyRound, desc: 'Atur hak akses per role' },
                        { label: 'Kelola Fitur', page: 'superadmin.fitur', icon: LayoutGrid, desc: 'Aktifkan atau nonaktifkan fitur' },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <a
                                key={item.page}
                                href={navHref(item.page, {}, role)}
                                className="group flex items-center gap-4 rounded-[18px] border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{item.label}</span>
                                    <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>{item.desc}</span>
                                </span>
                            </a>
                        );
                    })}
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
