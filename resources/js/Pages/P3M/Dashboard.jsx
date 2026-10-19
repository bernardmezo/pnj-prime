import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Award, Clock, Eye, FilePlus2, History, XCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PengajuanProdukModal from '@/Components/PengajuanProdukModal';
import { Card, EmptyState, FadeIn, PageHeader, PrimaryButton, StatCard, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { canBatalProduk, canUbahProduk } from '@/lib/statuses';

export default function P3mDashboard({ auth, stats = {}, daftar = [] }) {
    const role = auth?.user?.role;
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Admin P3M / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Admin P3M · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title={`Selamat datang, ${auth?.user?.name ?? 'Admin P3M'}!`}
                    desc="Ringkasan pengajuan produk unggulan Anda."
                    actions={
                        <PrimaryButton onClick={() => setModalOpen(true)}>
                            <FilePlus2 className="h-4 w-4" />
                            Ajukan Produk Unggulan
                        </PrimaryButton>
                    }
                />

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Pengajuan" value={stats.total ?? 0} icon={Award} tone="teal" index={0} />
                    <StatCard label="Sedang Diproses" value={stats.diproses ?? 0} icon={Clock} tone="gold" index={1} />
                    <StatCard label="Disetujui" value={stats.disetujui ?? 0} icon={Eye} tone="teal" index={2} />
                    <StatCard label="Ditolak / Dibatalkan" value={stats.ditolak ?? 0} icon={XCircle} tone="danger" index={3} />
                </div>

                {/* Active pengajuan table */}
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Pengajuan Berjalan
                    </h2>
                    <a
                        href={navHref('p3m.riwayat', {}, role)}
                        className="flex items-center gap-1.5 text-sm font-medium transition"
                        style={{ color: 'var(--color-accent-hover)' }}
                    >
                        <History className="h-4 w-4" />
                        Lihat Riwayat
                    </a>
                </div>
                {daftar.length === 0 ? (
                    <EmptyState
                        icon={Award}
                        title="Belum ada pengajuan"
                        desc="Ajukan produk unggulan pertama Anda melalui tombol di atas."
                        action={
                            <PrimaryButton onClick={() => setModalOpen(true)}>
                                <FilePlus2 className="h-4 w-4" />
                                Ajukan Produk Unggulan
                            </PrimaryButton>
                        }
                    />
                ) : (
                    <Table columns={['Kode', 'Nama Produk', 'Kategori', 'Tanggal', 'Status', '']}>
                        <tbody>
                            {daftar.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td strong>{p.name}</Td>
                                    <Td>{p.category}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <a href={navHref('p3m.produk.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Detail
                                            </a>
                                            {canUbahProduk(p.status) && (
                                                <a href={navHref('p3m.produk.edit', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                    Ubah
                                                </a>
                                            )}
                                            {canBatalProduk(p.status) && (
                                                <a href={navHref('p3m.produk.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                    Batalkan
                                                </a>
                                            )}
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </FadeIn>

            <PengajuanProdukModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </DashboardLayout>
    );
}
