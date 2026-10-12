import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field, PageHeader, PrimaryButton, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

const TIPE = [
    { value: 'jasa', label: 'Jasa', desc: 'Jasa pengujian dan layanan PNJ' },
    { value: 'ruangan', label: 'Ruangan', desc: 'Sewa ruangan dan fasilitas' },
    { value: 'produk', label: 'Produk', desc: 'Produk unggulan hasil riset' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function PengajuanCreate({ auth, layanan = [], selected = {} }) {
    const role = auth?.user?.role;
    const locked = Boolean(selected?.product_id);
    const [step, setStep] = useState(locked ? 3 : 1);
    const [tipe, setTipe] = useState(selected?.tipe ?? 'jasa');
    const [docs, setDocs] = useState([]);
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

    const pickTipe = (v) => {
        setTipe(v);
        setData('tipe', v);
    };

    const options = layanan.filter((l) => l.type === tipe);
    const selectedName = options.find((o) => String(o.id) === String(data.product_id))?.name ?? '';

    // Inertia converts File objects in the payload to FormData automatically.
    const submit = (e) => {
        e.preventDefault();
        router.post(route('customer.pengajuan.store'), { ...data, dokumen: docs }, {
            onSuccess: () => { setDocs([]); reset(); },
            onFinish: () => reset(),
        });
    };

    const summary = () => {
        if (tipe === 'jasa') return [['Layanan', selectedName || selected?.name || '-'], ['Keperluan', data.keperluan], ['Jumlah/unit', data.jumlah], ['Tanggal diharapkan', data.tanggal]];
        if (tipe === 'ruangan') return [['Ruangan', selectedName || selected?.name || '-'], ['Tanggal', data.tanggal], ['Jam', `${data.jam_mulai || '-'} – ${data.jam_selesai || '-'}`], ['Jumlah peserta', data.peserta], ['Keperluan', data.keperluan]];
        return [['Produk', selectedName || selected?.name || '-'], ['Jumlah', data.jumlah], ['Metode pengambilan', data.metode_pengambilan], ['Catatan', data.catatan]];
    };

    const estimate = tipe === 'produk' && selected?.price
        ? Number(selected.price) * (parseInt(String(data.jumlah), 10) > 0 ? parseInt(String(data.jumlah), 10) : 1)
        : null;

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
                                <Field label="Metode pengambilan" error={errors.metode_pengambilan} htmlFor="f-metode">
                                    <select id="f-metode" value={data.metode_pengambilan} onChange={(e) => setData('metode_pengambilan', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                        <option value="">Pilih metode…</option>
                                        <option value="Ambil di lokasi">Ambil di lokasi</option>
                                        <option value="Diantar">Diantar</option>
                                    </select>
                                </Field>
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
                        <Field label={tipe === 'jasa' ? 'Layanan' : tipe === 'ruangan' ? 'Ruangan' : 'Produk'} error={errors.product_id} htmlFor="f-layanan">
                            <select id="f-layanan" value={data.product_id} onChange={(e) => setData('product_id', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                <option value="">Pilih…</option>
                                {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </Field>
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
                                    <Field label="Metode pengambilan" error={errors.metode_pengambilan} htmlFor="f-metode">
                                        <select id="f-metode" value={data.metode_pengambilan} onChange={(e) => setData('metode_pengambilan', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                            <option value="">Pilih metode…</option>
                                            <option value="Ambil di lokasi">Ambil di lokasi</option>
                                            <option value="Diantar">Diantar</option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Catatan" error={errors.catatan} htmlFor="f-catatan">
                                    <textarea id="f-catatan" value={data.catatan} onChange={(e) => setData('catatan', e.target.value)} rows={3} placeholder="Catatan tambahan (opsional)…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </>
                        )}
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
