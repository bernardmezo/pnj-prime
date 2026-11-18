import { Head, router } from '@inertiajs/react';
import { CalendarRange, Package } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import Modal from '@/Components/ui/Modal';
import { useConfirm } from '@/Components/ConfirmDialog';

const RENTAL_RUANGAN_NEXT = {
    Lunas:     { status: 'Terjadwal', label: 'Konfirmasi Jadwal' },
    Terjadwal: { status: 'Berjalan',  label: 'Mulai Pemakaian' },
    Berjalan:  { status: 'Selesai',   label: 'Selesaikan Sewa' },
};
const JASA_NEXT = {
    Lunas: { status: 'Diproses', label: 'Mulai Proses' },
    Diproses: { status: 'Dijadwalkan', label: 'Tetapkan Jadwal' },
    Dijadwalkan: { status: 'Dikerjakan', label: 'Mulai Pengerjaan' },
    Dikerjakan: { status: 'Hasil Diunggah', label: 'Unggah Hasil' },
    'Hasil Diunggah': null, // selesai/revisi diputuskan Customer
};
const nextJasaAction = (p) => (p.jasa ? (JASA_NEXT[p.status] ?? null) : null);

const RENTAL_ALAT_NEXT = {
    Lunas:        { status: 'Terjadwal',    label: 'Konfirmasi Peminjaman' },
    Terjadwal:    { status: 'Dipinjam',     label: 'Alat Diserahkan' },
    Dipinjam:     { status: 'Dikembalikan', label: 'Alat Dikembalikan' },
    Dikembalikan: { status: 'Selesai',      label: 'Selesaikan Sewa' },
};

export default function PesananProduk({ pesanan = [] }) {
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('Semua');
    const [processing, setProcessing] = useState(false);
    const [collectorName, setCollectorName] = useState('');
    const [collectorContact, setCollectorContact] = useState('');
    const [courierName, setCourierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [photo, setPhoto] = useState(null);
    const [jadwalMulai, setJadwalMulai] = useState('');
    const [jadwalSelesai, setJadwalSelesai] = useState('');
    const [hasilFiles, setHasilFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const selected = pesanan.find((p) => p.id === selectedId);
    const rows = filter === 'Semua' ? pesanan : pesanan.filter((p) => p.status === filter);
    const money = (value) => `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
    const nextRentalAction = (p) => {
        if (!p.is_rental) return null;
        return (p.tipe === 'alat' ? RENTAL_ALAT_NEXT : RENTAL_RUANGAN_NEXT)[p.status] ?? null;
    };
    const { confirm: confirmDialog, ConfirmUI } = useConfirm();
    const update = async (status) => {
        const isShipment = Boolean(selected.shipment);
        const isJasa = Boolean(selected.jasa);
        if (isJasa && status === 'Dijadwalkan') {
            const next = {};
            if (!jadwalMulai) next.jadwal_mulai = 'Tanggal mulai pengerjaan wajib diisi.';
            if (!jadwalSelesai) next.jadwal_selesai = 'Perkiraan selesai wajib diisi.';
            if (Object.keys(next).length) { setErrors(next); return; }
        }
        if (isJasa && status === 'Hasil Diunggah' && hasilFiles.length === 0) {
            setErrors({ hasil_files: 'Unggah minimal satu berkas hasil.' });
            return;
        }
        if (isShipment && status === 'Dikirim') {
            const next = {};
            if (!courierName.trim()) next.courier_name = 'Nama kurir wajib diisi.';
            if (!trackingNumber.trim()) next.tracking_number = 'Nomor resi wajib diisi.';
            if (Object.keys(next).length) { setErrors(next); return; }
        }
        const ok = await confirmDialog({
            title: isJasa
                ? (status === 'Diproses' ? 'Mulai proses pesanan jasa?'
                    : status === 'Dijadwalkan' ? 'Tetapkan jadwal pengerjaan?'
                    : status === 'Dikerjakan' ? 'Mulai pengerjaan sekarang?'
                    : 'Unggah berkas hasil dan tandai hasil tersedia?')
                : selected.is_rental ? `Ubah status menjadi "${status}"?` : isShipment ? (status === 'Dikirim' ? 'Tandai pesanan dikirim?' : status === 'Selesai' ? 'Konfirmasi pesanan diterima?' : 'Mulai proses pesanan?') : status === 'Selesai' ? 'Konfirmasi serah terima?' : selected.pickup ? 'Tandai barang siap diambil?' : 'Mulai proses pesanan?',
            message: isJasa
                ? (status === 'Dijadwalkan' ? 'Customer akan diberi tahu tanggal mulai dan perkiraan selesai melalui email.'
                    : status === 'Hasil Diunggah' ? 'Berkas hasil dapat diunduh Customer. Setelah ini Customer memutuskan selesai atau minta revisi.'
                    : 'Status pesanan akan direkam dalam riwayat.')
                : selected.is_rental ? 'Tindakan ini akan direkam dalam riwayat pesanan.' : isShipment ? (status === 'Dikirim' ? `Kurir ${courierName} dengan resi ${trackingNumber} akan dikirim ke customer lewat email. Data resi tidak dapat diubah setelah ini.` : status === 'Selesai' ? 'Pastikan barang sudah diterima customer.' : 'Status pesanan akan berubah menjadi "Diproses".') : status === 'Selesai' ? 'Pastikan barang sudah diterima customer.' : selected.pickup ? 'Customer akan diberitahu bahwa barang siap diambil di PNJ.' : 'Status pesanan akan berubah menjadi "Diproses".',
            confirmLabel: 'Ya, Lanjutkan',
        });
        if (!ok) return;
        setProcessing(true);
        setErrors({});
        router.post(route('pengelola.pesanan.update', selected.id), { _method: 'patch', status,
            ...(isJasa && status === 'Dijadwalkan' ? { jadwal_mulai: jadwalMulai, jadwal_selesai: jadwalSelesai } : {}),
            ...(isJasa && status === 'Hasil Diunggah' ? { hasil_files: hasilFiles } : {}), ...(selected.pickup ? { pickup_action: 'ready', collector_name: collectorName, collector_contact: collectorContact, handover_photo: photo } : {}), ...(isShipment && status === 'Dikirim' ? { courier_name: courierName, tracking_number: trackingNumber } : {}) }, {
            forceFormData: true,
            onError: setErrors,
            preserveScroll: true,
            onSuccess: () => { setSelectedId(null); setHasilFiles([]); setJadwalMulai(''); setJadwalSelesai(''); },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DashboardLayout title="Pesanan Produk" activeKey="pesanan">
            <Head title="Pesanan Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader eyebrow="Admin Pengelola" title="Pesanan Produk" desc="Pantau produk yang telah dibayar dan siapkan pesanan sesuai pilihan customer." />
                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                    {[['Lunas', 'Perlu disiapkan'], ['Terjadwal', 'Jadwal sewa aktif'], ['Diproses', 'Sedang diproses'], ['Selesai', 'Pesanan selesai']].map(([status, label]) => (
                        <Card key={status} className="p-5">
                            <p className="text-sm text-[var(--color-muted)]">{label}</p>
                            <p className="mt-2 font-display text-3xl font-bold text-[var(--color-accent)]">{pesanan.filter((p) => p.status === status).length}</p>
                        </Card>
                    ))}
                </div>
                <div className="my-5 flex flex-wrap gap-2" aria-label="Filter pesanan">
                    {['Semua', 'Lunas', 'Terjadwal', 'Diproses', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah', 'Dikirim', 'Berjalan', 'Dipinjam', 'Dikembalikan', 'Selesai'].map((status) => (
                        <button key={status} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${filter === status ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]'}`}>
                            {status === 'Lunas' ? 'Perlu disiapkan' : status}
                        </button>
                    ))}
                </div>
                {rows.length === 0 ? <EmptyState icon={Package} title="Belum ada pesanan" desc="Pesanan produk milik Anda yang sudah dibayar akan muncul di sini." /> : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map((p) => {
                            const next = nextRentalAction(p) ?? nextJasaAction(p);
                            return (
                                <Card key={p.id} className="p-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs text-[var(--color-muted)]">{p.code}</span>
                                        <div className="flex items-center gap-1.5">
                                            {p.is_rental && <CalendarRange className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </div>
                                    <h2 className="mt-3 font-display font-bold text-[var(--color-ink)]">{p.product}</h2>
                                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                                        {p.customer?.name}
                                        {p.is_rental ? ` · ${p.rental_duration_days} hari` : p.quantity ? ` · ${p.quantity} unit` : ''}
                                    </p>
                                    {p.is_rental && p.rental_start && (
                                        <p className="mt-1 text-xs text-[var(--color-accent)]">{p.rental_start} — {p.rental_end}</p>
                                    )}
                                    <p className="mt-3 font-semibold">{money(p.total)}</p>
                                    <button type="button" onClick={() => { setSelectedId(p.id); setCollectorName(''); setCollectorContact(''); setCourierName(''); setTrackingNumber(''); setPhoto(null); setJadwalMulai(''); setJadwalSelesai(''); setHasilFiles([]); setErrors({}); }}
                                        className="mt-4 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                                        {next ? next.label : 'Lihat Detail Pesanan'}
                                    </button>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </FadeIn>
            <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title="Detail Pesanan Produk" size="2xl">
                {selected && <div className="space-y-5">
                    {selected.thumbnail && <img src={`/storage/${selected.thumbnail}`} alt={selected.product} className="h-56 w-full rounded-2xl bg-[var(--color-surface)] object-contain" />}
                    <h2 className="font-display text-xl font-bold">{selected.product}</h2>
                    <StatusBadge status={selected.status} label={selected.status === 'Diproses' && selected.pickup?.ready ? 'Siap Diambil' : selected.status} />
                    <dl className="divide-y divide-[var(--color-border)]">
                        {[
                            ['Kode', selected.code], ['Tanggal pengajuan', selected.date], ['Jumlah', selected.quantity], ['Total dibayar', money(selected.total)],
                            ['Customer', selected.customer?.name], ['Email', selected.customer?.email], ['Telepon', selected.customer?.phone],
                            ['Pengiriman / pengambilan', selected.fulfillment], ['Catatan customer / pengiriman', selected.notes],
                            ...(selected.kebutuhan_detail?.jenis_pengujian ? [['Jenis pengujian', selected.kebutuhan_detail.jenis_pengujian]] : []),
                            ...(selected.kebutuhan_detail?.metode_standar ? [['Metode / standar', selected.kebutuhan_detail.metode_standar]] : []),
                            ...(selected.kebutuhan_detail?.jumlah_sampel ? [['Jumlah sampel', selected.kebutuhan_detail.jumlah_sampel]] : []),
                            ...(selected.kebutuhan_detail?.uraian_kebutuhan ? [['Uraian kebutuhan', selected.kebutuhan_detail.uraian_kebutuhan]] : []),
                            ...(selected.kebutuhan_detail?.konsultasi_biaya ? [['Konsultasi biaya', selected.kebutuhan_detail.konsultasi_biaya]] : []),
                        ].map(([label, value]) => <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-2"><dt className="text-[var(--color-muted)]">{label}</dt><dd className="min-w-0 whitespace-pre-wrap break-words font-medium">{value ?? 'Belum diisi'}</dd></div>)}
                    </dl>
                    <p className="rounded-xl bg-[var(--color-accent-tint)] p-4 text-sm text-[var(--color-accent)]">Siapkan sesuai pilihan customer. Selesaikan pesanan hanya setelah barang diterima customer.</p>
                    {selected.is_rental && (
                        <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-tint)] p-4 space-y-3">
                            <h3 className="text-sm font-bold text-[var(--color-accent)] flex items-center gap-2"><CalendarRange className="h-4 w-4" />Informasi Sewa</h3>
                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                                <div><p className="text-xs text-[var(--color-muted)]">Periode</p><p className="font-semibold">{selected.rental_start} — {selected.rental_end}</p></div>
                                <div><p className="text-xs text-[var(--color-muted)]">Durasi</p><p className="font-semibold">{selected.rental_duration_days} hari</p></div>
                                {selected.rental_started_at && <div><p className="text-xs text-[var(--color-muted)]">Dimulai</p><p className="font-semibold">{selected.rental_started_at}</p></div>}
                                {selected.rental_returned_at && <div><p className="text-xs text-[var(--color-muted)]">Dikembalikan</p><p className="font-semibold">{selected.rental_returned_at}</p></div>}
                            </div>
                            {selected.renter_data?.company_name && (
                                <div className="pt-2 border-t border-[var(--color-border)]">
                                    <p className="text-xs text-[var(--color-muted)]">Penyewa: <span className="font-semibold text-[var(--color-ink)]">{selected.renter_data.company_name}</span></p>
                                    {selected.renter_data.contact_person && <p className="text-xs text-[var(--color-muted)]">PIC: {selected.renter_data.contact_person} · {selected.renter_data.contact_phone}</p>}
                                </div>
                            )}
                        </div>
                    )}
                    {selected.jasa && (
                        <div className="space-y-3 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)]/40 p-4 text-sm">
                            <p className="font-bold text-[var(--color-ink)]">PENGERJAAN JASA / TEST LAB</p>
                            {selected.jasa.jadwal_mulai_label && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div><p className="text-xs text-[var(--color-muted)]">Mulai</p><p className="font-semibold">{selected.jasa.jadwal_mulai_label}</p></div>
                                    <div><p className="text-xs text-[var(--color-muted)]">Perkiraan selesai</p><p className="font-semibold">{selected.jasa.jadwal_selesai_label}</p></div>
                                </div>
                            )}
                            {selected.jasa.revision_count > 0 && <p className="text-xs text-[var(--color-muted)]">Revisi diminta Customer: {selected.jasa.revision_count} dari 2.</p>}
                            {selected.jasa.files.length > 0 && (
                                <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                                    {selected.jasa.files.map((f) => (
                                        <li key={f.index} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                            <span className="min-w-0 truncate">{f.name}{f.round > 0 ? ` (revisi ke-${f.round})` : ''}</span>
                                            <a href={route('hasil-jasa.download', { pengajuan: selected.id, index: f.index })} className="shrink-0 text-sm font-semibold text-[var(--color-accent)] underline">Unduh</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selected.jasa.rating && (
                                <p className="text-sm"><span className="text-[var(--color-gold)]">{'★'.repeat(selected.jasa.rating)}{'☆'.repeat(5 - selected.jasa.rating)}</span>{selected.jasa.ulasan ? ` — ${selected.jasa.ulasan}` : ''}</p>
                            )}
                            {selected.status === 'Diproses' && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        Tanggal mulai pengerjaan
                                        <input type="datetime-local" value={jadwalMulai} onChange={(e) => setJadwalMulai(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" required />
                                        {errors.jadwal_mulai && <p role="alert" className="mt-1 text-red-700">{errors.jadwal_mulai}</p>}
                                    </label>
                                    <label className="block">
                                        Perkiraan selesai
                                        <input type="datetime-local" value={jadwalSelesai} onChange={(e) => setJadwalSelesai(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" required />
                                        {errors.jadwal_selesai && <p role="alert" className="mt-1 text-red-700">{errors.jadwal_selesai}</p>}
                                    </label>
                                </div>
                            )}
                            {selected.status === 'Dikerjakan' && (
                                <label className="block">
                                    Berkas hasil (PDF, DOCX, XLSX, JPG, PNG, ZIP — maks. 20 MB per berkas, maks. 5 berkas)
                                    <input type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip" onChange={(e) => setHasilFiles(Array.from(e.target.files).slice(0, 5))} className="mt-1 block" required />
                                    {errors.hasil_files && <p role="alert" className="mt-1 text-red-700">{errors.hasil_files}</p>}
                                    {hasilFiles.length > 0 && <p className="mt-1 text-xs text-[var(--color-muted)]">{hasilFiles.length} berkas dipilih: {hasilFiles.map((f) => f.name).join(', ')}</p>}
                                </label>
                            )}
                        </div>
                    )}
                    {selected.pickup && <div className="space-y-3 rounded-xl border p-4 text-sm"><p className="font-bold">{selected.pickup.ready ? 'BARANG SIAP DIAMBIL — PNJ 08.00–16.00 WIB' : 'Belum ditandai siap diambil'}</p>
                        {selected.pickup.ready && selected.status !== 'Selesai' && <><label className="block">Nama pengambil<input className="mt-1 block w-full rounded-lg border p-2" required value={collectorName} onChange={e => setCollectorName(e.target.value)} /></label><label className="block">Telepon / kontak pengambil<input className="mt-1 block w-full rounded-lg border p-2" required value={collectorContact} onChange={e => setCollectorContact(e.target.value)} /></label><label className="block">Foto pengambil bersama barang (JPG/PNG/WebP, maks. 5 MB)<input className="mt-2 block" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setPhoto(e.target.files[0])} /></label><p>Nama, kontak, dan foto wajib diisi sebelum menyelesaikan pesanan. Tidak perlu unggahan KTP/NIK.</p></>}
                        {selected.pickup.handed_over_at && <><p>{selected.pickup.collector_name} · {selected.pickup.collector_contact}</p><p>{selected.pickup.handed_over_at}</p><img src={selected.pickup.photo_url} alt="Pengambil bersama barang" className="max-h-64 rounded-xl" /></>}
                        {Object.entries(errors).map(([key, message]) => <p key={key} role="alert" className="text-red-700">{message}</p>)}
                    </div>}
                    {selected.shipment && (
                        <div className="space-y-3 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)]/40 p-4 text-sm">
                            <p className="font-bold text-[var(--color-ink)]">PENGIRIMAN VIA KURIR</p>
                            {selected.shipment.shipped_at ? (
                                <>
                                    <p className="font-semibold">{selected.shipment.courier_name}</p>
                                    <p className="font-mono text-[var(--color-accent)]">{selected.shipment.tracking_number}</p>
                                    <p className="text-xs text-[var(--color-muted)]">Dikirim: {selected.shipment.shipped_at}</p>
                                </>
                            ) : (
                                <>
                                    {selected.status === 'Diproses' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="block">
                                                Nama Kurir
                                                <input value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="JNE / J&T / SiCepat" className="mt-1 block w-full rounded-lg border p-2" required />
                                                {errors.courier_name && <p role="alert" className="mt-1 text-red-700">{errors.courier_name}</p>}
                                            </label>
                                            <label className="block">
                                                Nomor Resi
                                                <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Contoh: JNE123456" className="mt-1 block w-full rounded-lg border p-2" required />
                                                {errors.tracking_number && <p role="alert" className="mt-1 text-red-700">{errors.tracking_number}</p>}
                                            </label>
                                        </div>
                                    )}
                                    {selected.status === 'Lunas' && <p>Mulai proses pesanan terlebih dahulu, lalu masukkan data kurir dan resi saat pengiriman.</p>}
                                </>
                            )}
                        </div>
                    )}
                    {selected.status !== 'Selesai' && (() => {
                        const jasaNext = nextJasaAction(selected);
                        if (selected.jasa) {
                            if (!jasaNext) return null;
                            return <button type="button" disabled={processing} onClick={() => update(jasaNext.status)} className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">{processing ? 'Menyimpan…' : jasaNext.label}</button>;
                        }

                        if (selected.is_rental) {
                            const next = nextRentalAction(selected);
                            if (!next) return null;
                            return <button type="button" disabled={processing} onClick={() => update(next.status)} className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">{processing ? 'Menyimpan…' : next.label}</button>;
                        }
                        const isShipment = Boolean(selected.shipment);
                        if (selected.jasa) return null;
                        const nextStatus = selected.pickup ? (selected.pickup.ready ? 'Selesai' : 'Diproses') : isShipment ? (selected.status === 'Lunas' ? 'Diproses' : selected.status === 'Diproses' ? 'Dikirim' : 'Selesai') : (selected.status === 'Lunas' ? 'Diproses' : 'Selesai');
                        const nextLabel = selected.pickup && !selected.pickup.ready ? 'BARANG SIAP DIAMBIL' : isShipment ? (selected.status === 'Lunas' ? 'Mulai Proses' : selected.status === 'Diproses' ? 'Tandai Dikirim' : 'Selesaikan Pesanan') : selected.status === 'Lunas' ? 'Mulai Proses' : 'Selesaikan Pesanan';
                        return <button type="button" disabled={processing} onClick={() => update(nextStatus)} className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">{processing ? 'Menyimpan…' : nextLabel}</button>;
                    })()}
                </div>}
            </Modal>
            {ConfirmUI}
        </DashboardLayout>
    );
}
