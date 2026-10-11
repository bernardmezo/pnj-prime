import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StatusTimeline from '@/Components/StatusTimeline';
import { Card, FadeIn, Field, PageHeader, PrimaryButton, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';
import { LAYANAN_FLOW, NEXT_STATUS } from '@/lib/statuses';
import { mockPengajuan } from '@/mocks/data';

// TODO(backend): no status-update route yet. "Perbarui Status" shows a
// neutral notice; nothing is sent and no success is faked.
export default function StatusLayanan({ auth, daftar }) {
    const rows = daftar ?? mockPengajuan.filter((p) => !['Selesai', 'Dibatalkan'].includes(p.status));
    const [selId, setSelId] = useState(rows[0]?.id ?? null);
    const [next, setNext] = useState('');
    const [note, setNote] = useState('');
    const [done, setDone] = useState(null);
    const sel = rows.find((r) => r.id === selId) ?? null;
    const options = sel ? NEXT_STATUS[sel.status] ?? [] : [];

    return (
        <DashboardLayout title="Status Layanan" breadcrumb="Admin RTPU / Status Layanan" activeKey="status">
            <Head title="Status Layanan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Perbarui Status Layanan"
                    desc="Pilih pengajuan aktif, lalu majukan ke status berikutnya yang valid."
                />
                <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="p-6">
                        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                            Pengajuan aktif ({rows.length})
                        </h2>
                        <div className="space-y-2">
                            {rows.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => { setSelId(p.id); setNext(''); setNote(''); setDone(null); }}
                                    aria-pressed={sel?.id === p.id}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition"
                                    style={
                                        sel?.id === p.id
                                            ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                            : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                    }
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{p.layanan}</span>
                                        <span className="block font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{p.code} · {p.customer}</span>
                                    </span>
                                    <StatusBadge status={p.status} label={p.status} />
                                </button>
                            ))}
                        </div>
                    </Card>
                    <Card className="p-6">
                        {!sel ? (
                            <p className="py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                Pilih pengajuan untuk melihat alur statusnya.
                            </p>
                        ) : (
                            <>
                                <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                                    {sel.code}
                                </h2>
                                <div className="mt-4">
                                    <StatusTimeline flow={LAYANAN_FLOW} history={sel.history ?? []} current={sel.status} />
                                </div>
                                <div className="mt-5 space-y-3 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <Field label="Status berikutnya">
                                        <select value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} {...inputStyleProps()}>
                                            <option value="">Pilih status…</option>
                                            {options.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Catatan (opsional)">
                                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan untuk pemohon…" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    {done && (
                                        <p className="rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                            {done}
                                        </p>
                                    )}
                                    <PrimaryButton
                                        disabled={!next}
                                        onClick={() => setDone('Pembaruan status belum tersedia. Backend perlu menyediakan endpoint update status layanan.')}
                                    >
                                        Perbarui Status
                                    </PrimaryButton>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
