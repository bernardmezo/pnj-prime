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
    Lunas: 'Pembayaran telah diterima. Menunggu pemilik produk menyiapkan pesanan.',
    Diproses: 'Pesanan sedang ditindaklanjuti pemilik produk. Periksa informasi pengiriman atau pengambilan.',
    Selesai: 'Layanan telah selesai dan dapat dimanfaatkan sepenuhnya.',
    Ditolak: 'Permohonan ditolak oleh RTPU. Periksa catatan alasan.',
    Dibatalkan: 'Pengajuan telah dibatalkan.',
};

function statusDotColor(status) {
    const t = toneForStatus(status);
    if (t === 'teal') return 'var(--color-accent)';
    if (t === 'danger') return 'var(--color-danger)';
    if (t === 'gold') return 'var(--color-gold)';
    return 'var(--color-muted)';
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
                    <p className="text-sm text-[var(--color-muted)]">Pengajuan tidak ditemukan.</p>
                </div>
            </PublicLayout>
        );
    }

    const typeLabel = p.type === 'jasa' ? 'Jasa' : p.type === 'ruangan' ? 'Ruangan' : 'Produk';
    const isPickup = /ambil/i.test(p.metode_pengambilan || '');
    const flow = ['Diajukan', 'Menunggu Pembayaran', ...(p.status === 'Menunggu Verifikasi Pembayaran' || (p.history ?? []).some((h) => h.status === 'Menunggu Verifikasi Pembayaran') ? ['Menunggu Verifikasi Pembayaran'] : []), 'Lunas', 'Diproses', 'Selesai'];
    const flowIdx = flow.indexOf(p.status);
    const stepLabel = (status) => status === 'Lunas' ? 'Pembayaran lunas' : status === 'Diproses' ? (isPickup ? 'Penyiapan / pengambilan di PNJ' : 'Penyiapan / pengiriman') : status === 'Selesai' ? 'Selesai — barang diterima' : status;

    const historyList = p.history ?? [];

    // Filter definition list rows to hide empty values
    const detailRows = [
        ['Tipe', typeLabel],
        ['Pengiriman / pengambilan', p.metode_pengambilan || 'Belum diisi'],
        ...(p.qty ? [['Jumlah', p.qty]] : []),
        ...(p.need ? [['Keperluan', p.need]] : []),
        ...(p.date ? [['Tanggal Diharapkan', p.date]] : []),
        ...(p.total ? [['Total tagihan', `Rp ${Number(p.total).toLocaleString('id-ID')}`]] : []),
        ...(p.payment_method ? [['Metode Pembayaran', p.payment_method]] : []),
        ...(p.paid_at ? [['Waktu Pembayaran', p.paid_at]] : []),
    ];

    return (
        <PublicLayout auth={auth}>
            <Head title={`${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6">
                {/* Header: text link back to Pengajuan Saya */}
                <div>
                    <a
                        href={navHref('customer.pengajuan.index', {}, role)}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Pengajuan Saya</span>
                    </a>
                </div>

                {/* Title area with status dot */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                            {p.layanan}
                        </h1>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                            {p.code} · {typeLabel} · Diajukan {p.date}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
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
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                        <div className="mb-5 rounded-2xl bg-[var(--color-accent-tint)] p-4" role="status">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Posisi pesanan saat ini</p>
                            <h2 className="mt-1 font-display text-lg font-bold text-[var(--color-ink)]">{stepLabel(p.status)}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{STATUS_HINT[p.status]}</p>
                            {isPickup && <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">Jam pengambilan PNJ: 08.00–16.00 WIB. Tunggu pemberitahuan barang siap sebelum datang.</p>}
                        </div>
                        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Tahapan pesanan</h2>
                        <ol className="relative ml-2 mt-4 border-l border-[var(--color-border)] pl-5">
                            {flow.map((s, i) => {
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
                                                      : 'var(--color-border)',
                                            }}
                                        />
                                        <div>
                                            <p
                                                className={`text-sm ${
                                                    isCurrent
                                                        ? 'font-bold text-[var(--color-ink)]'
                                                        : isDone
                                                          ? 'font-medium text-[var(--color-muted)]'
                                                          : 'text-[var(--color-muted)]'
                                                }`}
                                            >
                                                {stepLabel(s)}
                                            </p>

                                            <p className="mt-1 text-[11px] font-semibold text-[var(--color-accent)]">{isCurrent ? 'Tahap saat ini' : isDone ? 'Sudah dilalui' : 'Belum dimulai'}</p>
                                            {/* Date/time of step */}
                                            {h?.at && (
                                                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                                                    {h.at}{h.by ? ` · ${h.by}` : ''}
                                                </p>
                                            )}

                                            {/* Explanation sentence under current active step */}
                                            {isCurrent && STATUS_HINT[p.status] && (
                                                <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
                                                    {STATUS_HINT[p.status]}
                                                </p>
                                            )}

                                            {/* Admin note if attached */}
                                            {h?.note && (
                                                <p className="mt-1.5 text-xs text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
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
                    {p.note && ['Ditolak', 'Dibatalkan'].includes(p.status) && (
                        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 text-xs text-red-900">
                            <span className="font-semibold">Catatan RTPU: </span>{p.note}
                        </div>
                    )}

                    {p.invoice && <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                        <h2 className="font-display text-lg font-bold">Invoice pembayaran penuh</h2>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">{p.invoice.invoice_number} · {p.invoice.status}</p>
                        <p className="mt-2 text-xl font-bold text-[var(--color-accent)]">Rp {Number(p.invoice.total).toLocaleString('id-ID')}</p>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">Pelunasan 100% di awal sebelum pesanan disiapkan. Tidak menggunakan DP.</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <a href={route('customer.pengajuan.invoice', p.id)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white">Lihat Invoice</a>
                            <a href={route('customer.pengajuan.invoice.print', p.id)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-semibold">Cetak Invoice</a>
                        </div>
                    </section>}

                    {/* 2) Rincian: Simple definition list with thin dividers */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Rincian</h2>
                        <dl className="mt-3 divide-y divide-[var(--color-border)] border-t border-b border-[var(--color-border)]">
                            {detailRows.map(([label, value], idx) => {
                                const isTotal = label === 'Total tagihan';
                                return (
                                    <div
                                        key={label}
                                        className={`flex items-center justify-between py-3 text-sm ${
                                            isTotal ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-ink)]'
                                        }`}
                                    >
                                        <dt className={isTotal ? 'text-[var(--color-ink)] font-semibold' : 'text-[var(--color-muted)]'}>
                                            {label}
                                        </dt>
                                        <dd className={`text-right tabular-nums ${isTotal ? 'text-base font-bold text-[var(--color-ink)]' : ''}`}>
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
                                    className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
                                >
                                    Bayar
                                </a>
                            )}
                            {canUbahLayanan(p.status) && (
                                <Link
                                    href={navHref('customer.pengajuan.edit', { id: p.id }, role)}
                                    className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
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
                        <label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]">
                            Alasan (opsional)
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            placeholder="Tulis alasan pembatalan…"
                            className="block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                    </div>
                </ConfirmModal>
            </div>
        </PublicLayout>
    );
}
