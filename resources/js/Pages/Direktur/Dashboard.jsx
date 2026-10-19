import { Head } from '@inertiajs/react';
import { Award, Eye, History, Package } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatCard, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function DirekturDashboard({ auth, stats = {}, recentProduk = [], recentLayanan = [] }) {
    const role = auth?.user?.role;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Direktur / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Direktur · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Direktur"
                    title={`Selamat datang, ${auth?.user?.name ?? 'Direktur'}!`}
                    desc="Ringkasan pemantauan produk unggulan dan layanan."
                />

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Produk Unggulan" value={stats.total_produk ?? 0} icon={Award} tone="teal" index={0} />
                    <StatCard label="Produk Disetujui" value={stats.produk_disetujui ?? 0} icon={Award} tone="teal" index={1} />
                    <StatCard label="Total Layanan" value={stats.total_layanan ?? 0} icon={Package} tone="teal" index={2} />
                    <StatCard label="Layanan Aktif" value={stats.layanan_aktif ?? 0} icon={Eye} tone="gold" index={3} />
                </div>

                {/* Quick links */}
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {[
                        { label: 'Pemantauan', page: 'direktur.monitor', icon: Eye, desc: 'Pantau produk unggulan & layanan' },
                        { label: 'Riwayat', page: 'direktur.riwayat', icon: History, desc: 'Lihat seluruh riwayat' },
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

                {/* Recent produk unggulan */}
                <div className="mb-2">
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Produk Unggulan Terbaru
                    </h2>
                </div>
                <Table columns={['Kode', 'Nama Produk', 'Peneliti', 'Tanggal', 'Status']}>
                    <tbody>
                        {(recentProduk ?? []).map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td strong>{p.name}</Td>
                                <Td>{p.researcher}</Td>
                                <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                <Td><StatusBadge status={p.status} label={p.status} /></Td>
                            </tr>
                        ))}
                        {(recentProduk ?? []).length === 0 && (
                            <tr>
                                <Td colSpan={5}>
                                    <span className="block py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Belum ada data.</span>
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}
