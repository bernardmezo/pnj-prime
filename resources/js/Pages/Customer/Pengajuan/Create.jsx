import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import Select from '@/Components/ui/Select';
import { Field } from '@/Components/ui';
import { useOpsiQuote } from '@/lib/useOpsiQuote';

const TIPE = [
    { value: 'jasa', label: 'Jasa', desc: 'Pengujian lab & konsultasi teknis' },
    { value: 'ruangan', label: 'Ruangan', desc: 'Sewa ruang & fasilitas kampus' },
    { value: 'produk', label: 'Produk', desc: 'Produk riset siap pakai' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

const METODE_OPTIONS = [
    { value: 'Ambil di lokasi', label: 'Ambil di lokasi (Gedung RTPU)' },
    { value: 'Diantar', label: 'Diantar via ekspedisi' },
];

export default function PengajuanCreate({ auth, layanan = [], selected = {} }) {
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

    const [cities, setCities] = useState([
        { city_id: '152', city_name: 'Depok', type: 'Kota' },
        { city_id: '23', city_name: 'Jakarta Selatan', type: 'Kota' },
        { city_id: '22', city_name: 'Jakarta Pusat', type: 'Kota' },
        { city_id: '21', city_name: 'Jakarta Barat', type: 'Kota' },
        { city_id: '24', city_name: 'Jakarta Timur', type: 'Kota' },
        { city_id: '25', city_name: 'Jakarta Utara', type: 'Kota' },
        { city_id: '155', city_name: 'Bogor', type: 'Kota' },
        { city_id: '78', city_name: 'Bekasi', type: 'Kota' },
        { city_id: '115', city_name: 'Tangerang', type: 'Kota' },
        { city_id: '114', city_name: 'Tangerang Selatan', type: 'Kota' },
        { city_id: '54', city_name: 'Bandung', type: 'Kota' },
        { city_id: '399', city_name: 'Surabaya', type: 'Kota' },
        { city_id: '444', city_name: 'Semarang', type: 'Kota' },
        { city_id: '501', city_name: 'Yogyakarta', type: 'Kota' },
    ]);
    const [selectedCity, setSelectedCity] = useState('152');
    const [courier, setCourier] = useState('jne');
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingOptions, setShippingOptions] = useState([]);
    const [loadingShipping, setLoadingShipping] = useState(false);
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingError, setShippingError] = useState('');

    useEffect(() => {
        fetch('/api/shipping/cities')
            .then((r) => r.json())
            .then((data) => {
                if (data?.success && Array.isArray(data.cities) && data.cities.length > 0) {
                    setCities(data.cities);
                }
            })
            .catch(() => {});
    }, []);

    const calculateOngkir = (cityId, chosenCourier) => {
        if (!cityId || !chosenCourier) {
            setShippingCost(0);
            return;
        }
        setLoadingShipping(true);
        const itemWeight = Number(current?.weight ?? current?.meta?.weight ?? 1000);
        const totalWeight = itemWeight * (Number(data.jumlah) || 1);

        // Simulasi variasi ongkir berdasarkan kota tujuan agar dinamis & realistis
        let cityMultiplier = 1;
        const idNum = Number(cityId);
        if (idNum === 152 || idNum === 151 || idNum === 78) {
            cityMultiplier = 1; // Jabodetabek dekat (Depok, Jaksel, Jakpus, Bekasi)
        } else if (idNum >= 20 && idNum <= 30) {
            cityMultiplier = 1.2; // Area Jakarta lainnya
        } else if (idNum === 155 || idNum === 114 || idNum === 115) {
            cityMultiplier = 1.3; // Bogor, Tangerang
        } else if (idNum === 54) {
            cityMultiplier = 1.8; // Bandung
        } else {
            cityMultiplier = 2.5; // Luar Jabodetabek / Jawa
        }

        fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                destination: cityId,
                courier: chosenCourier,
                weight: totalWeight,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                setLoadingShipping(false);
                if (res?.success && Array.isArray(res.costs) && res.costs.length > 0) {
                    const costs = res.costs[0]?.costs || [];
                    setShippingOptions(costs);
                    if (costs.length > 0 && costs[0]?.cost?.[0]?.value) {
                        const baseVal = costs[0].cost[0].value;
                        const val = Math.round(baseVal * cityMultiplier);
                        setShippingCost(val);
                        setData('catatan', `Pengiriman ke ${cityId} via ${chosenCourier.toUpperCase()} (${costs[0].service}) - Rp ${val.toLocaleString('id-ID')}`);
                    }
                } else {
                    const fallbackVal = Math.round(15000 * cityMultiplier * Math.max(1, Math.ceil(totalWeight / 1000)));
                    setShippingCost(fallbackVal);
                    setData('catatan', `Pengiriman ke ${cityId} via ${chosenCourier.toUpperCase()} (Reguler) - Rp ${fallbackVal.toLocaleString('id-ID')}`);
                }
            })
            .catch(() => {
                setLoadingShipping(false);
                const fallbackVal = Math.round(15000 * cityMultiplier * Math.max(1, Math.ceil(totalWeight / 1000)));
                setShippingCost(fallbackVal);
            });
    };

    useEffect(() => {
        if (selectedCity && data.metode_pengambilan === 'Diantar') {
            calculateOngkir(selectedCity, courier);
        }
    }, [selectedCity, courier, data.jumlah, data.metode_pengambilan]);

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

    const { quote } = useOpsiQuote({
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
        setShippingError('');
        if (tipe === 'produk' && data.metode_pengambilan === 'Diantar') {
            if (!shippingAddress.trim()) {
                setShippingError('Alamat pengiriman lengkap wajib diisi.');
                return;
            }
            if (!selectedCity) {
                setShippingError('Kota tujuan pengiriman wajib dipilih.');
                return;
            }
            if (!courier) {
                setShippingError('Kurir ekspedisi pengiriman wajib dipilih.');
                return;
            }
        }
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

    const parsedQty = parseInt(String(data.jumlah || '1'), 10) || 1;
    const baseTotal = currentPrice * (tipe === 'produk' ? parsedQty : 1);
    const displaySubtotal = (quote?.subtotal != null ? quote.subtotal : baseTotal) + (data.metode_pengambilan === 'Diantar' ? shippingCost : 0);
    const displayPpn = quote?.ppn != null ? quote.ppn : Math.round(displaySubtotal * 0.12);
    const displayTotal = quote?.total != null ? (quote.total + (data.metode_pengambilan === 'Diantar' ? shippingCost : 0)) : displaySubtotal + displayPpn;
    const totalAddons = Math.max(0, (quote?.subtotal != null ? quote.subtotal : baseTotal) - baseTotal);

    const inputBaseClass =
        'block w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]';

    const termasukItems = opsiOptions.filter((o) => o.jenis === 'termasuk');
    const addonItems = opsiOptions.filter((o) => o.jenis !== 'termasuk');

    return (
        <PublicLayout auth={auth}>
            <Head title={`Ajukan Layanan · ${selectedName || 'PNJ Prime'}`} />

            <div className="mx-auto w-full max-w-[640px] px-4 py-8 sm:px-6">
                {/* Header: small Kembali text link */}
                <div>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali</span>
                    </button>
                </div>

                {/* Page Title & Muted line naming product */}
                <div className="mt-4">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                        Ajukan Layanan
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {selectedName ? selectedName : 'Lengkapi detail permohonan layanan riset PNJ.'}
                    </p>
                </div>

                {/* Plain product row: Name left, base price right, separated by thin divider */}
                {selectedName ? (
                    <div className="mt-6 border-b border-[var(--color-border)] pb-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-[var(--color-ink)] text-sm sm:text-base">
                                {selectedName}
                            </span>
                            {currentPrice > 0 && (
                                <span className="tabular-nums font-semibold text-[var(--color-ink)] text-sm sm:text-base whitespace-nowrap">
                                    Rp {currentPrice.toLocaleString('id-ID')}
                                </span>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Unlocked Stepper if not locked */}
                {!locked && (
                    <div className="mt-6 flex items-center gap-3 border-b border-[var(--color-border)] pb-4 text-xs">
                        {[
                            { num: 1, label: 'Kategori' },
                            { num: 2, label: 'Layanan' },
                            { num: 3, label: 'Detail' },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                        step === s.num
                                            ? 'bg-[var(--color-deep)] text-white'
                                            : step > s.num
                                              ? 'bg-[var(--color-accent)] text-white'
                                              : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                                    }`}
                                >
                                    {step > s.num ? <Check className="h-3 w-3" /> : s.num}
                                </span>
                                <span className={step === s.num ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}>
                                    {s.label}
                                </span>
                                {i < 2 && <span className="text-[var(--color-border)]">/</span>}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6">
                    {/* Unlocked Step 1: Type Selection */}
                    {!locked && step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                {TIPE.map((t) => {
                                    const isPicked = tipe === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => pickTipe(t.value)}
                                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                                                isPicked
                                                    ? 'border-[var(--color-accent)] bg-teal-50/20'
                                                    : 'border-[var(--color-border)] bg-white hover:border-[var(--color-border)]'
                                            }`}
                                        >
                                            <div>
                                                <span className="block text-sm font-semibold text-[var(--color-ink)]">{t.label}</span>
                                                <span className="block text-xs text-[var(--color-muted)]">{t.desc}</span>
                                            </div>
                                            {isPicked && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
                                >
                                    Lanjut
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Unlocked Step 2: Service Selection */}
                    {!locked && step === 2 && (
                        <div className="space-y-4">
                            <Select
                                label={`Pilih ${TYPE_LABEL[tipe]}`}
                                value={data.product_id}
                                onChange={pickProduct}
                                options={options.map((o) => ({
                                    value: o.id,
                                    label: `${o.name} — Rp ${Number(o.price ?? 0).toLocaleString('id-ID')}`,
                                }))}
                                error={errors.product_id}
                                placeholder="Pilih layanan..."
                            />
                            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    disabled={!data.product_id}
                                    onClick={() => setStep(3)}
                                    className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
                                >
                                    Lanjut
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 or Locked: Form */}
                    {(locked || step === 3) && (
                        <form onSubmit={submit} className="space-y-6">
                            {/* Product Form Fields */}
                            {tipe === 'produk' && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Jumlah Unit" error={errors.jumlah} htmlFor="f-jumlah">
                                            <input
                                                id="f-jumlah"
                                                type="number"
                                                min="1"
                                                value={data.jumlah}
                                                onChange={(e) => setData('jumlah', e.target.value)}
                                                placeholder="1"
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                        <Select
                                            label="Metode Pengambilan"
                                            value={data.metode_pengambilan}
                                            onChange={(v) => {
                                                setData('metode_pengambilan', v);
                                                if (v === 'Ambil di lokasi') {
                                                    setShippingCost(0);
                                                }
                                            }}
                                            options={METODE_OPTIONS}
                                            error={errors.metode_pengambilan}
                                            placeholder="Pilih metode..."
                                        />
                                    </div>

                                    {data.metode_pengambilan === 'Diantar' && (
                                        <div className="p-4 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-tint)]/40 space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)]">
                                                <Truck className="w-4 h-4 text-[var(--color-accent)]" />
                                                <span>Alamat Lengkap & Kalkulator Ongkir (RajaOngkir)</span>
                                            </div>

                                            {shippingError && (
                                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                                                    {shippingError}
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Alamat Pengiriman Lengkap (Jalan, No. Rumah, RT/RW, Patokan)</label>
                                                <textarea
                                                    value={shippingAddress}
                                                    onChange={(e) => {
                                                        setShippingAddress(e.target.value);
                                                        setData('catatan', `Alamat: ${e.target.value} | Kota: ${selectedCity} | Kurir: ${courier ? courier.toUpperCase() : '-'} | Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}`);
                                                    }}
                                                    rows={2}
                                                    placeholder="Masukkan alamat lengkap penerima..."
                                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-white"
                                                    required={data.metode_pengambilan === 'Diantar'}
                                                />
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Kota / Kabupaten Tujuan</label>
                                                    <select
                                                        value={selectedCity}
                                                        onChange={(e) => {
                                                            setSelectedCity(e.target.value);
                                                            calculateOngkir(e.target.value, courier);
                                                        }}
                                                        className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-white"
                                                        required={data.metode_pengambilan === 'Diantar'}
                                                    >
                                                        <option value="">-- Pilih Kota Tujuan --</option>
                                                        {cities.map((c) => (
                                                            <option key={c.city_id} value={c.city_id}>
                                                                {c.type} {c.city_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Kurir Ekspedisi</label>
                                                    <select
                                                        value={courier}
                                                        onChange={(e) => {
                                                            setCourier(e.target.value);
                                                            if (selectedCity && e.target.value) calculateOngkir(selectedCity, e.target.value);
                                                            else setShippingCost(0);
                                                        }}
                                                        className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-white"
                                                        required={data.metode_pengambilan === 'Diantar'}
                                                    >
                                                        <option value="">-- Pilih Kurir --</option>
                                                        <option value="jne">JNE</option>
                                                        <option value="jnt">J&T Express</option>
                                                        <option value="sicepat">SiCepat</option>
                                                        <option value="pos">POS Indonesia</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {loadingShipping && <p className="text-xs text-[var(--color-accent)] font-semibold animate-pulse">Menghitung ongkir...</p>}
                                            {shippingCost > 0 && (
                                                <p className="text-xs font-bold text-emerald-700">
                                                    Estimasi Ongkir Otomatis: Rp {shippingCost.toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <Field label="Catatan" error={errors.catatan} htmlFor="f-catatan">
                                        <textarea
                                            id="f-catatan"
                                            value={data.catatan}
                                            onChange={(e) => setData('catatan', e.target.value)}
                                            rows={3}
                                            placeholder="Tulis catatan tambahan jika ada..."
                                            className={inputBaseClass}
                                        />
                                    </Field>
                                </div>
                            )}

                            {/* Jasa Form Fields */}
                            {tipe === 'jasa' && (
                                <div className="space-y-4">
                                    <Field label="Tujuan / Keperluan" error={errors.keperluan} htmlFor="f-keperluan">
                                        <textarea
                                            id="f-keperluan"
                                            value={data.keperluan}
                                            onChange={(e) => setData('keperluan', e.target.value)}
                                            rows={3}
                                            placeholder="Keperluan layanan atau pengujian..."
                                            className={inputBaseClass}
                                        />
                                    </Field>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Jumlah / Sampel" error={errors.jumlah} htmlFor="f-jumlah">
                                            <input
                                                id="f-jumlah"
                                                value={data.jumlah}
                                                onChange={(e) => setData('jumlah', e.target.value)}
                                                placeholder="mis. 1 sampel"
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                        <Field label="Tanggal Diharapkan" error={errors.tanggal} htmlFor="f-tanggal">
                                            <input
                                                id="f-tanggal"
                                                type="date"
                                                value={data.tanggal}
                                                onChange={(e) => setData('tanggal', e.target.value)}
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Dokumen Pendukung" error={errors.dokumen} htmlFor={null}>
                                        <FileDropzone
                                            multiple
                                            files={docs}
                                            onChange={setDocs}
                                            hint="Format PDF, JPG, PNG (maks. 5 MB)"
                                        />
                                    </Field>
                                </div>
                            )}

                            {/* Ruangan Form Fields */}
                            {tipe === 'ruangan' && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Tanggal Pemakaian" error={errors.tanggal} htmlFor="f-tanggal">
                                            <input
                                                id="f-tanggal"
                                                type="date"
                                                value={data.tanggal}
                                                onChange={(e) => setData('tanggal', e.target.value)}
                                                className={inputBaseClass}
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
                                                className={inputBaseClass}
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
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                        <Field label="Jam Selesai" error={errors.jam_selesai} htmlFor="f-jam_selesai">
                                            <input
                                                id="f-jam_selesai"
                                                type="time"
                                                value={data.jam_selesai}
                                                onChange={(e) => setData('jam_selesai', e.target.value)}
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Acara / Kegiatan" error={errors.keperluan} htmlFor="f-keperluan">
                                        <textarea
                                            id="f-keperluan"
                                            value={data.keperluan}
                                            onChange={(e) => setData('keperluan', e.target.value)}
                                            rows={3}
                                            placeholder="Nama kegiatan..."
                                            className={inputBaseClass}
                                        />
                                    </Field>
                                </div>
                            )}

                            {/* Add-ons: clean unboxed rows with "Tambahan" heading */}
                            {(termasukItems.length > 0 || addonItems.length > 0) && (
                                <div className="space-y-3 pt-2">
                                    <h2 className="text-sm font-semibold text-[var(--color-ink)]">Tambahan</h2>

                                    {/* Included items */}
                                    {termasukItems.map((o) => (
                                        <div key={o.id ?? o.nama} className="flex items-center justify-between text-sm py-1">
                                            <div className="flex items-center gap-2 text-[var(--color-ink)]">
                                                <Check className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                                                <span>{o.nama}, termasuk</span>
                                            </div>
                                            <span className="text-xs text-[var(--color-muted)]">Termasuk</span>
                                        </div>
                                    ))}

                                    {/* Optional add-ons */}
                                    {addonItems.map((o) => {
                                        const isChecked = selectedOpsi[o.id] != null;
                                        return (
                                            <label
                                                key={o.id}
                                                className="flex items-center justify-between text-sm py-1 cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const next = { ...selectedOpsi };
                                                            if (e.target.checked) {
                                                                next[o.id] = 1;
                                                            } else {
                                                                delete next[o.id];
                                                            }
                                                            setSelectedOpsi(next);
                                                        }}
                                                        className="h-4 w-4 rounded-md border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                                                    />
                                                    <span className={isChecked ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-ink)]'}>
                                                        {o.nama}
                                                    </span>
                                                </div>
                                                <span className="tabular-nums text-[var(--color-muted)]">
                                                    Rp {Number(o.harga ?? 0).toLocaleString('id-ID')}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Live summary at the bottom, directly above the submit button */}
                            <div className="border-t border-[var(--color-border)] pt-5 space-y-2 text-sm">
                                <div className="flex justify-between text-[var(--color-muted)]">
                                    <span>Tarif dasar</span>
                                    <span className="tabular-nums text-[var(--color-ink)]">Rp {baseTotal.toLocaleString('id-ID')}</span>
                                </div>
                                {totalAddons > 0 && (
                                    <div className="flex justify-between text-[var(--color-muted)]">
                                        <span>Tambahan</span>
                                        <span className="tabular-nums text-[var(--color-ink)]">Rp {totalAddons.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {data.metode_pengambilan === 'Diantar' && shippingCost > 0 && (
                                    <div className="flex justify-between text-[var(--color-muted)]">
                                        <span>Biaya Pengiriman (Ongkir)</span>
                                        <span className="tabular-nums text-emerald-700 font-semibold">+ Rp {shippingCost.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[var(--color-muted)]">
                                    <span>PPN (12%)</span>
                                    <span className="tabular-nums text-[var(--color-ink)]">Rp {displayPpn.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base">
                                    <span className="font-semibold text-[var(--color-ink)]">Total</span>
                                    <span className="tabular-nums font-bold text-[var(--color-ink)] text-lg">
                                        Rp {displayTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Submit button: rectangular 6px radius, sticky on mobile */}
                            <div className="pt-2 sticky bottom-4 sm:static bg-white/90 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none py-2 sm:py-0">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-full bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] disabled:opacity-50"
                                >
                                    {processing ? 'Mengajukan…' : 'Ajukan'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
