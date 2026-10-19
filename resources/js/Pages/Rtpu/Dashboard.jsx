import { Head } from '@inertiajs/react';
import { Activity, ClipboardCheck, History, Package, Wallet } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatCard, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function RtpuDashboard({ auth, stats = {}, recentPengajuan = [] }) {
    const role = auth?.user?.role;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Admin RTPU / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Admin RTPU · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title={`Selamat datang, ${auth?.user?.name ?? 'Admin RTPU'}!`}
                    desc="Ringkasan aktivitas layanan dan verifikasi."
                />

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Menunggu Verifikasi" value={stats.menunggu_verifikasi ?? 0} icon={ClipboardCheck} tone="gold" index={0} />
                    <StatCard label="Menunggu Pembayaran" value={stats.menunggu_pembayaran ?? 0} icon={Wallet} tone="gold" index={1} />
                    <StatCard label="Sedang Diproses" value={stats.diproses ?? 0} icon={Activity} tone="teal" index={2} />
                    <StatCard label="Total Layanan" value={stats.total_layanan ?? 0} icon={Package} tone="teal" index={3} />
                </div>

                {/* Quick links */}
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Verifikasi Pengajuan', page: 'rtpu.verify.layanan', icon: ClipboardCheck, desc: 'Tinjau pengajuan baru' },
                        { label: 'Verifikasi Pembayaran', page: 'rtpu.verify.bayar', icon: Wallet, desc: 'Periksa bukti bayar' },
                        { label: 'Status Layanan', page: 'rtpu.status', icon: Activity, desc: 'Perbarui status' },
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

                {/* Recent pengajuan */}
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Pengajuan Terbaru
                    </h2>
                    <a
                        href={navHref('rtpu.riwayat', {}, role)}
                        className="flex items-center gap-1.5 text-sm font-medium transition"
                        style={{ color: 'var(--color-accent-hover)' }}
                    >
                        <History className="h-4 w-4" />
                        Lihat Riwayat
                    </a>
                </div>
                <Table columns={['Kode', 'Customer', 'Layanan', 'Tanggal', 'Status']}>
                    <tbody>
                        {(recentPengajuan ?? []).map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td>{p.customer}</Td>
                                <Td strong>{p.layanan}</Td>
                                <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                <Td><StatusBadge status={p.status} label={p.status} /></Td>
                            </tr>
                        ))}
                        {(recentPengajuan ?? []).length === 0 && (
                            <tr>
                                <Td colSpan={5}>
                                    <span className="block py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Belum ada pengajuan.</span>
                                </Td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}
