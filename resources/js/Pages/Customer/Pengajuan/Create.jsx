import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import OpsiPicker from '@/Components/OpsiPicker';
import PublicLayout from '@/Layouts/PublicLayout';
import Select from '@/Components/ui/Select';
import { Field, inputClass, inputStyleProps } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { useOpsiQuote } from '@/lib/useOpsiQuote';

const TIPE = [
    { value: 'jasa', label: 'Jasa', desc: 'Pengujian lab & konsultasi' },
    { value: 'ruangan', label: 'Ruangan', desc: 'Sewa ruang & fasilitas' },
    { value: 'produk', label: 'Produk', desc: 'Produk riset siap pakai' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

const METODE_OPTIONS = [
    { value: 'Ambil di lokasi', label: 'Ambil di lokasi (Gedung RTPU)' },
    { value: 'Diantar', label: 'Diantar via ekspedisi' },
];

export default function PengajuanCreate({ auth, layanan = [], selected = {} }) {
    const role = auth?.user?.role;
    const locked = Boolean(selected?.product_id);
    const [step, setStep] = useState(locked ? 3 : 1);
    const [tipe, setTipe] = useState(selected?.tipe ?? 'jasa');
    const [docs, setDocs] = useState([]);
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
    const productId = data.product_id ? Number(data.product_id) : (selected?.product_id ? Number(selected.product_id) : null);

    const opsiPayload = useMemo(
        () => Object.entries(selectedOpsi).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) || 1 })),
        [selectedOpsi],
    );

    const { quote, loading } = useOpsiQuote({
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
    const currentPrice = Number(current?.price ?? selected?.price ?? 0);

    const submit = (e) => {
        e?.preventDefault();
        router.post(
            route('customer.pengajuan.store'),
            { ...data, dokumen: docs, opsi: opsiPayload },
            {
                onSuccess: () => {
                    setDocs([]);
                    reset();
                },
                onFinish: () => reset(),
            },
        );
    };

    const picked = opsiOptions.filter((o) => selectedOpsi[o.id] != null);
    const parsedQty = parseInt(String(data.jumlah || '1'), 10) || 1;
    const baseTotal = currentPrice * (tipe === 'produk' ? parsedQty : 1);
    const displaySubtotal = quote?.subtotal != null ? quote.subtotal : baseTotal;
    const displayPpn = quote?.ppn != null ? quote.ppn : Math.round(displaySubtotal * 0.12);
    const displayTotal = quote?.total != null ? quote.total : displaySubtotal + displayPpn;

    return (
        <PublicLayout auth={auth}>
            <Head title={`Ajukan Layanan · ${selectedName || 'PNJ Prime'}`} />

            <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
                {/* Back button */}
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali
                </button>

                {/* Title */}
                <div className="mt-4">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                        Ajukan Layanan
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {locked ? selectedName : 'Isi formulir pengajuan layanan di bawah ini.'}
                    </p>
                </div>

                {/* Stepper (Only if unlocked) */}
                {!locked && (
                    <div className="mt-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xs">
                        {[
                            { num: 1, label: 'Kategori' },
                            { num: 2, label: 'Layanan' },
                            { num: 3, label: 'Detail' },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                        step === s.num
                                            ? 'bg-emerald-600 text-white'
                                            : step > s.num
                                              ? 'bg-slate-200 text-slate-700'
                                              : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                                </span>
                                <span className={step === s.num ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                                    {s.label}
                                </span>
                                {i < 2 && <span className="text-slate-300">/</span>}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 space-y-6">
                    {/* Unlocked Step 1: Type Selection */}
                    {!locked && step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {TIPE.map((t) => {
                                    const isPicked = tipe === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => pickTipe(t.value)}
                                            className={`rounded-2xl border p-4 text-left transition ${
                                                isPicked
                                                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="block text-sm font-bold text-slate-900">{t.label}</span>
                                            <span className="mt-0.5 block text-xs text-slate-500">{t.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                                >
                                    Lanjut
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Unlocked Step 2: Service Selection */}
                    {!locked && step === 2 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <Select
                                label={`Pilih ${TYPE_LABEL[tipe]}`}
                                value={data.product_id}
                                onChange={pickProduct}
                                options={options.map((o) => ({
                                    value: o.id,
                                    label: `${o.name} — Rp ${Number(o.price ?? 0).toLocaleString('id-ID')}`,
                                }))}
                                error={errors.product_id}
                                placeholder="Pilih..."
                            />
                            <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    disabled={!data.product_id}
                                    onClick={() => setStep(3)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
                                >
                                    Lanjut
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 or Locked: Form */}
                    {(locked || step === 3) && (
                        <div className="space-y-6">
                            {/* Selected Item Bar */}
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                                        {TYPE_LABEL[tipe]}
                                    </span>
                                    <h2 className="font-display text-base font-bold text-slate-900">
                                        {selectedName}
                                    </h2>
                                </div>
                                {currentPrice > 0 && (
                                    <span className="font-mono text-sm font-semibold text-slate-700">
                                        Rp {currentPrice.toLocaleString('id-ID')}
                                    </span>
                                )}
                            </div>

                            {/* Form Card */}
                            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                {tipe === 'produk' && (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Jumlah Unit" error={errors.jumlah} htmlFor="f-jumlah">
                                                <input
                                                    id="f-jumlah"
                                                    type="number"
                                                    min="1"
                                                    value={data.jumlah}
                                                    onChange={(e) => setData('jumlah', e.target.value)}
                                                    placeholder="1"
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                            <Select
                                                label="Metode Pengambilan"
                                                value={data.metode_pengambilan}
                                                onChange={(v) => setData('metode_pengambilan', v)}
                                                options={METODE_OPTIONS}
                                                error={errors.metode_pengambilan}
                                                placeholder="Pilih metode..."
                                            />
                                        </div>
                                        <Field label="Catatan (opsional)" error={errors.catatan} htmlFor="f-catatan">
                                            <textarea
                                                id="f-catatan"
                                                value={data.catatan}
                                                onChange={(e) => setData('catatan', e.target.value)}
                                                rows={2}
                                                placeholder="Catatan tambahan..."
                                                className={inputClass}
                                                {...inputStyleProps()}
                                            />
                                        </Field>
                                    </>
                                )}

                                {tipe === 'jasa' && (
                                    <>
                                        <Field label="Tujuan / Keperluan" error={errors.keperluan} htmlFor="f-keperluan">
                                            <textarea
                                                id="f-keperluan"
                                                value={data.keperluan}
                                                onChange={(e) => setData('keperluan', e.target.value)}
                                                rows={2}
                                                placeholder="Keperluan layanan..."
                                                className={inputClass}
                                                {...inputStyleProps()}
                                            />
                                        </Field>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Jumlah / Sampel" error={errors.jumlah} htmlFor="f-jumlah">
                                                <input
                                                    id="f-jumlah"
                                                    value={data.jumlah}
                                                    onChange={(e) => setData('jumlah', e.target.value)}
                                                    placeholder="mis. 1 sampel"
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                            <Field label="Tanggal Diharapkan" error={errors.tanggal} htmlFor="f-tanggal">
                                                <input
                                                    id="f-tanggal"
                                                    type="date"
                                                    value={data.tanggal}
                                                    onChange={(e) => setData('tanggal', e.target.value)}
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Dokumen Pendukung (opsional)" error={errors.dokumen} htmlFor={null}>
                                            <FileDropzone
                                                multiple
                                                files={docs}
                                                onChange={setDocs}
                                                hint="PDF, JPG, PNG (maks. 5 MB)"
                                            />
                                        </Field>
                                    </>
                                )}

                                {tipe === 'ruangan' && (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Tanggal Pemakaian" error={errors.tanggal} htmlFor="f-tanggal">
                                                <input
                                                    id="f-tanggal"
                                                    type="date"
                                                    value={data.tanggal}
                                                    onChange={(e) => setData('tanggal', e.target.value)}
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                            <Field label="Jumlah Peserta" error={errors.peserta} htmlFor="f-peserta">
                                                <input
                                                    id="f-peserta"
                                                    type="number"
                                                    min="1"
                                                    value={data.peserta}
                                                    onChange={(e) => setData('peserta', e.target.value)}
                                                    placeholder="mis. 20"
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Jam Mulai" error={errors.jam_mulai} htmlFor="f-mulai">
                                                <input
                                                    id="f-mulai"
                                                    type="time"
                                                    value={data.jam_mulai}
                                                    onChange={(e) => setData('jam_mulai', e.target.value)}
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                            <Field label="Jam Selesai" error={errors.jam_selesai} htmlFor="f-jam_selesai">
                                                <input
                                                    id="f-jam_selesai"
                                                    type="time"
                                                    value={data.jam_selesai}
                                                    onChange={(e) => setData('jam_selesai', e.target.value)}
                                                    className={inputClass}
                                                    {...inputStyleProps()}
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Acara / Kegiatan" error={errors.keperluan} htmlFor="f-keperluan">
                                            <textarea
                                                id="f-keperluan"
                                                value={data.keperluan}
                                                onChange={(e) => setData('keperluan', e.target.value)}
                                                rows={2}
                                                placeholder="Nama kegiatan..."
                                                className={inputClass}
                                                {...inputStyleProps()}
                                            />
                                        </Field>
                                    </>
                                )}

                                {/* Opsi if any */}
                                {opsiOptions.length > 0 && (
                                    <div className="border-t border-slate-100 pt-4">
                                        <span className="mb-2 block text-xs font-semibold text-slate-800">
                                            Opsi Tambahan
                                        </span>
                                        <OpsiPicker options={opsiOptions} value={selectedOpsi} onChange={setSelectedOpsi} />
                                    </div>
                                )}

                                {/* Price summary */}
                                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Estimasi Subtotal</span>
                                        <span className="font-mono text-slate-800">Rp {displaySubtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                                        <span>Estimasi PPN (12%)</span>
                                        <span className="font-mono text-slate-800">Rp {displayPpn.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t border-slate-200/80 pt-2 text-sm font-bold text-slate-900">
                                        <span>Total Estimasi</span>
                                        <span className="font-mono text-emerald-700">Rp {displayTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-40"
                                    >
                                        {processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
