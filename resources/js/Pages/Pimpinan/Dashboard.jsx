import { Head } from '@inertiajs/react';
import { Award, ClipboardCheck, Eye, History } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatCard, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function PimpinanDashboard({ auth, stats = {}, antrean = [] }) {
    const role = auth?.user?.role;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Pimpinan RTPU / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Pimpinan RTPU · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title={`Selamat datang, ${auth?.user?.name ?? 'Pimpinan RTPU'}!`}
                    desc="Ringkasan verifikasi produk unggulan."
                />

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Menunggu Verifikasi" value={stats.menunggu ?? 0} icon={ClipboardCheck} tone="gold" index={0} />
                    <StatCard label="Disetujui" value={stats.disetujui ?? 0} icon={Award} tone="teal" index={1} />
                    <StatCard label="Ditolak" value={stats.ditolak ?? 0} icon={Eye} tone="danger" index={2} />
                </div>

                {/* Quick links */}
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {[
                        { label: 'Verifikasi Produk Unggulan', page: 'pimpinan.verify', icon: ClipboardCheck, desc: 'Tinjau dan setujui produk' },
                        { label: 'Pemantauan', page: 'pimpinan.monitor', icon: Eye, desc: 'Pantau semua pengajuan' },
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

                {/* Antrean verifikasi */}
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Antrean Verifikasi
                    </h2>
                    <a
                        href={navHref('pimpinan.riwayat', {}, role)}
                        className="flex items-center gap-1.5 text-sm font-medium transition"
                        style={{ color: 'var(--color-accent-hover)' }}
                    >
                        <History className="h-4 w-4" />
                        Lihat Riwayat
                    </a>
                </div>
                <Table columns={['Kode', 'Nama Produk', 'Peneliti', 'Tanggal', 'Status']}>
                    <tbody>
                        {(antrean ?? []).map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td strong>{p.name}</Td>
                                <Td>{p.researcher}</Td>
                                <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                <Td><StatusBadge status={p.status} label={p.status} /></Td>
                            </tr>
                        ))}
                        {(antrean ?? []).length === 0 && (
                            <tr>
                                <Td colSpan={5}>
                                    <span className="block py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Antrean kosong.</span>
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}
