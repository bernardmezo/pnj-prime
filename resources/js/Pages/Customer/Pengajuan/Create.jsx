import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import OpsiBreakdown from '@/Components/OpsiBreakdown';
import OpsiPicker from '@/Components/OpsiPicker';
import PublicLayout from '@/Layouts/PublicLayout';
import Select from '@/Components/ui/Select';
import { Field, PageHeader, PrimaryButton, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { useOpsiQuote } from '@/lib/useOpsiQuote';

const TIPE = [
    { value: 'jasa', label: 'Jasa', desc: 'Jasa pengujian dan layanan PNJ' },
    { value: 'ruangan', label: 'Ruangan', desc: 'Sewa ruangan dan fasilitas' },
    { value: 'produk', label: 'Produk', desc: 'Produk unggulan hasil riset' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

const METODE_OPTIONS = [
    { value: 'Ambil di lokasi', label: 'Ambil di lokasi' },
    { value: 'Diantar', label: 'Diantar' },
];

export default function PengajuanCreate({ auth, layanan = [], selected = {} }) {
    const role = auth?.user?.role;
    const locked = Boolean(selected?.product_id);
    const [step, setStep] = useState(locked ? 3 : 1);
    const [tipe, setTipe] = useState(selected?.tipe ?? 'jasa');
    const [docs, setDocs] = useState([]);
    // `{ [opsiId]: qty }` for the picked add-ons. Prices are never held here.
    const [selectedOpsi, setSelectedOpsi] = useState({});
    const { data, setData, processing, errors, reset } = useForm({
        tipe: selected?.tipe ?? 'jasa',
        product_id: selected?.product_id ?? '',
        keperluan: '',
        jumlah: '',
        tanggal: '',
        jam_mulai: '',
        jam_selesai: '',
        peserta: '',
        metode_pengambilan: '',
        catatan: '',
    });

    const options = layanan.filter((l) => l.type === tipe);
    const current = locked
        ? selected
        : options.find((o) => String(o.id) === String(data.product_id)) ?? null;
    const opsiOptions = current?.opsi ?? [];
    const productId = data.product_id ? Number(data.product_id) : null;

    const opsiPayload = useMemo(
        () => Object.entries(selectedOpsi).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) || 1 })),
        [selectedOpsi],
    );

    // The quote comes from the server; the client only renders it.
    const { quote, loading, error } = useOpsiQuote({
        productId,
        tipe,
        selection: {
            jumlah: data.jumlah,
            peserta: data.peserta,
            jam_mulai: data.jam_mulai,
            jam_selesai: data.jam_selesai,
        },
        opsi: opsiPayload,
    });

    const pickTipe = (v) => {
        setTipe(v);
        setData('tipe', v);
        setData('product_id', '');
        setSelectedOpsi({});
    };

    const pickProduct = (v) => {
        setData('product_id', v);
        setSelectedOpsi({});
    };

    const selectedName = current?.name ?? (locked ? selected?.name ?? '' : '');

    // Inertia converts File objects in the payload to FormData automatically.
    const submit = (e) => {
        e.preventDefault();
        router.post(route('customer.pengajuan.store'), { ...data, dokumen: docs, opsi: opsiPayload }, {
            onSuccess: () => { setDocs([]); reset(); },
            onFinish: () => reset(),
        });
    };

    const picked = opsiOptions.filter((o) => selectedOpsi[o.id] != null);

    const summary = () => {
        let rows;
        if (tipe === 'jasa') rows = [['Layanan', selectedName || selected?.name || '-'], ['Keperluan', data.keperluan], ['Jumlah/unit', data.jumlah], ['Tanggal diharapkan', data.tanggal]];
        else if (tipe === 'ruangan') rows = [['Ruangan', selectedName || selected?.name || '-'], ['Tanggal', data.tanggal], ['Jam', `${data.jam_mulai || '-'} – ${data.jam_selesai || '-'}`], ['Jumlah peserta', data.peserta], ['Keperluan', data.keperluan]];
        else rows = [['Produk', selectedName || selected?.name || '-'], ['Jumlah', data.jumlah], ['Metode pengambilan', data.metode_pengambilan], ['Catatan', data.catatan]];

        if (opsiOptions.length > 0) {
            rows = [...rows, ['Opsi & add-on', picked.length > 0 ? picked.map((o) => `${o.nama}${selectedOpsi[o.id] > 1 ? ` ×${selectedOpsi[o.id]}` : ''}`).join(', ') : 'Tidak ada tambahan']];
        }

        return rows;
    };

    const estimate = tipe === 'produk' && selected?.price
        ? Number(selected.price) * (parseInt(String(data.jumlah), 10) > 0 ? parseInt(String(data.jumlah), 10) : 1)
        : null;

    const opsiSection = opsiOptions.length > 0 ? (
        <div className="space-y-4">
            <OpsiPicker options={opsiOptions} value={selectedOpsi} onChange={setSelectedOpsi} />
            <OpsiBreakdown
                lines={quote?.lines}
                subtotal={quote?.subtotal}
                ppn={quote?.ppn}
                total={quote?.total}
                showTotals
                loading={loading}
                error={error}
                title="Ringkasan biaya"
                emptyText="Harga dihitung oleh server setelah layanan dan tambahan Anda dipilih."
            />
        </div>
    ) : null;

    // Direct path (from catalog "Ajukan Layanan"): single review-and-fill
    // page for the locked item, no type picker, no step indicator.
    if (locked) {
        return (
            <PublicLayout auth={auth}>
                <Head title={`Ajukan ${selected?.name ?? 'Layanan'} · PNJ Prime`} />
                <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
                    <PageHeader
                        eyebrow={TYPE_LABEL[tipe]}
                        title={selected?.name ?? 'Ajukan Layanan'}
                        desc="Lengkapi detail di bawah ini, lalu kirim pengajuan Anda."
                    />
                    <div className="flex items-center justify-between gap-3 rounded-2xl p-5" style={{ background: 'var(--color-deep)' }}>
                        <span>
                            <span className="block font-mono text-[13px] font-semibold text-white">
                                Rp {Number(selected?.price ?? 0).toLocaleString('id-ID')}
                                {estimate !== null && data.jumlah ? ` × ${data.jumlah} = Rp ${estimate.toLocaleString('id-ID')}` : ''}
                            </span>
                            <span className="mt-0.5 block text-xs text-white/60">Estimasi tagihan, ditetapkan saat verifikasi</span>
                        </span>
                        <StatusBadge label={TYPE_LABEL[tipe]} tone="teal" />
                    </div>

                    <div className="mt-6 space-y-4">
                        {tipe === 'produk' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Jumlah" error={errors.jumlah} htmlFor="f-jumlah">
                                    <input id="f-jumlah" type="number" min="1" value={data.jumlah} onChange={(e) => setData('jumlah', e.target.value)} placeholder="mis. 2" className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <Select
                                    label="Metode pengambilan"
                                    value={data.metode_pengambilan}
                                    onChange={(v) => setData('metode_pengambilan', v)}
                                    options={METODE_OPTIONS}
                                    error={errors.metode_pengambilan}
                                    placeholder="Pilih metode…"
                                />
                            </div>
                        )}
                        {tipe === 'jasa' && (
                            <>
                                <Field label="Keperluan" error={errors.keperluan} htmlFor="f-keperluan">
                                    <textarea id="f-keperluan" value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} rows={3} placeholder="Untuk apa layanan ini dibutuhkan…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah / unit" error={errors.jumlah} htmlFor="f-jumlah">
                                        <input id="f-jumlah" value={data.jumlah} onChange={(e) => setData('jumlah', e.target.value)} placeholder="mis. 3 sampel" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Tanggal diharapkan" error={errors.tanggal} htmlFor="f-tanggal">
                                        <input id="f-tanggal" type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                                <Field label="Dokumen pendukung (opsional)" error={errors.dokumen} htmlFor={null}>
                                    <FileDropzone multiple files={docs} onChange={setDocs} hint="PDF, JPG, PNG. Maks. 5 MB per berkas." />
                                </Field>
                            </>
                        )}
                        {tipe === 'ruangan' && (
                            <>
                                <Field label="Tanggal" error={errors.tanggal} htmlFor="f-tanggal">
                                    <input id="f-tanggal" type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="Jam mulai" error={errors.jam_mulai} htmlFor="f-mulai">
                                        <input id="f-mulai" type="time" value={data.jam_mulai} onChange={(e) => setData('jam_mulai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jam selesai" error={errors.jam_selesai} htmlFor="f-jam_selesai">
                                        <input id="f-jam_selesai" type="time" value={data.jam_selesai} onChange={(e) => setData('jam_selesai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jumlah peserta" error={errors.peserta} htmlFor="f-peserta">
                                        <input id="f-peserta" type="number" min="1" value={data.peserta} onChange={(e) => setData('peserta', e.target.value)} placeholder="mis. 20" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                                <Field label="Keperluan" error={errors.keperluan} htmlFor="f-keperluan">
                                    <textarea id="f-keperluan" value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} rows={3} placeholder="Acara atau kegiatan…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </>
                        )}
                        {tipe === 'produk' && (
                            <Field label="Catatan" error={errors.catatan} htmlFor="f-catatan">
                                <textarea id="f-catatan" value={data.catatan} onChange={(e) => setData('catatan', e.target.value)} rows={2} placeholder="Catatan tambahan (opsional)…" className={inputClass} {...inputStyleProps()} />
                            </Field>
                        )}
                        {opsiSection}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </button>
                        <PrimaryButton onClick={submit} disabled={processing}>
                            {processing ? 'Mengirim…' : 'Kirim Pengajuan'}
                        </PrimaryButton>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout auth={auth}>
            <Head title="Ajukan Layanan · PNJ Prime" />
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow="Customer"
                    title="Ajukan Layanan"
                    desc="Pilih tipe layanan, lengkapi formulir, lalu periksa kembali sebelum dikirim."
                />

                {/* Step indicator */}
                <ol className="mb-8 flex items-center gap-2">
                    {['Pilih tipe', 'Isi formulir', 'Periksa'].map((label, i) => (
                        <li key={label} className="flex flex-1 items-center gap-2">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                                style={
                                    step > i + 1
                                        ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                                        : step === i + 1
                                          ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent-hover)', background: 'var(--color-accent-tint)' }
                                          : { borderColor: 'var(--color-border)', color: 'var(--color-muted)' }
                                }
                            >
                                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                            </span>
                            <span className="hidden text-sm font-medium sm:block" style={{ color: step >= i + 1 ? 'var(--color-ink)' : 'var(--color-muted)' }}>
                                {label}
                            </span>
                            {i < 2 && <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />}
                        </li>
                    ))}
                </ol>

                {step === 1 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {TIPE.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => pickTipe(t.value)}
                                aria-pressed={tipe === t.value}
                                className="rounded-2xl border p-5 text-left transition"
                                style={
                                    tipe === t.value
                                        ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                        : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                }
                            >
                                <span className="block font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>{t.label}</span>
                                <span className="mt-1 block text-[13px]" style={{ color: 'var(--color-muted)' }}>{t.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <Select
                            label={tipe === 'jasa' ? 'Layanan' : tipe === 'ruangan' ? 'Ruangan' : 'Produk'}
                            value={data.product_id}
                            onChange={pickProduct}
                            options={options.map((o) => ({ value: o.id, label: o.name }))}
                            error={errors.product_id}
                            placeholder="Pilih…"
                        />
                        {(tipe === 'jasa' || tipe === 'ruangan') && (
                            <Field label="Keperluan" error={errors.keperluan} htmlFor="f-keperluan">
                                <textarea id="f-keperluan" value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} rows={3} placeholder="Untuk apa layanan ini dibutuhkan…" className={inputClass} {...inputStyleProps()} />
                            </Field>
                        )}
                        {tipe === 'jasa' && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah / unit" error={errors.jumlah} htmlFor="f-jumlah">
                                        <input id="f-jumlah" value={data.jumlah} onChange={(e) => setData('jumlah', e.target.value)} placeholder="mis. 3 sampel" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Tanggal diharapkan" error={errors.tanggal} htmlFor="f-tanggal">
                                        <input id="f-tanggal" type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                                <Field label="Dokumen pendukung (opsional)" error={errors.dokumen} htmlFor={null}>
                                    <FileDropzone multiple files={docs} onChange={setDocs} hint="PDF, JPG, PNG. Maks. 5 MB per berkas." />
                                </Field>
                            </>
                        )}
                        {tipe === 'ruangan' && (
                            <>
                                <Field label="Tanggal" error={errors.tanggal} htmlFor="f-tanggal">
                                    <input id="f-tanggal" type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="Jam mulai" error={errors.jam_mulai} htmlFor="f-mulai">
                                        <input id="f-mulai" type="time" value={data.jam_mulai} onChange={(e) => setData('jam_mulai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jam selesai" error={errors.jam_selesai} htmlFor="f-jam_selesai">
                                        <input id="f-jam_selesai" type="time" value={data.jam_selesai} onChange={(e) => setData('jam_selesai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jumlah peserta" error={errors.peserta} htmlFor="f-peserta">
                                        <input id="f-peserta" type="number" min="1" value={data.peserta} onChange={(e) => setData('peserta', e.target.value)} placeholder="mis. 20" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                            </>
                        )}
                        {tipe === 'produk' && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah" error={errors.jumlah} htmlFor="f-jumlah">
                                        <input id="f-jumlah" type="number" min="1" value={data.jumlah} onChange={(e) => setData('jumlah', e.target.value)} placeholder="mis. 2" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Select
                                        label="Metode pengambilan"
                                        value={data.metode_pengambilan}
                                        onChange={(v) => setData('metode_pengambilan', v)}
                                        options={METODE_OPTIONS}
                                        error={errors.metode_pengambilan}
                                        placeholder="Pilih metode…"
                                    />
                                </div>
                                <Field label="Catatan" error={errors.catatan} htmlFor="f-catatan">
                                    <textarea id="f-catatan" value={data.catatan} onChange={(e) => setData('catatan', e.target.value)} rows={3} placeholder="Catatan tambahan (opsional)…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </>
                        )}
                        {opsiSection}
                    </div>
                )}

                {step === 3 && (
                    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
                        <dl className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {summary().map(([k, v]) => (
                                <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                    <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v || '-'}</dd>
                                </div>
                            ))}
                        </dl>
                        {docs.length > 0 && (
                            <p className="mt-3 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                {docs.length} dokumen pendukung dilampirkan.
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (step === 1 ? window.history.back() : setStep(step - 1))}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold"
                        style={{ color: 'var(--color-muted)' }}
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                    {step < 3 ? (
                        <PrimaryButton onClick={() => setStep(step + 1)}>
                            Lanjut <ArrowRight className="h-4 w-4" />
                        </PrimaryButton>
                    ) : (
                        <PrimaryButton onClick={submit} disabled={processing}>
                            {processing ? 'Mengirim…' : 'Kirim Pengajuan'}
                        </PrimaryButton>
                    )}
                </div>
                <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    <a href={navHref('customer.pengajuan.index', {}, role)} className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                        Lihat Pengajuan Saya
                    </a>
                </p>
            </div>
        </PublicLayout>
    );
}
