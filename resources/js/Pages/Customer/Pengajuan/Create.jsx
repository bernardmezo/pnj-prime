import { Head } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { mockLayanan } from '@/mocks/data';

const TIPE = [
    { value: 'jasa', label: 'Jasa', desc: 'Jasa pengujian dan layanan PNJ' },
    { value: 'ruangan', label: 'Ruangan', desc: 'Sewa ruangan dan fasilitas' },
    { value: 'produk', label: 'Produk', desc: 'Produk unggulan hasil riset' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

// TODO(backend): no pengajuan route yet. Submit shows a neutral notice;
// nothing is sent anywhere and no success is faked.
export default function PengajuanCreate({ auth, layanan }) {
    const role = auth?.user?.role;
    const [step, setStep] = useState(1);
    const [tipe, setTipe] = useState('jasa');
    const [form, setForm] = useState({
        layanan: '', keperluan: '', jumlah: '', tanggal: '',
        ruangan: '', mulai: '', selesai: '', peserta: '',
        produk: '', metode: '', catatan: '',
    });
    const [docs, setDocs] = useState([]);
    const [notice, setNotice] = useState(null);
    const options = layanan ?? mockLayanan.filter((l) => l.type === tipe && l.status === 'Aktif');

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const summary = () => {
        if (tipe === 'jasa') return [['Layanan', form.layanan], ['Keperluan', form.keperluan], ['Jumlah/unit', form.jumlah], ['Tanggal diharapkan', form.tanggal]];
        if (tipe === 'ruangan') return [['Ruangan', form.ruangan], ['Tanggal', form.tanggal], ['Jam', `${form.mulai || '-'} – ${form.selesai || '-'}`], ['Jumlah peserta', form.peserta], ['Keperluan', form.keperluan]];
        return [['Produk', form.produk], ['Jumlah', form.jumlah], ['Metode pengambilan', form.metode], ['Catatan', form.catatan]];
    };

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
                                onClick={() => setTipe(t.value)}
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
                        {tipe === 'jasa' && (
                            <>
                                <Field label="Layanan">
                                    <select value={form.layanan} onChange={(e) => set('layanan', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                        <option value="">Pilih layanan jasa…</option>
                                        {options.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Keperluan">
                                    <textarea value={form.keperluan} onChange={(e) => set('keperluan', e.target.value)} rows={3} placeholder="Untuk apa layanan ini dibutuhkan…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah / unit">
                                        <input value={form.jumlah} onChange={(e) => set('jumlah', e.target.value)} placeholder="mis. 3 sampel" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Tanggal diharapkan">
                                        <input type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                                <Field label="Dokumen pendukung (opsional)">
                                    <FileDropzone multiple files={docs} onChange={setDocs} hint="PDF, JPG, PNG. Maks. 5 MB per berkas." />
                                </Field>
                            </>
                        )}
                        {tipe === 'ruangan' && (
                            <>
                                <Field label="Ruangan">
                                    <select value={form.ruangan} onChange={(e) => set('ruangan', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                        <option value="">Pilih ruangan…</option>
                                        {options.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Tanggal">
                                    <input type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="Jam mulai">
                                        <input type="time" value={form.mulai} onChange={(e) => set('mulai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jam selesai">
                                        <input type="time" value={form.selesai} onChange={(e) => set('selesai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Jumlah peserta">
                                        <input type="number" min="1" value={form.peserta} onChange={(e) => set('peserta', e.target.value)} placeholder="mis. 20" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                </div>
                                <Field label="Keperluan">
                                    <textarea value={form.keperluan} onChange={(e) => set('keperluan', e.target.value)} rows={3} placeholder="Acara atau kegiatan…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </>
                        )}
                        {tipe === 'produk' && (
                            <>
                                <Field label="Produk">
                                    <select value={form.produk} onChange={(e) => set('produk', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                        <option value="">Pilih produk…</option>
                                        {options.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                                    </select>
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah">
                                        <input type="number" min="1" value={form.jumlah} onChange={(e) => set('jumlah', e.target.value)} placeholder="mis. 2" className={inputClass} {...inputStyleProps()} />
                                    </Field>
                                    <Field label="Metode pengambilan">
                                        <select value={form.metode} onChange={(e) => set('metode', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                            <option value="">Pilih metode…</option>
                                            <option value="Ambil di lokasi">Ambil di lokasi</option>
                                            <option value="Diantar">Diantar</option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Catatan">
                                    <textarea value={form.catatan} onChange={(e) => set('catatan', e.target.value)} rows={3} placeholder="Catatan tambahan (opsional)…" className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="mb-4 flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Tipe: {TYPE_LABEL[tipe]}</span>
                            <StatusBadge label="Draf" tone="neutral" />
                        </div>
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
                        {notice && (
                            <p className="mt-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                {notice}
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
                        <PrimaryButton onClick={() => setNotice('Pengiriman pengajuan belum tersedia. Backend perlu menyediakan endpoint pengajuan layanan.')}>
                            Kirim Pengajuan
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

