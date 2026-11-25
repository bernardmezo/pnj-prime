import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { Check, X, Building2, Mail, Phone, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/Components/ConfirmDialog';

export default function VerifikasiAkun({ auth, pendingUsers = [] }) {
    const { confirm, ConfirmUI } = useConfirm();
    const [selectedId, setSelectedId] = useState(null);
    const selected = pendingUsers.find((user) => user.id === selectedId);
    const approvalRoute = auth.user.role === 'admin_rtpu' ? 'rtpu.verify.akun' : 'pimpinan.verify.akun';

    const handleApprove = async (id) => {
        const ok = await confirm({
            title: 'Setujui akun pengelola?',
            message: 'Akun akan diaktifkan dan pengelola dapat mulai mengajukan produk.',
            confirmLabel: 'Ya, Setujui',
        });
        if (ok) router.patch(route(`${approvalRoute}.approve`, id));
    };

    const handleReject = async (id) => {
        const ok = await confirm({
            title: 'Tolak akun pengelola ini?',
            message: 'Akun tidak akan diaktifkan. Tindakan ini tidak bisa dibatalkan.',
            danger: true,
            confirmLabel: 'Ya, Tolak',
        });
        if (ok) router.patch(route(`${approvalRoute}.reject`, id));
    };

    return (
        <>
        <DashboardLayout title="Verifikasi Akun Pengelola" activeKey="verify-akun">
            <Head title="Verifikasi Akun Pengelola · PNJ Prime" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                            Verifikasi Akun Pengelola Jurusan & P3M
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                            Setujui atau tolak permohonan pendaftaran akun staf internal yang masuk.
                        </p>
                    </div>
                </div>

                {selected && <button type="button" onClick={() => setSelectedId(null)} className="mb-4 text-sm font-semibold text-[var(--color-accent)] underline">Kembali ke antrean</button>}
                {pendingUsers.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: 'var(--color-border)' }}>
                        <UserCheck className="mx-auto h-12 w-12" style={{ color: 'var(--color-muted)' }} />
                        <h3 className="mt-4 font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                            Tidak ada antrean verifikasi akun
                        </h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                            Semua permohonan akun pengelola telah diproses.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {(selected ? [selected] : pendingUsers).map((u) => (
                            <div key={u.id} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                                                {u.name}
                                            </h3>
                                            <span className="rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                                                {u.role_label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                                            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> NIP: {u.nip || '-'}</span>
                                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {u.email}</span>
                                            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {u.phone || '-'}</span>
                                        </div>
                                        <div className="pt-1 text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
                                            Jurusan: <span style={{ color: 'var(--color-muted)' }}>{u.jurusan}</span> &bull; Prodi: <span style={{ color: 'var(--color-muted)' }}>{u.prodi}</span>
                                        </div>
                                    </div>
                                    {!selected ? <button type="button" onClick={() => setSelectedId(u.id)} className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">Lihat Detail &amp; Verifikasi</button> : <div className="flex items-center gap-3 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleReject(u.id)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        >
                                            <X className="h-4 w-4" /> Tolak
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(u.id)}
                                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                                            style={{ background: 'var(--color-accent)' }}
                                        >
                                            <Check className="h-4 w-4" /> Setujui (Acc)
                                        </button>
                                    </div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
        {ConfirmUI}
        </>
    );
}
