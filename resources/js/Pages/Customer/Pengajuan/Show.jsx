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
    Dikirim: 'Pesanan sudah dikirim lewat kurir. Lacak dengan nomor resi di situs kurir.',
    Dijadwalkan: 'Jadwal pengerjaan telah ditetapkan. Lihat tanggal mulai dan perkiraan selesai di bawah.',
    Dikerjakan: 'Pesanan sedang dikerjakan sesuai jadwal.',
    'Hasil Diunggah': 'Hasil pengerjaan sudah tersedia. Unduh, periksa, lalu konfirmasi selesai atau ajukan revisi.',
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
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirmJasaOpen, setConfirmJasaOpen] = useState(false);
    const [revisionOpen, setRevisionOpen] = useState(false);
    const [revisionNote, setRevisionNote] = useState('');
    const [rating, setRating] = useState(5);
    const [ulasan, setUlasan] = useState('');
    const [rescheduleStart, setRescheduleStart] = useState(p?.rental_start ?? p?.jasa?.jadwal_mulai ?? '');
    const [rescheduleEnd, setRescheduleEnd] = useState(p?.rental_end ?? p?.jasa?.jadwal_selesai ?? '');
    const [rescheduleErrors, setRescheduleErrors] = useState({});
    const [rescheduleProcessing, setRescheduleProcessing] = useState(false);

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
    const isRental = ['ruangan', 'alat'].includes(p.type);
    const statusHint = (status) => {
        if (!isRental) return STATUS_HINT[status];
        return {
            Lunas: 'Pembayaran telah diterima. Jadwal sewa terkonfirmasi; masa sewa dimulai otomatis saat jadwal mulai.',
            Berjalan: 'Fasilitas sedang dalam masa sewa. Selesai otomatis setelah jadwal berakhir.',
            Selesai: 'Masa sewa telah berakhir sesuai jadwal.',
        }[status] ?? STATUS_HINT[status];
    };
    const isPickup = /ambil/i.test(p.metode_pengambilan || '');
    const isShipment = Boolean(p.shipment);
    const flow = ['Diajukan', 'Menunggu Pembayaran', ...(p.status === 'Menunggu Verifikasi Pembayaran' || (p.history ?? []).some((h) => h.status === 'Menunggu Verifikasi Pembayaran') ? ['Menunggu Verifikasi Pembayaran'] : []), 'Lunas', ...(isRental ? ['Berjalan'] : ['Diproses']), 'Selesai'];
    if (isPickup) flow.splice(flow.indexOf('Selesai'), 0, 'Siap Diambil');
    if (isShipment) flow.splice(flow.indexOf('Selesai'), 0, 'Dikirim');
    const isJasa = Boolean(p.jasa);
    if (isJasa) flow.splice(flow.indexOf('Selesai'), 0, 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah');
    const currentStatus = p.status === 'Diproses' && p.pickup?.ready ? 'Siap Diambil' : p.status;
    const flowIdx = flow.indexOf(currentStatus);
    const jasaStepLabel = { Dijadwalkan: 'Jadwal pengerjaan', Dikerjakan: 'Sedang dikerjakan', 'Hasil Diunggah': 'Hasil diunggah' };
    const stepLabel = (status) => isRental ? ({ Diajukan: 'Diajukan', 'Menunggu Pembayaran': 'Menunggu pembayaran', 'Menunggu Verifikasi Pembayaran': 'Verifikasi pembayaran', Lunas: 'Jadwal sewa terkonfirmasi', Berjalan: 'Masa sewa berlangsung', Selesai: 'Sewa selesai' }[status] ?? status) : status === 'Lunas' ? 'Pembayaran lunas' : status === 'Diproses' ? (isPickup ? 'Penyiapan / pengambilan di PNJ' : isJasa ? 'Penyiapan pesanan jasa' : 'Penyiapan / pengiriman') : status === 'Selesai' ? (isJasa ? 'Selesai — hasil diterima' : 'Selesai — barang diterima') : jasaStepLabel[status] ?? status;

    const historyList = p.history ?? [];

    // Filter definition list rows to hide empty values
    const detailRows = [
        ['Tipe', typeLabel],
        ['Pengiriman / pengambilan', p.metode_pengambilan || 'Belum diisi'],
        ...(p.qty ? [['Jumlah', p.qty]] : []),
        ...(p.need ? [['Keperluan', p.need]] : []),
        ...(p.kebutuhan_detail?.jenis_pengujian ? [['Jenis pengujian / layanan', p.kebutuhan_detail.jenis_pengujian]] : []),
        ...(p.kebutuhan_detail?.metode_standar ? [['Metode / standar', p.kebutuhan_detail.metode_standar]] : []),
        ...(p.kebutuhan_detail?.jumlah_sampel ? [['Jumlah sampel', p.kebutuhan_detail.jumlah_sampel]] : []),
        ...(p.kebutuhan_detail?.uraian_kebutuhan ? [['Uraian kebutuhan', p.kebutuhan_detail.uraian_kebutuhan]] : []),
        ...(p.kebutuhan_detail?.konsultasi_biaya ? [['Konsultasi biaya', p.kebutuhan_detail.konsultasi_biaya]] : []),
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
                        <span>{currentStatus}</span>
                    </div>
                </div>

                {p.invoice_url && <a href={p.invoice_url} className="mt-4 inline-block text-sm underline">Lihat invoice transaksi</a>}
                {p.reschedule_required && (
                    <section className="mt-5 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
                        <h2 className="font-bold text-amber-900">Jadwal perlu dipilih ulang</h2>
                        <p className="text-amber-800">{p.reschedule_reason}</p>
                        <p className="text-xs text-amber-800">Pesanan dan pembayaran tetap berlaku. Pilih tanggal pengganti pada hari operasional layanan.</p>
                        <form onSubmit={(e) => { e.preventDefault(); setRescheduleErrors({}); setRescheduleProcessing(true); router.patch(route('customer.pengajuan.reschedule', p.id), { start: rescheduleStart, end: rescheduleEnd }, { preserveScroll: true, onError: setRescheduleErrors, onFinish: () => setRescheduleProcessing(false) }); }} className="grid gap-3 sm:grid-cols-2">
                            <label className="block">Mulai<input required type="datetime-local" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]" /></label>
                            <label className="block">Selesai<input required type="datetime-local" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]" /></label>
                            {Object.entries(rescheduleErrors).map(([key, message]) => <p key={key} role="alert" className="text-red-700 sm:col-span-2">{message}</p>)}
                            <button disabled={rescheduleProcessing} className="rounded-full bg-amber-600 px-5 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">Simpan jadwal pengganti</button>
                        </form>
                    </section>
                )}
                {p.shipment?.shipped_at && (
                    <section className="mt-5 space-y-1.5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)]/40 p-4 text-sm">
                        <h2 className="font-bold">Informasi pengiriman</h2>
                        <p>Kurir: <span className="font-semibold">{p.shipment.courier_name}</span></p>
                        <p>Nomor resi: <span className="font-mono font-semibold text-[var(--color-accent)]">{p.shipment.tracking_number}</span></p>
                        <p className="text-xs text-[var(--color-muted)]">Dikirim: {p.shipment.shipped_at}. Lacak paket secara manual di situs resmi kurir.</p>
                        {p.status === 'Dikirim' && (
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setReceiptOpen(true)}
                                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Barang Sudah Saya Terima
                            </button>
                        )}
                    </section>
                )}
                {isJasa && (
                    <section aria-labelledby="jasa-heading" className="mt-5 space-y-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)]/40 p-4 text-sm sm:p-5">
                        <h2 id="jasa-heading" className="font-bold">Pengerjaan jasa</h2>
                        {p.jasa.jadwal_mulai_label ? (
                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div><dt className="text-xs text-[var(--color-muted)]">Mulai pengerjaan</dt><dd className="mt-0.5 font-semibold">{p.jasa.jadwal_mulai_label}</dd></div>
                                <div><dt className="text-xs text-[var(--color-muted)]">Perkiraan selesai</dt><dd className="mt-0.5 font-semibold">{p.jasa.jadwal_selesai_label}</dd></div>
                            </dl>
                        ) : (
                            <p className="text-[var(--color-muted)]">Jadwal pengerjaan belum ditetapkan. Anda akan menerima email setelah jadwal tersedia.</p>
                        )}

                        {p.jasa.files.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Berkas hasil</h3>
                                <ul className="mt-2 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                                    {p.jasa.files.map((f) => (
                                        <li key={f.index} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                            <span className="min-w-0 truncate">{f.name}</span>
                                            <a href={route('hasil-jasa.download', { pengajuan: p.id, index: f.index })} className="shrink-0 text-sm font-semibold text-[var(--color-accent)] underline">
                                                Unduh{f.size ? ` (${(f.size / 1048576).toFixed(1)} MB)` : ''}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {p.status === 'Hasil Diunggah' && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={processing} onClick={() => setConfirmJasaOpen(true)} className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Hasil Sesuai, Selesaikan</button>
                                <button type="button" disabled={processing || !p.jasa.can_request_revision} onClick={() => setRevisionOpen(true)} className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                                    Minta Revisi ({p.jasa.revision_left} dari 2 tersisa)
                                </button>
                            </div>
                        )}

                        {p.status === 'Selesai' && (
                            p.jasa.rating ? (
                                <div>
                                    <p aria-label={`Penilaian ${p.jasa.rating} dari 5 bintang`} className="text-lg text-[var(--color-gold)]">{'★'.repeat(p.jasa.rating)}{'☆'.repeat(5 - p.jasa.rating)}</p>
                                    {p.jasa.ulasan && <p className="mt-1 whitespace-pre-wrap text-[var(--color-muted)]">{p.jasa.ulasan}</p>}
                                </div>
                            ) : (
                                <form className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4" onSubmit={(e) => {
                                    e.preventDefault();
                                    setProcessing(true);
                                    router.post(route('customer.pengajuan.jasa.rate', p.id), { rating, ulasan }, { preserveScroll: true, onFinish: () => setProcessing(false) });
                                }}>
                                    <label htmlFor="jasa-rating" className="block font-semibold">Beri penilaian layanan ini</label>
                                    <select id="jasa-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="block w-full max-w-xs rounded-xl border-[var(--color-border)]">
                                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} bintang</option>)}
                                    </select>
                                    <label htmlFor="jasa-ulasan" className="block text-xs text-[var(--color-muted)]">Ulasan (opsional)</label>
                                    <textarea id="jasa-ulasan" rows={2} maxLength={1000} value={ulasan} onChange={(e) => setUlasan(e.target.value)} className="block w-full rounded-xl border-[var(--color-border)]" />
                                    <button type="submit" disabled={processing} className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Kirim Penilaian</button>
                                </form>
                            )
                        )}
                    </section>
                )}
                {p.pickup?.handed_over_at && <section className="mt-5 space-y-2 rounded-xl border p-4 text-sm"><h2 className="font-bold">Bukti serah terima</h2><p>Pengambil: {p.pickup.collector_name}</p><p>Kontak: {p.pickup.collector_contact}</p><p>{p.pickup.handed_over_at}</p><img src={p.pickup.photo_url} alt="Pengambil bersama barang saat serah terima" className="max-h-96 rounded-xl" /></section>}
                {/* Single Column Content */}
                <div className="mt-8 space-y-8">
                    {/* 1) Status Timeline: vertical rail with thin line and small dots */}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                        <div className="mb-5 rounded-2xl bg-[var(--color-accent-tint)] p-4" role="status">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Posisi pesanan saat ini</p>
                            <h2 className="mt-1 font-display text-lg font-bold text-[var(--color-ink)]">{stepLabel(currentStatus)}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{p.pickup?.ready && p.status === 'Diproses' ? 'Barang siap diambil di PNJ pada pukul 08.00–16.00 WIB.' : statusHint(p.status)}</p>
                            {isPickup && <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">Jam pengambilan PNJ: 08.00–16.00 WIB. {p.pickup?.ready ? 'Barang telah ditandai siap diambil.' : 'Tunggu pemberitahuan barang siap sebelum datang.'}</p>}
                        </div>
                        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Tahapan pesanan</h2>
                        <ol className="relative ml-2 mt-4 border-l border-[var(--color-border)] pl-5">
                            {flow.map((s, i) => {
                                const isCurrent = s === currentStatus;
                                const isDone = s === 'Siap Diambil' ? Boolean(p.pickup?.ready) : (flowIdx >= 0 ? i <= flowIdx : false);
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
                                            {isCurrent && statusHint(p.status) && (
                                                <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
                                                    {p.pickup?.ready && p.status === 'Diproses' ? 'Barang siap diambil di PNJ pada pukul 08.00–16.00 WIB.' : statusHint(p.status)}
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

                    {p.invoice && ['issued', 'paid'].includes(p.invoice.status) && <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
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
                            {canUbahLayanan(p.status) && !p.invoice_locked && (
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
                    open={receiptOpen}
                    title="Konfirmasi barang sudah diterima?"
                    desc="Pastikan paket sudah sampai dan isinya sesuai pesanan. Setelah dikonfirmasi, pesanan ditandai selesai dan tidak dapat dibatalkan."
                    confirmLabel="Ya, barang sudah diterima"
                    processing={processing}
                    onConfirm={() => {
                        setProcessing(true);
                        router.patch(route('customer.pengajuan.confirm-receipt', p.id), {}, {
                            onSuccess: () => setReceiptOpen(false),
                            onFinish: () => { setProcessing(false); setReceiptOpen(false); },
                        });
                    }}
                    onClose={() => setReceiptOpen(false)}
                />
                <ConfirmModal
                    open={confirmJasaOpen}
                    title="Terima hasil pengerjaan?"
                    desc="Pesanan ditandai selesai setelah dikonfirmasi. Pastikan berkas hasil sudah diunduh dan diperiksa."
                    confirmLabel="Ya, selesaikan pesanan"
                    processing={processing}
                    onConfirm={() => {
                        setProcessing(true);
                        router.patch(route('customer.pengajuan.jasa.confirm', p.id), {}, {
                            preserveScroll: true,
                            onFinish: () => { setProcessing(false); setConfirmJasaOpen(false); },
                        });
                    }}
                    onClose={() => setConfirmJasaOpen(false)}
                />
                <ConfirmModal
                    open={revisionOpen}
                    title={`Minta revisi ke-${p.jasa?.revision_count + 1}?`}
                    desc={`Sisa revisi setelah ini: ${(p.jasa?.revision_left ?? 0) - 1} dari 2.`}
                    confirmLabel="Kirim permintaan revisi"
                    processing={processing}
                    onConfirm={() => {
                        if (revisionNote.trim().length < 5) return;
                        setProcessing(true);
                        router.patch(route('customer.pengajuan.jasa.revision', p.id), { catatan: revisionNote }, {
                            preserveScroll: true,
                            onFinish: () => { setProcessing(false); setRevisionOpen(false); setRevisionNote(''); },
                        });
                    }}
                    onClose={() => setRevisionOpen(false)}
                >
                    <label htmlFor="revision-note" className="block text-sm font-medium">Bagian yang perlu direvisi</label>
                    <textarea id="revision-note" rows={3} maxLength={1000} required value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} className="mt-2 block w-full rounded-xl border-[var(--color-border)] text-sm" />
                </ConfirmModal>
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
