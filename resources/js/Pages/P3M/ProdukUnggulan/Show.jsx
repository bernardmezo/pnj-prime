import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StatusTimeline from '@/Components/StatusTimeline';
import { Card, ConfirmModal, DangerButton, FadeIn, PageHeader, SecondaryButton, StatusBadge } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { PRODUK_FLOW, canBatalProduk, canUbahProduk } from '@/lib/statuses';
import { mockProdukUnggulan } from '@/mocks/data';

// TODO(backend): no produk-unggulan routes yet. Ubah navigates to the edit
// preview; Batalkan shows a neutral notice, nothing is sent.
export default function ProdukShow({ auth, item }) {
    const role = auth?.user?.role;
    const p = item ?? mockProdukUnggulan[0];
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [notice, setNotice] = useState(null);

    return (
        <DashboardLayout title="Detail Produk Unggulan" breadcrumb="Admin P3M / Pemantauan / Detail" activeKey="pantau">
            <Head title={`${p.code} · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow={p.code}
                    title={p.name}
                    desc={`${p.category} · Diajukan ${p.date}`}
                    actions={<StatusBadge status={p.status} label={p.status} />}
                />
                <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="p-6">
                        <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Status pengajuan</h2>
                        <div className="mt-4">
                            <StatusTimeline flow={PRODUK_FLOW} history={p.history ?? []} current={p.status} />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Rincian</h2>
                        <dl className="mt-4 divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {[
                                ['Peneliti utama', p.researcher ?? '-'],
                                ['Tim', p.team ?? '-'],
                                ['Kategori', p.category ?? '-'],
                                ['Usulan harga', p.price ? `Rp ${Number(p.price).toLocaleString('id-ID')}` : '-'],
                                ['Deskripsi', p.desc ?? '-'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                    <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                        {(p.documents ?? []).length > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Dokumen pendukung</p>
                                <ul className="space-y-1.5">
                                    {p.documents.map((d, i) => (
                                        <li key={i} className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--color-surface)' }}>
                                            <span style={{ color: 'var(--color-ink)' }}>{d.name}</span>
                                            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{d.size}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {p.note && (
                            <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--color-danger-tint)', color: 'var(--color-danger)' }}>
                                <span className="font-semibold">Catatan Pimpinan RTPU: </span>{p.note}
                            </div>
                        )}
                        {notice && (
                            <p className="mt-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                {notice}
                            </p>
                        )}
                        <div className="mt-5 flex flex-wrap gap-2">
                            {canUbahProduk(p.status) && (
                                <SecondaryButton href={navHref('p3m.produk.edit', { id: p.id }, role)}>
                                    Ubah
                                </SecondaryButton>
                            )}
                            {canBatalProduk(p.status) && (
                                <DangerButton onClick={() => { setCancelReason(''); setCancelOpen(true); }}>
                                    Batalkan
                                </DangerButton>
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
                        setNotice('Pembatalan belum tersedia. Backend perlu menyediakan endpoint pembatalan produk unggulan.');
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
            </FadeIn>
        </DashboardLayout>
    );
}
