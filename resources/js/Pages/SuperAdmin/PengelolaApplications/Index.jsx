import { Head, router } from '@inertiajs/react';
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge, PrimaryButton, DangerButton } from '@/Components/ui';

export default function PengelolaApplicationsIndex({ auth, applications }) {
    const rows = applications?.data || (Array.isArray(applications) ? applications : []);
    const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);
    const selected = rows.find((a) => a.id === selectedId) ?? rows[0] ?? null;
    const [notes, setNotes] = useState('');

    const handleApprove = (appId) => {
        router.patch(route('superadmin.pengelola.approve', appId), { notes });
    };

    const handleReject = (appId) => {
        router.patch(route('superadmin.pengelola.reject', appId), { notes: notes || 'Permohonan tidak memenuhi syarat administrasi.' });
    };

    return (
        <DashboardLayout title="Pengajuan Akun Pengelola" breadcrumb="Super Admin / Pengajuan Pengelola" activeKey="users">
            <Head title="Verifikasi Pengelola · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Verifikasi Akun Pengelola Unit"
                    desc="Tinjau dan setujui permohonan staf / dosen untuk menjadi Admin Pengelola Unit Riset."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Tidak Ada Permohonan Akun"
                        desc="Belum ada permohonan pendaftaran akun pengelola baru saat ini."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Daftar Permohonan ({rows.length})
                            </h2>
                            <div className="space-y-2.5">
                                {rows.map((app) => {
                                    const isSelected = selected?.id === app.id;
                                    return (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => setSelectedId(app.id)}
                                            aria-pressed={isSelected}
                                            className="block w-full rounded-[6px] border p-4 text-left transition"
                                            style={
                                                isSelected
                                                    ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                                                    {app.unit_name}
                                                </span>
                                                <StatusBadge status={app.status} />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Pemohon: {app.user?.name ?? app.pic_name} ({app.user?.email})
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selected && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
                                    Detail Permohonan Pengelola
                                </h3>

                                <div className="space-y-3 text-sm mb-6">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Nama Unit / Jurusan</span>
                                        <span className="font-semibold text-slate-800">{selected.unit_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Nama PIC</span>
                                        <span className="font-semibold text-slate-800">{selected.pic_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Nomor Telepon</span>
                                        <span className="font-mono text-slate-800">{selected.pic_phone}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Status Saat Ini</span>
                                        <StatusBadge status={selected.status} />
                                    </div>
                                    {selected.sk_document_path && (
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-slate-500">Dokumen SK / Surat Tugas</span>
                                            <span className="text-emerald-600 font-medium">Terlampir</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                                        Catatan / Keterangan Persetujuan:
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Berikan catatan bila ada syarat tambahan..."
                                        rows={3}
                                        className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <PrimaryButton
                                        onClick={() => handleApprove(selected.id)}
                                        className="flex-1 justify-center"
                                    >
                                        <UserCheck className="w-4 h-4 mr-1.5" />
                                        Setujui Pengelola
                                    </PrimaryButton>
                                    <DangerButton
                                        onClick={() => handleReject(selected.id)}
                                        className="flex-1 justify-center"
                                    >
                                        <XCircle className="w-4 h-4 mr-1.5" />
                                        Tolak Permohonan
                                    </DangerButton>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
