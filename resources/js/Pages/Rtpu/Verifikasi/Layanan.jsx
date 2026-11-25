import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };
const CHECKLIST = [
    'Identitas pemohon jelas (nama dan kontak)',
    'Jenis layanan dan kebutuhan terisi lengkap',
    'Jadwal / jumlah / peserta masuk akal',
    'Dokumen pendukung dilampirkan bila diperlukan',
];

export default function VerifikasiLayanan({ auth, antrean = [], selected = null, bluBanks = [], shippingCouriers = [], rentalNeedsPimpinan = false }) {
    const invoiceForm = useForm({ unit_price: selected?.product_detail?.final_price ?? selected?.product_detail?.base_price ?? '', shipping_courier: '', shipping_service: '', shipping_amount: 0, tax_rate: '0', bank_id: '', due_date: '', notes: '' });
    const [rates, setRates] = useState([]);
    const [shippingError, setShippingError] = useState('');
    const [loadingRates, setLoadingRates] = useState(false);
    const delivery = ['kurir', 'Diantar'].includes(selected?.fulfillment);
    useEffect(() => {
        setRates([]);
        invoiceForm.setData('shipping_service', '');
        invoiceForm.setData('shipping_amount', 0);
        if (!delivery || !invoiceForm.data.shipping_courier) return;
        const controller = new AbortController();
        setLoadingRates(true);
        setShippingError('');
        fetch(`${route('rtpu.verify.layanan.shipping', selected.id)}?courier=${encodeURIComponent(invoiceForm.data.shipping_courier)}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(Object.values(data.errors ?? {}).flat().join(' ') || data.message || 'Tarif live tidak tersedia.');
                setRates(data.rates);
            })
            .catch((error) => { if (error.name !== 'AbortError') setShippingError(error.message); })
            .finally(() => { if (!controller.signal.aborted) setLoadingRates(false); });
        return () => controller.abort();
    }, [selected?.id, delivery, invoiceForm.data.shipping_courier]);
    const rows = antrean.filter((item) => !item.is_product);
    const sel = selected;
    const [tarifJasa, setTarifJasa] = useState('');
    const [processing, setProcessing] = useState(false);
    const detail = sel?.product_detail;
    const meta = detail?.meta ?? {};
    const photos = [...new Set([detail?.thumbnail, ...(Array.isArray(detail?.images) ? detail.images : [])].filter(Boolean))];
    const display = (value, unit = '') => value === null || value === undefined || value === '' ? 'Belum diisi' : `${value}${unit}`;
    const rupiah = (value) => value === null || value === undefined ? 'Belum diisi' : `Rp ${Number(value).toLocaleString('id-ID')}`;

    return (
        <DashboardLayout title="Verifikasi Pesanan" breadcrumb="Admin RTPU / Verifikasi Pesanan" activeKey="verify-layanan">
            <Head title="Verifikasi Pesanan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Pesanan"
                    desc="Periksa kelengkapan data, verifikasi isi pengajuan, lalu verifikasi atau tolak dengan catatan."
                />

                {!sel && (rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Antrean Pesanan Kosong"
                        desc="Tidak ada pengajuan layanan baru yang menunggu verifikasi saat ini. Seluruh permohonan telah ditindaklanjuti."
                    />
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Antrean Pesanan ({rows.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {rows.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={route('rtpu.verify.layanan.show', p.id)}
                                        className="block w-full rounded-2xl border p-5 text-left shadow-[var(--shadow-card)] transition duration-150 hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                                        style={
                                            sel?.id === p.id
                                                ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                        }
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{p.code}</span>
                                            <StatusBadge status={p.status} label={p.status} />
                                        </span>
                                        <span className="mt-1 block truncate text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                                            {p.layanan}
                                        </span>
                                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {TYPE_LABEL[p.type]} · {p.customer} · {p.date}
                                        </span>
                                        <span className="mt-4 inline-flex rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white">Lihat Detail &amp; Verifikasi</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        </div>
                ))}
                {sel && <Link href={route('rtpu.verify.layanan')} className="mb-5 inline-flex rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">← Kembali ke antrean pengajuan</Link>}
                        {sel && <Card className="p-6">
                            {sel && (
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{sel.code}</span>
                                    <StatusBadge status={sel.status} label={sel.status} />
                                </div>
                                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{sel.layanan}</h2>
                                <section className="mt-5 space-y-3" aria-label="Foto pengajuan">
                                    {photos.length ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {photos.map((photo, index) => (
                                                <a key={photo} href={`/storage/${photo}`} target="_blank" rel="noopener noreferrer"
                                                    className={`${index === 0 ? 'col-span-3' : ''} overflow-hidden rounded-2xl border bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]`}
                                                    style={{ borderColor: 'var(--color-border)' }} aria-label={`Perbesar foto ${index + 1}`}>
                                                    <img src={`/storage/${photo}`} alt={`${sel.layanan} — foto ${index + 1}`} className={`w-full object-contain ${index === 0 ? 'h-64 sm:h-80' : 'h-24'}`} />
                                                </a>
                                            ))}
                                        </div>
                                    ) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted)]">Foto belum dilampirkan.</div>}
                                    {photos.length > 0 && <p className="text-xs text-[var(--color-muted)]">Klik foto untuk melihat ukuran penuh di tab baru.</p>}
                                </section>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        [sel.is_product ? 'Harga dasar' : 'Total pengajuan', rupiah(sel.is_product ? detail?.base_price : sel.total)],
                                        ['Berat per unit', display(meta.weight, ' gram')],
                                        ['Stok', display(detail?.stock)],
                                        ['Ketersediaan', meta.availability_status === 'tersedia' ? 'Tersedia' : meta.availability_status === 'preorder' ? 'Pre-order' : 'Belum diisi'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                                            <p className="text-xs text-[var(--color-muted)]">{label}</p>
                                            <p className="mt-1 break-words font-display text-base font-semibold text-[var(--color-accent)]">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="mt-6 font-display text-sm font-bold text-[var(--color-ink)]">Informasi pemohon & pengajuan</h3>
                                <dl className="mt-3 divide-y rounded-2xl border px-4" style={{ borderColor: 'var(--color-border)' }}>
                                    {[
                                        ['Pemohon', sel.customer],
                                        ['Nomor telepon', display(sel.phone)],
                                        ['NIP pengaju', display(sel.nip)],
                                        ['Jurusan pengaju', display(sel.jurusan)],
                                        ['Tipe', TYPE_LABEL[sel.type]],
                                        ['Jumlah', sel.qty ?? '-'],
                                        ...(!sel.is_product && sel.type !== 'produk' && !sel.is_preorder ? [['Keperluan', sel.need ?? '-']] : []),
                                        ['Tanggal', sel.date],
                                        ['Kategori', display(sel.category)],
                                        ['Unit / institusi', display(sel.unit)],
                                        ['Panjang', display(meta.length, ' cm')],
                                        ['Lebar', display(meta.width, ' cm')],
                                        ['Tinggi', display(meta.height, ' cm')],
                                        ['Estimasi pre-order', display(meta.preorder_duration)],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                            <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                            <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {sel.kebutuhan_detail && (
                                    <section className="mt-5 rounded-2xl border border-[var(--color-border)] p-4" aria-label="Kebutuhan pengujian dan konsultasi biaya">
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Kebutuhan pengujian &amp; konsultasi biaya</h3>
                                        <dl className="mt-3 space-y-2.5 text-sm">
                                            {[
                                                ['Jenis pengujian / layanan', sel.kebutuhan_detail.jenis_pengujian],
                                                ['Metode / standar', sel.kebutuhan_detail.metode_standar],
                                                ['Jumlah sampel', sel.kebutuhan_detail.jumlah_sampel],
                                                ['Uraian kebutuhan', sel.kebutuhan_detail.uraian_kebutuhan],
                                                ['Konsultasi biaya dari Customer', sel.kebutuhan_detail.konsultasi_biaya],
                                            ].filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (
                                                <div key={k}>
                                                    <dt className="text-xs text-[var(--color-muted)]">{k}</dt>
                                                    <dd className="mt-0.5 whitespace-pre-wrap break-words font-medium text-[var(--color-ink)]">{v}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </section>
                                )}
                                {sel.owner_detail && <section className="mt-5 rounded-2xl border border-[var(--color-border)] p-4">
                                    <h3 className="text-sm font-semibold">Pemilik produk / unit pengelola</h3>
                                    <dl className="mt-2 space-y-2 text-sm">{[['Nama', sel.owner_detail.name], ['Email', sel.owner_detail.email], ['Telepon', sel.owner_detail.phone], ['NIP', sel.owner_detail.nip], ['Jurusan', sel.owner_detail.jurusan], ['Unit / institusi', sel.owner_detail.unit_name || sel.owner_detail.institution]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="text-right font-medium">{display(value)}</dd></div>)}</dl>
                                </section>}
                                <section className="mt-5 space-y-4 rounded-2xl bg-[var(--color-surface)] p-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Deskripsi singkat</h3>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-muted)]">{display(detail?.short_description)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Deskripsi lengkap</h3>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-muted)]">{display(detail?.description)}</p>
                                    </div>
                                </section>
                                {sel.is_rental && (
                                    <section className="mt-5 rounded-2xl border border-[var(--color-border)] p-4" aria-label="Data penyewa dan jadwal sewa">
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Data penyewa &amp; jadwal sewa</h3>
                                        <dl className="mt-3 space-y-2.5 text-sm">
                                            {[
                                                ['Mulai sewa', sel.rental_start],
                                                ['Selesai sewa', sel.rental_end],
                                                ['Durasi / jumlah pengajuan', sel.qty],
                                                ['Nama instansi / perorangan', sel.renter_data?.company_name],
                                                ['NPWP', sel.renter_data?.npwp],
                                                ['Nomor KTP / NIK', sel.renter_data?.ktp_number],
                                                ['Nama kontak person', sel.renter_data?.contact_person],
                                                ['Nomor telepon kontak', sel.renter_data?.contact_phone],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex items-start justify-between gap-4">
                                                    <dt className="text-[var(--color-muted)]">{k}</dt>
                                                    <dd className="text-right font-medium text-[var(--color-ink)]">{display(v)}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </section>
                                )}
                                {(sel.is_preorder || sel.type === 'jasa' || (sel.is_rental && !(rentalNeedsPimpinan && sel.status === 'Diajukan'))) && <section className="mt-5 space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
                                    <h3 className="font-semibold">{sel.is_rental ? 'Invoice sewa · Transfer BLU' : sel.type === 'jasa' ? 'Invoice jasa · Transfer BLU' : 'Invoice pre-order · Transfer BLU'}</h3>
                                    {sel.invoice?.status === 'draft' ? <div className="space-y-2 text-sm">
                                        <p>{sel.invoice.invoice_number} · Total transfer {rupiah(sel.invoice.total)}</p>
                                        {(sel.invoice.lines ?? []).map((line) => <p key={line.id}>{line.description} · {line.quantity} × {rupiah(line.unit_price)} = {rupiah(line.amount)}</p>)}
                                        <p>{sel.is_rental ? 'Subtotal' : 'Barang'} {rupiah(sel.invoice.subtotal)} + pajak {sel.invoice.tax_rate_snapshot}% ({rupiah(sel.invoice.tax_amount)}) + ongkir {rupiah(sel.invoice.shipping_amount)} + nominal unik {rupiah(sel.invoice.unique_amount)}</p>
                                        <p>{sel.invoice.bank_snapshot?.name} · {sel.invoice.bank_snapshot?.account} · {sel.invoice.bank_snapshot?.holder}</p>
                                        <button type="button" className="underline" onClick={() => router.patch(route('rtpu.invoice.cancel', sel.invoice.id), { reason: 'Penyusunan ulang draf invoice' })}>Batalkan draf untuk menyusun ulang</button>
                                    </div> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (!sel.is_preorder) return; invoiceForm.post(route('rtpu.invoice.store', sel.id)); }}>
                                        {!sel.is_preorder ? <div className="space-y-2 text-sm">
                                            <p>Total pengajuan tersimpan: <strong>{rupiah(sel.total)}</strong></p>
                                            <p>Rincian pilihan saat pengajuan:</p>
                                            {(sel.rental_options ?? []).length ? sel.rental_options.map((option) => <p key={option.id}>{option.nama} · {option.qty} × {rupiah(option.harga)} / {option.satuan} · {rupiah(option.subtotal)}</p>) : <p>Tidak ada pilihan tambahan.</p>}
                                            <p className="text-xs text-[var(--color-muted)]">Pajak dihitung berdasarkan persentase yang dimasukkan saat verifikasi dan penerbitan invoice.</p>
                                        </div> : <p className="text-xs text-[var(--color-muted)]">Harga per unit × {sel.qty || 1}. Pajak hanya atas barang. Nominal unik ditambahkan otomatis, bebas pajak.</p>}
                                        {!bluBanks.length && <p role="alert">Rekening resmi belum tersedia. Masukkan rekening resmi institusi bertipe BLU yang aktif terlebih dahulu; jangan gunakan nomor contoh. <Link href={`${route('rtpu.metode')}?tambah=blu`} className="font-semibold text-[var(--color-accent)] underline">Tambah rekening resmi BLU di Metode Pembayaran</Link>.</p>}
                                        {sel.is_preorder && <label className="block text-sm">Harga barang per unit (Rp)<input required inputMode="numeric" className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.unit_price === '' ? '' : Number(invoiceForm.data.unit_price).toLocaleString('id-ID')} onChange={(event) => invoiceForm.setData('unit_price', event.target.value.replace(/\D/g, '') === '' ? '' : Number(event.target.value.replace(/\D/g, '')))} /></label>}
                                        {sel.is_preorder && (delivery ? <div className="space-y-3">
                                            <p className="text-sm">Pilihan pelanggan: diantar. Tarif dihitung live dari kota tujuan tersimpan dan berat produk × jumlah.</p>
                                            <label className="block text-sm">Ekspedisi<select required className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.shipping_courier} onChange={(event) => invoiceForm.setData('shipping_courier', event.target.value)}><option value="">Pilih ekspedisi</option>{shippingCouriers.map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}</select></label>
                                            {loadingRates && <p role="status">Memuat tarif live…</p>}
                                            {shippingError && <p role="alert" className="text-sm text-[var(--color-danger)]">{shippingError} Invoice pengiriman belum dapat disiapkan; tidak ada tarif pengganti otomatis.</p>}
                                            <label className="block text-sm">Layanan &amp; ongkir<select required disabled={loadingRates || !rates.length} className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.shipping_service} onChange={(event) => { const rate = rates.find((item) => item.service === event.target.value); invoiceForm.setData((data) => ({ ...data, shipping_service: event.target.value, shipping_amount: rate?.amount ?? 0 })); }}><option value="">Pilih tarif live</option>{rates.map((rate) => <option key={rate.service} value={rate.service}>{rate.service} · {rupiah(rate.amount)} · estimasi {rate.etd || 'tidak tersedia'}</option>)}</select></label>
                                        </div> : <p className="text-sm">Pilihan pelanggan: ambil di PNJ · Ongkir Rp 0</p>)}
                                        {(sel.is_preorder ? [['tax_rate', 'Pajak barang (%)', 'number'], ['due_date', 'Jatuh tempo', 'date'], ['notes', 'Catatan invoice', 'text']] : [['tax_rate', 'Pajak sewa (%)', 'number'], ['due_date', 'Jatuh tempo', 'date'], ['notes', 'Catatan invoice', 'text']]).map(([key, label, type]) => <label key={key} className="block text-sm">{label}<input required={key !== 'notes'} type={type} min={type === 'number' ? 0 : undefined} step={key === 'tax_rate' ? '0.01' : undefined} className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data[key]} onChange={(event) => invoiceForm.setData(key, event.target.value)} /></label>)}
                                        <label className="block text-sm">Rekening resmi BLU<select required className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.bank_id} onChange={(event) => invoiceForm.setData('bank_id', event.target.value)}><option value="">Pilih rekening</option>{bluBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.nama} · {bank.rekening} · {bank.holder}</option>)}</select></label>
                                        {Object.values(invoiceForm.errors).map((error) => <p role="alert" key={error} className="text-sm text-red-700">{error}</p>)}
                                        {sel.is_preorder && <button disabled={!bluBanks.length || invoiceForm.processing || (delivery && (loadingRates || !invoiceForm.data.shipping_service || !!shippingError))} className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-40">Simpan draf invoice</button>}
                                    </form>}
                                </section>}
                                {!sel.is_product && !sel.is_preorder && !sel.is_rental && sel.type === 'jasa' && (
                                    <section className="mt-5 space-y-2 rounded-2xl border border-[var(--color-border)] p-4" aria-label="Penetapan tarif">
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Penetapan tarif</h3>
                                        <p className="text-xs text-[var(--color-muted)]">
                                            {sel.is_rental && sel.status === 'Menunggu Invoice'
                                                ? <>Tarif dipakai pada draf invoice BLU sewa. Kosongkan untuk memakai tarif katalog.</>
                                                : <>Tarif dasar layanan {rupiah(sel.total)}. Isi tarif per satuan bila berbeda sesuai kebutuhan Customer; tarif ini dipakai saat invoice diterbitkan. Kosongkan untuk memakai tarif katalog.</>}
                                        </p>
                                        <label htmlFor="tarif-jasa" className="block text-sm">
                                            Tarif per satuan (Rp)
                                            <input
                                                id="tarif-jasa"
                                                inputMode="numeric"
                                                className="mt-1 block w-full rounded-xl border-[var(--color-border)]"
                                                value={tarifJasa === '' ? '' : Number(tarifJasa).toLocaleString('id-ID')}
                                                onChange={(event) => {
                                                    const digits = event.target.value.replace(/\D/g, '');
                                                    setTarifJasa(digits === '' ? '' : Number(digits));
                                                    invoiceForm.setData('unit_price', digits === '' ? '' : Number(digits));
                                                }}
                                            />
                                        </label>
                                    </section>
                                )}
                                {!sel.is_product && !sel.is_preorder && sel.type === 'produk' && delivery && (
                                    <section className="mt-5 space-y-2 rounded-2xl border border-[var(--color-border)] p-4" aria-label="Ongkir JNE">
                                        {sel.customer_shipping?.courier === 'jne' && sel.customer_shipping?.service ? (
                                            <>
                                                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Pengiriman JNE (dipilih Customer)</h3>
                                                <p className="text-xs text-[var(--color-muted)]">Customer telah memilih alamat, kurir, dan layanan saat checkout. Nominal final dihitung ulang server dari tarif live sebelum verifikasi disimpan.</p>
                                                <dl className="space-y-1.5 text-sm">
                                                    {sel.customer_shipping.address && (
                                                        <div className="flex justify-between gap-4">
                                                            <dt className="text-[var(--color-muted)]">Alamat</dt>
                                                            <dd className="text-right font-medium">{sel.customer_shipping.address}</dd>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between gap-4">
                                                        <dt className="text-[var(--color-muted)]">Kurir</dt>
                                                        <dd className="text-right font-medium">JNE</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <dt className="text-[var(--color-muted)]">Layanan dipilih</dt>
                                                        <dd className="text-right font-medium">{sel.customer_shipping.service}</dd>
                                                    </div>
                                                </dl>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Pengiriman JNE (lengkapi data pesanan lama)</h3>
                                                <p role="alert" className="text-xs text-[var(--color-danger)]">Pengajuan ini dibuat sebelum Customer memilih layanan pengiriman saat checkout. Pilih ekspedisi dan layanan JNE dari tarif live di bawah untuk melanjutkan verifikasi.</p>
                                                <label className="block text-sm">Ekspedisi
                                                    <select className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.shipping_courier} onChange={(event) => invoiceForm.setData('shipping_courier', event.target.value)}>
                                                        <option value="">Pilih ekspedisi</option>
                                                        <option value="jne">JNE</option>
                                                    </select>
                                                </label>
                                                {loadingRates && <p role="status">Memuat tarif live…</p>}
                                                {shippingError && <p role="alert" className="text-sm text-[var(--color-danger)]">{shippingError}</p>}
                                                <label className="block text-sm">Layanan &amp; ongkir
                                                    <select required disabled={loadingRates || !rates.length} className="mt-1 block w-full rounded-xl border-[var(--color-border)]" value={invoiceForm.data.shipping_service} onChange={(event) => { const rate = rates.find((item) => item.service === event.target.value); invoiceForm.setData((data) => ({ ...data, shipping_service: event.target.value, shipping_amount: rate?.amount ?? 0 })); }}>
                                                        <option value="">Pilih tarif live</option>
                                                        {rates.map((rate) => <option key={rate.service} value={rate.service}>{rate.service} · {rupiah(rate.amount)} · estimasi {rate.etd || 'tidak tersedia'}</option>)}
                                                    </select>
                                                </label>
                                            </>
                                        )}
                                    </section>
                                )}
                                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <ReviewPanel
                                        title="Panel peninjau"
                                        checklist={CHECKLIST}
                                        approveLabel="Verifikasi"
                                        onApprove={() => {
                                            if (sel.is_preorder && sel.invoice?.status !== 'draft') {
                                                invoiceForm.setError('invoice', 'Siapkan invoice BLU sebelum menyetujui pre-order.');
                                                return 'Siapkan invoice BLU sebelum menyetujui pre-order.';
                                            }
                                            if ((sel.type === 'jasa' || (sel.is_rental && !(rentalNeedsPimpinan && sel.status === 'Diajukan'))) && sel.invoice?.status !== 'draft' && (!invoiceForm.data.bank_id || !invoiceForm.data.due_date || invoiceForm.data.tax_rate === '')) {
                                                return 'Lengkapi rekening BLU, jatuh tempo, dan pajak sewa sebelum verifikasi.';
                                            }
                                            const needsShipping = !sel.is_product && !sel.is_preorder && sel.type === 'produk' && delivery;
                                            const hasCustomerShipping = sel.customer_shipping?.courier === 'jne' && sel.customer_shipping?.service;
                                            if (needsShipping && !hasCustomerShipping && !invoiceForm.data.shipping_service) {
                                                setShippingError('Pilih ekspedisi dan layanan JNE dari tarif live sebelum verifikasi.');
                                                return 'Pilih ekspedisi dan layanan JNE dari tarif live sebelum verifikasi.';
                                            }
                                            setProcessing(true);
                                            const approvalData = (sel.is_rental || sel.type === 'jasa') && sel.invoice?.status !== 'draft'
                                                ? { bank_id: invoiceForm.data.bank_id, due_date: invoiceForm.data.due_date, tax_rate: invoiceForm.data.tax_rate, notes: invoiceForm.data.notes }
                                                : {};
                                            if (tarifJasa !== '') approvalData.tarif_jasa = tarifJasa;
                                            if (needsShipping && !hasCustomerShipping) {
                                                approvalData.shipping_courier = invoiceForm.data.shipping_courier;
                                                approvalData.shipping_service = invoiceForm.data.shipping_service;
                                            }
                                            router.patch(route('rtpu.verify.layanan.approve', sel.id), approvalData, {
                                                onSuccess: () => router.visit(route('rtpu.verify.layanan')),
                                                onError: (errors) => { invoiceForm.setError(errors); setProcessing(false); },
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
                                        onReject={(catatan) => {
                                            setProcessing(true);
                                            router.patch(route('rtpu.verify.layanan.reject', sel.id), { catatan }, {
                                                onSuccess: () => router.visit(route('rtpu.verify.layanan')),
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        </Card>}
            </FadeIn>
        </DashboardLayout>
    );
}
