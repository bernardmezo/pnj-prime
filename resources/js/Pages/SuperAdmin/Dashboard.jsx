import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, StatRow, StatusDot, EmptyState } from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin_rtpu: 'Admin RTPU',
    admin_p3m: 'Admin P3M',
    pimpinan_rtpu: 'Pimpinan RTPU',
    direktur: 'Direktur',
    dosen: 'Dosen',
    mahasiswa: 'Mahasiswa',
    mitra: 'Mitra',
    umum: 'Umum',
};

export default function SuperAdminDashboard({ auth, stats = {}, recentUsers = [] }) {
    const role = auth?.user?.role;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return recentUsers;
        const q = searchQuery.toLowerCase();
        return (recentUsers ?? []).filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
        );
    }, [recentUsers, searchQuery]);

    const statItems = [
        {
            label: 'Total Pengguna',
            value: stats.total_users ?? 0,
        },
        {
            label: 'Pengguna Aktif',
            value: stats.active_users ?? 0,
        },
        {
            label: 'Akun Nonaktif',
            value: stats.inactive_users ?? 0,
            needsAction: (stats.inactive_users ?? 0) > 0,
        },
        {
            label: 'Modul Fitur Sistem',
            value: stats.total_fitur ?? 0,
        },
    ];

    const roleBreakdown = stats.role_breakdown || {};
    const roleEntries = Object.entries(roleBreakdown).filter(([_, count]) => count > 0);

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Dashboard · PNJ Prime" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <PageHeader title="Dashboard" />
                <Link
                    href={navHref('superadmin.users', {}, role)}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-accent)] self-start sm:self-auto"
                >
                    Kelola Semua Pengguna →
                </Link>
            </div>

            {/* Primary StatRow Panel */}
            <Panel className="mb-6 space-y-6">
                <StatRow stats={statItems} />

                {/* Plain text role breakdown (no chart) */}
                {roleEntries.length > 0 && (
                    <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-muted)]">
                        <span className="font-semibold text-[var(--color-ink)]">Distribusi Peran:</span>
                        {roleEntries.map(([rKey, count], idx) => (
                            <span key={rKey} className="inline-flex items-center gap-1.5">
                                <span>{ROLE_LABELS[rKey] ?? rKey}:</span>
                                <strong className="font-semibold text-[var(--color-ink)] tabular-nums">{count}</strong>
                                {idx < roleEntries.length - 1 && <span className="text-[var(--color-border)]">·</span>}
                            </span>
                        ))}
                    </div>
                )}
            </Panel>

            {/* Panel: Pengguna Terbaru */}
            <Panel className="!p-0 overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--color-ink)]">
                            Pengguna Terdaftar Terbaru
                        </h2>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            Akun pengguna yang baru didaftarkan ke dalam sistem
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, email, role..."
                            className="w-full rounded-xl border border-[var(--color-border)] bg-white py-1.5 px-3 text-xs placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <EmptyState message={searchQuery ? 'Tidak ada pengguna yang sesuai dengan filter pencarian.' : 'Belum ada pengguna terdaftar.'} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                    <th className="py-3 px-6">Pengguna</th>
                                    <th className="py-3 px-6">Peran (Role)</th>
                                    <th className="py-3 px-6">Status Akun</th>
                                    <th className="py-3 px-6">Terdaftar</th>
                                    <th className="py-3 px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filteredUsers.map((u) => {
                                    const isNonaktif = u.status === 'Nonaktif';
                                    return (
                                        <tr
                                            key={u.id}
                                            className={`relative h-[72px] transition-colors hover:bg-[var(--color-surface)] ${
                                                isNonaktif ? 'border-l-[3px] border-l-amber-500' : ''
                                            }`}
                                        >
                                            <td className="py-3 px-6">
                                                <div className="font-semibold text-[var(--color-ink)] text-sm">
                                                    {u.name}
                                                </div>
                                                <div className="text-xs text-[var(--color-muted)] font-normal">
                                                    {u.email}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-xs text-[var(--color-ink)]">
                                                {ROLE_LABELS[u.role] ?? u.role}
                                            </td>
                                            <td className="py-3 px-6">
                                                <StatusDot status={u.status} />
                                            </td>
                                            <td className="py-3 px-6 text-xs text-[var(--color-muted)] tabular-nums">
                                                {u.date ?? '-'}
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                <Link
                                                    href={navHref('superadmin.users', {}, role)}
                                                    className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                                                >
                                                    Kelola
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </DashboardLayout>
    );
}
