import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import PublicLayout from '@/Layouts/PublicLayout';
import StatusTimeline from '@/Components/StatusTimeline';
import { Card, ConfirmModal, DangerButton, PageHeader, SecondaryButton, StatusBadge } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { LAYANAN_FLOW, canBatalLayanan, canBayarLayanan, canUbahLayanan } from '@/lib/statuses';
import { mockPengajuan } from '@/mocks/data';

// TODO(backend): no pengajuan routes yet. Ubah/Batalkan/Bayar actions show a
// neutral notice; nothing is sent and no success is faked.
export default function PengajuanShow({ auth, item }) {
    const role = auth?.user?.role;
    const p = item ?? mockPengajuan[0];
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [notice, setNotice] = useState(null);

    return (
        <PublicLayout auth={auth}>
            <Head title={`${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                <a href={navHref('customer.pengajuan.index', {}, role)} className="group inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Kembali ke Pengajuan Saya
                </a>
                <div className="mt-2">
                    <PageHeader
                        eyebrow={p.code}
                        title={p.layanan}
                        desc={`${p.type === 'jasa' ? 'Jasa' : p.type === 'ruangan' ? 'Ruangan' : 'Produk'} · Diajukan ${p.date}`}
                        actions={<StatusBadge status={p.status} label={p.status} />}
                    />
                </div>
                <CustomerTabs active="pengajuan" role={role} />

                <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="p-6">
                        <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Status pengajuan</h2>
                        <div className="mt-4">
                            <StatusTimeline flow={LAYANAN_FLOW} history={p.history ?? []} current={p.status} />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Rincian</h2>
                        <dl className="mt-4 divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {[
                                ['Kode', p.code],
                                ['Tipe', p.type === 'jasa' ? 'Jasa' : p.type === 'ruangan' ? 'Ruangan' : 'Produk'],
                                ['Jumlah', p.qty ?? '-'],
                                ['Keperluan', p.need ?? '-'],
                                ...(p.total ? [['Total tagihan', `Rp ${Number(p.total).toLocaleString('id-ID')}`]] : []),
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                    <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                        {p.note && (
                            <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--color-danger-tint)', color: 'var(--color-danger)' }}>
                                <span className="font-semibold">Catatan RTPU: </span>{p.note}
                            </div>
                        )}
                        {notice && (
                            <p className="mt-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                {notice}
                            </p>
                        )}
                        <div className="mt-5 flex flex-wrap gap-2">
                            {canUbahLayanan(p.status) && (
                                <SecondaryButton href={navHref('customer.pengajuan.edit', { id: p.id }, role)}>
                                    Ubah
                                </SecondaryButton>
                            )}
                            {canBatalLayanan(p.status) && (
                                <DangerButton onClick={() => { setCancelReason(''); setCancelOpen(true); }}>
                                    Batalkan
                                </DangerButton>
                            )}
                            {canBayarLayanan(p.status) && (
                                <a href={navHref('customer.bayar', { id: p.id }, role)} className="inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98]" style={{ background: 'var(--color-accent)' }}>
                                    Bayar
                                </a>
                            )}
                        </div>
                    </Card>
                </div>

                <ConfirmModal
                    open={cancelOpen}
                    title="Batalkan pengajuan ini?"
                    desc="Pengajuan yang dibatalkan tidak dapat dilanjutkan. Alasan bersifat opsional."
                    confirmLabel="Ya, batalkan"
                    danger
                    onConfirm={() => {
                        setCancelOpen(false);
                        setNotice('Pembatalan belum tersedia. Backend perlu menyediakan endpoint pembatalan pengajuan.');
                    }}
                    onClose={() => setCancelOpen(false)}
                >
                    <div>
                        <label htmlFor="cancel-reason" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            Alasan (opsional)
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            placeholder="Tulis alasan pembatalan…"
                            className="block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none"
                            style={{ borderColor: 'var(--color-border)' }}
                        />
                    </div>
                </ConfirmModal>
            </div>
        </PublicLayout>
    );
}
