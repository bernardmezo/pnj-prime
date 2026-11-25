import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, StatRow, StatusDot, EmptyState } from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

export default function PimpinanDashboard({
    auth,
    stats = {},
    antrean = [],
    antreanAkun = [],
}) {
    const role = auth?.user?.role;
    const statItems = [
        {
            label: 'Produk',
            value: stats.produk ?? 0,
        },
        {
            label: 'Sewa',
            value: stats.sewa ?? 0,
        },
        {
            label: 'Layanan',
            value: stats.layanan ?? 0,
        },
        {
            label: 'Total Katalog',
            value: stats.total_katalog ?? 0,
        },
    ];

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Dashboard · PNJ Prime" />

            <div className="mb-6"><PageHeader title="Dashboard" /></div>

            {/* Primary StatRow Panel */}
            <Panel className="mb-6">
                <StatRow stats={statItems} />
                <p className="mt-4 text-xs text-muted">Jumlah item katalog aktif yang disetujui.</p>
            </Panel>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 items-start">
                {/* Antrean persetujuan produk katalog */}
                <Panel className="!p-0 overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                                    Antrean Persetujuan Final Produk
                                </h2>
                                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                                    Produk katalog yang menunggu persetujuan
                                </p>
                            </div>
                            <Link
                                href={navHref('pimpinan.verify.produk', {}, role)}
                                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                            >
                                Buka Semua Antrean →
                            </Link>
                        </div>

                        {antrean.length === 0 ? (
                            <EmptyState message="Tidak ada produk yang menunggu persetujuan." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                            <th className="py-3 px-6">Produk</th>
                                            <th className="py-3 px-6">Pemilik</th>
                                            <th className="py-3 px-6">Tanggal</th>
                                            <th className="py-3 px-6">Status</th>
                                            <th className="py-3 px-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {antrean.map((p) => (
                                            <tr key={p.id} className="h-[72px] transition-colors hover:bg-[var(--color-surface)] border-l-[3px] border-l-amber-500">
                                                <td className="py-3 px-6">
                                                    <div className="font-semibold text-[var(--color-ink)] text-sm">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-muted)] font-normal">
                                                        {p.code}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-xs text-[var(--color-ink)]">
                                                    {p.researcher || '-'}
                                                </td>
                                                <td className="py-3 px-6 text-xs text-[var(--color-muted)] tabular-nums">
                                                    {p.date}
                                                </td>
                                                <td className="py-3 px-6">
                                                    <StatusDot status={p.status} />
                                                </td>
                                                <td className="py-3 px-6 text-right">
                                                    <Link
                                                        href={navHref('pimpinan.verify.produk', {}, role)}
                                                        className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                                                    >
                                                        Tinjau
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Panel>

                <Panel className="!p-0 overflow-hidden">
                    <div className="p-6 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--color-ink)]">Antrean Verifikasi Akun Pengelola</h2>
                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">Akun yang menunggu verifikasi ({stats.akun_pending ?? 0})</p>
                        </div>
                        <Link href={navHref('pimpinan.verify.akun', {}, role)} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">Buka Semua Antrean →</Link>
                    </div>
                    {antreanAkun.length === 0 ? (
                        <EmptyState message="Tidak ada akun yang menunggu verifikasi." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead><tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"><th className="py-3 px-6">Nama</th><th className="py-3 px-6">Peran</th><th className="py-3 px-6">Tanggal</th><th className="py-3 px-6 text-right">Aksi</th></tr></thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {antreanAkun.map((akun) => (
                                        <tr key={akun.id} className="h-[72px] transition-colors hover:bg-[var(--color-surface)] border-l-[3px] border-l-amber-500">
                                            <td className="py-3 px-6 font-semibold text-[var(--color-ink)]">{akun.name}</td>
                                            <td className="py-3 px-6 text-xs text-[var(--color-ink)]">{akun.role}</td>
                                            <td className="py-3 px-6 text-xs text-[var(--color-muted)] tabular-nums">{akun.date}</td>
                                            <td className="py-3 px-6 text-right"><Link href={navHref('pimpinan.verify.akun', {}, role)} className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">Tinjau</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>
        </DashboardLayout>
    );
}