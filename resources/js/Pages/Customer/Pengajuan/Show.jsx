import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { ConfirmModal } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { LAYANAN_FLOW, canBatalLayanan, canBayarLayanan, canUbahLayanan, toneForStatus } from '@/lib/statuses';

const STATUS_HINT = {
    Diajukan: 'Menunggu peninjauan dan konfirmasi dari Admin RTPU.',
    'Menunggu Pembayaran': 'Menunggu Anda melakukan pembayaran tagihan.',
    'Menunggu Verifikasi Pembayaran': 'Pembayaran sedang diverifikasi oleh staf keuangan.',
    Diproses: 'Layanan sedang dikerjakan atau disiapkan oleh tim terkait.',
    Selesai: 'Layanan telah selesai dan dapat dimanfaatkan sepenuhnya.',
    Ditolak: 'Permohonan ditolak oleh RTPU. Periksa catatan alasan.',
    Dibatalkan: 'Pengajuan telah dibatalkan.',
};

function statusDotColor(status) {
    const t = toneForStatus(status);
    if (t === 'teal') return 'var(--color-accent)';
    if (t === 'danger') return 'var(--color-danger)';
    if (t === 'gold') return 'var(--color-gold)';
    return '#94a3b8';
}

export default function PengajuanShow({ auth, item }) {
    const role = auth?.user?.role;
    const p = item;
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!p) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Detail Pengajuan · PNJ Prime" />
                <div className="mx-auto w-full max-w-[880px] px-4 py-10 sm:px-6">
                    <p className="text-sm text-slate-500">Pengajuan tidak ditemukan.</p>
                </div>
            </PublicLayout>
        );
    }

    const typeLabel = p.type === 'jasa' ? 'Jasa' : p.type === 'ruangan' ? 'Ruangan' : 'Produk';
    const flowIdx = LAYANAN_FLOW.indexOf(p.status);
    const historyList = p.history ?? [];

    // Filter definition list rows to hide empty values
    const detailRows = [
        ['Tipe', typeLabel],
        ...(p.qty ? [['Jumlah', p.qty]] : []),
        ...(p.need ? [['Keperluan', p.need]] : []),
        ...(p.date ? [['Tanggal Diharapkan', p.date]] : []),
        ...(p.total ? [['Total tagihan', `Rp ${Number(p.total).toLocaleString('id-ID')}`]] : []),
    ];

    return (
        <PublicLayout auth={auth}>
            <Head title={`${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6">
                {/* Header: text link back to Pengajuan Saya */}
                <div>
                    <a
                        href={navHref('customer.pengajuan.index', {}, role)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Pengajuan Saya</span>
                    </a>
                </div>

                {/* Title area with status dot */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {p.layanan}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            {p.code} · {typeLabel} · Diajukan {p.date}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: statusDotColor(p.status) }}
                            aria-hidden
                        />
                        <span>{p.status}</span>
                    </div>
                </div>

                {/* Single Column Content */}
                <div className="mt-8 space-y-8">
                    {/* 1) Status Timeline: vertical rail with thin line and small dots */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Status</h2>
                        <ol className="relative ml-2 mt-4 border-l border-slate-200 pl-5">
                            {LAYANAN_FLOW.map((s, i) => {
                                const isCurrent = s === p.status;
                                const isDone = flowIdx >= 0 ? i <= flowIdx : false;
                                const isFuture = flowIdx >= 0 ? i > flowIdx : true;
                                const h = historyList.find((x) => x.status === s);

                                return (
                                    <li key={s} className="relative pb-6 last:pb-0">
                                        <span
                                            aria-hidden
                                            className="absolute -left-[25px] top-1 h-2 w-2 rounded-full"
                                            style={{
                                                background: isCurrent
                                                    ? 'var(--color-accent)'
                                                    : isDone
                                                      ? 'var(--color-accent)'
                                                      : '#cbd5e1',
                                            }}
                                        />
                                        <div>
                                            <p
                                                className={`text-sm ${
                                                    isCurrent
                                                        ? 'font-bold text-slate-900'
                                                        : isDone
                                                          ? 'font-medium text-slate-600'
                                                          : 'text-slate-400'
                                                }`}
                                            >
                                                {s}
                                            </p>

                                            {/* Date/time of step */}
                                            {h?.at && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {h.at}{h.by ? ` · ${h.by}` : ''}
                                                </p>
                                            )}

                                            {/* Explanation sentence under current active step */}
                                            {isCurrent && STATUS_HINT[p.status] && (
                                                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                                    {STATUS_HINT[p.status]}
                                                </p>
                                            )}

                                            {/* Admin note if attached */}
                                            {h?.note && (
                                                <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2">
                                                    {h.note}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    {/* RTPU Note banner if rejected or special note outside history */}
                    {p.note && (
                        <div className="rounded-[6px] border border-red-200 bg-red-50/60 p-3.5 text-xs text-red-900">
                            <span className="font-semibold">Catatan RTPU: </span>{p.note}
                        </div>
                    )}

                    {/* 2) Rincian: Simple definition list with thin dividers */}
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Rincian</h2>
                        <dl className="mt-3 divide-y divide-slate-200 border-t border-b border-slate-200">
                            {detailRows.map(([label, value], idx) => {
                                const isTotal = label === 'Total tagihan';
                                return (
                                    <div
                                        key={label}
                                        className={`flex items-center justify-between py-3 text-sm ${
                                            isTotal ? 'font-semibold text-slate-900' : 'text-slate-700'
                                        }`}
                                    >
                                        <dt className={isTotal ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                                            {label}
                                        </dt>
                                        <dd className={`text-right tabular-nums ${isTotal ? 'text-base font-bold text-slate-900' : ''}`}>
                                            {value}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>

                    {/* Actions: Ubah as quiet secondary, Batalkan as plain red text link placed apart */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3">
                            {canBayarLayanan(p.status) && (
                                <a
                                    href={navHref('customer.bayar', { id: p.id }, role)}
                                    className="rounded-[6px] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
                                >
                                    Bayar
                                </a>
                            )}
                            {canUbahLayanan(p.status) && (
                                <Link
                                    href={navHref('customer.pengajuan.edit', { id: p.id }, role)}
                                    className="rounded-[6px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                                >
                                    Ubah
                                </Link>
                            )}
                        </div>

                        {canBatalLayanan(p.status) && (
                            <button
                                type="button"
                                onClick={() => { setCancelReason(''); setCancelOpen(true); }}
                                className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition"
                            >
                                Batalkan
                            </button>
                        )}
                    </div>
                </div>

                {/* Cancel Confirmation Modal */}
                <ConfirmModal
                    open={cancelOpen}
                    title="Batalkan pengajuan ini?"
                    desc="Pengajuan yang dibatalkan tidak dapat dilanjutkan. Alasan bersifat opsional."
                    confirmLabel="Ya, batalkan"
                    danger
                    processing={processing}
                    onConfirm={() => {
                        setProcessing(true);
                        router.patch(route('customer.pengajuan.cancel', p.id), { alasan: cancelReason }, {
                            onFinish: () => { setProcessing(false); setCancelOpen(false); },
                        });
                    }}
                    onClose={() => setCancelOpen(false)}
                >
                    <div className="mt-2">
                        <label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-medium text-slate-700">
                            Alasan (opsional)
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            placeholder="Tulis alasan pembatalan…"
                            className="block w-full rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                    </div>
                </ConfirmModal>
            </div>
        </PublicLayout>
    );
}
