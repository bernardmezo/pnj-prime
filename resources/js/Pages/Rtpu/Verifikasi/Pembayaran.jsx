import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const CHECKLIST = [
    'Nominal transfer sesuai tagihan',
    'Nama pengirim / nomor rekening terbaca',
    'Tanggal transfer masuk akal',
    'Kode pengajuan tercantum pada berita transfer',
];

export default function VerifikasiPembayaran({ auth, antrean = [], selected = null }) {
    const rows = antrean;
    const [selId, setSelId] = useState(selected?.id ?? rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;

    return (
        <DashboardLayout title="Verifikasi Pembayaran" breadcrumb="Admin RTPU / Verifikasi Pembayaran" activeKey="verify-bayar">
            <Head title="Verifikasi Pembayaran · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Daftar & Verifikasi Pembayaran"
                    desc="Daftar pembayaran online Midtrans dan verifikasi bukti transfer manual."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        title="Belum Ada Riwayat Pembayaran"
                        desc="Belum ada transaksi pembayaran online atau bukti transfer yang masuk."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        {/* Transaction List */}
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Semua Transaksi Pembayaran ({rows.length})
                            </h2>
                            <div className="space-y-2.5">
                                {rows.map((p) => {
                                    const isSelected = sel?.id === p.id;
                                    const dotColor =
                                        p.raw_status === 'paid' || p.raw_status === 'verified'
                                            ? 'var(--color-accent)'
                                            : p.raw_status === 'failed' || p.raw_status === 'expired' || p.raw_status === 'rejected'
                                            ? 'var(--color-danger)'
                                            : 'var(--color-gold)';

                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelId(p.id)}
                                            aria-pressed={isSelected}
                                            className="block w-full rounded-xl border p-4 text-left transition"
                                            style={
                                                isSelected
                                                    ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
                                                    {p.code}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink)]">
                                                    <span
                                                        className="h-2 w-2 rounded-full inline-block"
                                                        style={{ background: dotColor }}
                                                        aria-hidden
                                                    />
                                                    <span>{p.status}</span>
                                                </span>
                                            </div>
                                            <span className="mt-1 block text-sm font-bold tabular-nums" style={{ color: 'var(--color-ink)' }}>
                                                Rp {Number(p.amount ?? 0).toLocaleString('id-ID')}
                                            </span>
                                            <span className="block text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                                {p.customer} · {p.method}
                                            </span>
                                            <span className="block text-[11px] mt-0.5 text-[var(--color-muted)]">
                                                {p.at}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Transaction Detail Panel */}
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Rincian Pembayaran
                            </h2>
                            {!sel ? (
                                <Card className="flex flex-col items-center justify-center p-12 text-center text-sm text-[var(--color-muted)]">
                                    Pilih salah satu transaksi dari daftar untuk meninjau.
                                </Card>
                            ) : (
                                <Card className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                                                {sel.is_midtrans ? 'Midtrans Online Payment' : 'Transfer Manual'}
                                            </span>
                                            <h2 className="font-sans text-2xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--color-ink)' }}>
                                                Rp {Number(sel.amount ?? 0).toLocaleString('id-ID')}
                                            </h2>
                                        </div>
                                        {sel.request_url && (
                                            <Link
                                                href={sel.request_url}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                                            >
                                                <span>Lihat Pengajuan</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>

                                    {/* Definition list */}
                                    <dl className="mt-5 divide-y divide-[var(--color-border)] border-t border-b border-[var(--color-border)] text-xs text-[var(--color-ink)]">
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Nomor / Order ID</dt>
                                            <dd className="font-mono font-medium text-[var(--color-ink)]">{sel.order_id}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Pemohon</dt>
                                            <dd className="font-medium text-[var(--color-ink)]">{sel.customer}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Layanan</dt>
                                            <dd className="text-[var(--color-ink)]">{sel.layanan}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Metode</dt>
                                            <dd className="font-medium text-[var(--color-ink)]">{sel.method}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Status</dt>
                                            <dd className="font-medium text-[var(--color-ink)]">{sel.status}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Waktu Bayar</dt>
                                            <dd className="tabular-nums text-[var(--color-ink)]">{sel.paid_at || '-'}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-[var(--color-muted)]">Waktu Dibuat</dt>
                                            <dd className="tabular-nums text-[var(--color-ink)]">{sel.at}</dd>
                                        </div>
                                    </dl>

                                    {/* Action depending on type */}
                                    {sel.is_midtrans ? (
                                        <div className="mt-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-xs text-[var(--color-muted)]">
                                            <p className="font-semibold text-[var(--color-ink)]">Verifikasi Otomatis</p>
                                            <p className="mt-1">
                                                Status pembayaran ini dikonfirmasi dan diverifikasi secara langsung oleh webhook Midtrans. Tidak diperlukan verifikasi manual.
                                            </p>
                                        </div>
                                    ) : (sel.can_verify !== false && (sel.can_verify || sel.status === 'Menunggu Verifikasi Pembayaran')) ? (
                                        <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                            <div className="mb-4 rounded-xl border border-[var(--color-border)] p-4 text-center">
                                                <p className="text-xs text-[var(--color-muted)] mb-1">Bukti Transfer Pemohon</p>
                                                {sel.proof ? (
                                                    <a
                                                        href={sel.proof}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <span>Buka Dokumen Bukti Transfer</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-[var(--color-muted)]">Tidak ada berkas.</span>
                                                )}
                                            </div>
                                            <ReviewPanel
                                                title="Panel peninjau"
                                                checklist={CHECKLIST}
                                                approveLabel="Terima"
                                                onApprove={() => {
                                                    router.patch(route('rtpu.verify.bayar.accept', sel.db_id ?? sel.id));
                                                    return null;
                                                }}
                                                onReject={(catatan) => {
                                                    router.patch(route('rtpu.verify.bayar.reject', sel.db_id ?? sel.id), { catatan });
                                                    return null;
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-xs text-[var(--color-muted)]">
                                            <p className="font-semibold text-[var(--color-ink)]">Status Bukti Manual: {sel.status}</p>
                                            <p className="mt-1">
                                                Bukti transfer manual ini sudah diproses dan diverifikasi.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
