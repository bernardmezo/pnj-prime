import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, PrimaryButton } from '@/Components/ui';
import { ROLE_KEYS, roleLabel } from '@/lib/roles';
import { MATRIX_AKSI, mockFitur, mockPermissions } from '@/mocks/data';

// TODO(backend): no permission routes yet. Matrix edits are local state;
// "Simpan Perubahan" shows a neutral notice, nothing is sent.
export default function HakAkses({ auth, fitur, matriks }) {
    const rows = fitur ?? mockFitur;
    const [role, setRole] = useState('admin_rtpu');
    const [matrix, setMatrix] = useState(matriks ?? mockPermissions);
    const [notice, setNotice] = useState(null);

    const toggle = (fkey, aksi) => {
        setMatrix((m) => ({
            ...m,
            [role]: { ...m[role], [fkey]: { ...m[role]?.[fkey], [aksi]: !m[role]?.[fkey]?.[aksi] } },
        }));
    };

    return (
        <DashboardLayout title="Hak Akses" breadcrumb="Super Admin / Hak Akses" activeKey="hak">
            <Head title="Hak Akses · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Hak Akses"
                    desc="Pilih peran, lalu atur izin tiap fitur. Baris berasal dari daftar Kelola Fitur."
                    actions={
                        <PrimaryButton onClick={() => setNotice('Penyimpanan hak akses belum tersedia. Backend perlu menyediakan endpoint simpan matriks izin.')}>
                            Simpan Perubahan
                        </PrimaryButton>
                    }
                />
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Peran:</span>
                    {ROLE_KEYS.map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setRole(k)}
                            aria-pressed={role === k}
                            className="rounded-full border px-4 py-1.5 text-[13px] font-medium transition"
                            style={
                                role === k
                                    ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                                    : { background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }
                            }
                        >
                            {roleLabel(k)}
                        </button>
                    ))}
                </div>
                {notice && (
                    <p className="mb-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                        {notice}
                    </p>
                )}
                <Card className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr style={{ background: 'var(--color-surface)' }}>
                                <th className="sticky left-0 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)', background: 'var(--color-surface)' }}>
                                    Fitur
                                </th>
                                {MATRIX_AKSI.map((a) => (
                                    <th key={a} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                                        {a}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((f) => (
                                <tr key={f.key} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <td className="sticky left-0 border-t px-6 py-3 font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}>
                                        {f.name}
                                    </td>
                                    {MATRIX_AKSI.map((a) => (
                                        <td key={a} className="border-t px-4 py-3 text-center" style={{ borderColor: 'var(--color-border)' }}>
                                            <input
                                                type="checkbox"
                                                aria-label={`${f.name}: ${a} untuk ${roleLabel(role)}`}
                                                checked={Boolean(matrix[role]?.[f.key]?.[a])}
                                                onChange={() => toggle(f.key, a)}
                                                className="h-4 w-4 rounded"
                                                style={{ accentColor: 'var(--color-accent)' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </FadeIn>
        </DashboardLayout>
    );
}
