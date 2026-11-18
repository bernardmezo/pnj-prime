import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Building2, CalendarRange, Check, ClipboardList, Minus, Package, Plus, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import Select from '@/Components/ui/Select';
import { Field } from '@/Components/ui';
import AlertBanner from '@/Components/AlertBanner';
import { VisualPlaceholder } from '@/Components/Public/shared';
import { resolveImageUrl } from '@/Components/Public/CatalogCard';
import { useOpsiQuote } from '@/lib/useOpsiQuote';
import { usePengajuanDraft } from '@/lib/usePengajuanDraft';

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

/** Judul bagian form. Angka + teks, tanpa dekorasi berlebih. */
function SectionHeading({ number, title }) {
    return (
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-xs font-bold text-[var(--color-accent)]">
                {number}
            </span>
            <h2 className="text-sm font-bold text-[var(--color-ink)]">{title}</h2>
        </div>
    );
}

const rupiah = (n) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

export default function PengajuanCreate({ auth, layanan = [], selected = {} }) {
    const locked = Boolean(selected?.product_id);
    const [step, setStep] = useState(locked ? 3 : 1);
    const { restoreDraft, clearDraft } = usePengajuanDraft();

    // Restore draft after login (if any)
    useEffect(() => {
        const draft = restoreDraft();
        if (draft && draft.product_id && !selected?.product_id) {
            // User came back from login with saved draft
            clearDraft(); // Clear after restore
            // Redirect to create page with product_id & tipe query params
            const url = route('customer.pengajuan.create', { 
                product_id: draft.product_id,
                tipe: draft.tipe 
            });
            router.visit(url, { replace: true });
        }
    }, []);

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
        rental_start: '',
        rental_end: '',
        renter_data: {
            company_name: '',
            npwp: '',
            ktp_number: '',
            contact_person: '',
            contact_phone: '',
        },
        kebutuhan_detail: {
            jenis_pengujian: '',
            metode_standar: '',
            jumlah_sampel: '',
            uraian_kebutuhan: '',
            konsultasi_biaya: '',
        },
    });

    // Rental conflict state
    const [rentalConflict, setRentalConflict] = useState(null);

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
    const [postalCode, setPostalCode] = useState('');

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
        setShippingError('');
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
            .catch((err) => {
                setLoadingShipping(false);
                setShippingError('Gagal menghitung ongkir. Gunakan estimasi manual.');
                const fallbackVal = Math.round(15000 * cityMultiplier * Math.max(1, Math.ceil(totalWeight / 1000)));
                setShippingCost(fallbackVal);
            });
    };

    const calculateOngkirByPostalCode = (destinationPostalCode, chosenCourier) => {
        if (!destinationPostalCode || destinationPostalCode.length !== 5 || !chosenCourier) {
            return;
        }
        setLoadingShipping(true);
        setShippingError('');
        const itemWeight = Number(current?.weight ?? current?.meta?.weight ?? 1000);
        const totalWeight = itemWeight * (Number(data.jumlah) || 1);

        fetch('/api/shipping/calculate-postal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                destination_postal_code: destinationPostalCode,
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
                        const val = costs[0].cost[0].value;
                        setShippingCost(val);
                        setData('catatan', `Alamat: ${shippingAddress} | Kode Pos: ${destinationPostalCode} | Kurir: ${chosenCourier.toUpperCase()} (${costs[0].service}) - Rp ${val.toLocaleString('id-ID')}`);
                    }
                } else if (res?.error) {
                    // Fallback ke city_id jika postal code gagal (RajaOngkir bukan Pro)
                    setShippingError(res.error);
                    if (selectedCity) {
                        calculateOngkir(selectedCity, chosenCourier);
                    }
                }
            })
            .catch((err) => {
                setLoadingShipping(false);
                setShippingError('Perhitungan ongkir via kode pos gagal. Gunakan pilihan kota di bawah.');
                // Fallback ke city_id
                if (selectedCity) {
                    calculateOngkir(selectedCity, chosenCourier);
                }
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
    const currentThumb = resolveImageUrl(current?.thumbnail ?? null);
    const typeLabel = TYPE_LABEL[tipe] ?? 'Layanan';
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
            <Head title={`Checkout · ${selectedName || 'PNJ Prime'}`} />

            <div className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:py-10">
                {/* Header: small Kembali text link */}
                <div>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke katalog</span>
                    </button>
                </div>

                {/* Header: judul + stepper di dalam satu panel */}
                <div className="relative mt-4 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-card sm:p-8">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                                Checkout · {typeLabel}
                            </p>
                            <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                                Selesaikan pesanan Anda
                            </h1>
                            <p className="mt-1.5 max-w-xl text-sm text-[var(--color-muted)]">
                                {selectedName ? selectedName : 'Pilih layanan dan lengkapi detail permohonan Anda.'}
                            </p>
                        </div>
                        {/* Stepper: ringkas saat produk sudah dipilih dari katalog, lengkap saat memilih manual */}
                        <div className="flex items-center gap-3 text-xs" aria-label="Tahapan pengajuan">
                            {[
                                { num: 1, label: 'Pilih Layanan', done: locked || step > 2, active: !locked && step <= 2 },
                                { num: 2, label: 'Detail Pesanan', done: false, active: locked || step === 3 },
                            ].map((s, i) => (
                                <div key={s.num} className="flex items-center gap-3">
                                    {i > 0 && <span className="h-px w-6 bg-[var(--color-border)] sm:w-10" aria-hidden />}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                s.done || s.active
                                                    ? 'bg-[var(--color-accent)] text-white'
                                                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                                            }`}
                                            aria-current={s.active ? 'step' : undefined}
                                        >
                                            {s.done ? <Check className="h-3.5 w-3.5" /> : s.num}
                                        </span>
                                        <span className={s.active ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}>
                                            {s.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ringkasan item: foto, nama, harga satuan */}
                {selectedName ? (
                    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-card sm:gap-5 sm:p-5">
                        <VisualPlaceholder
                            icon={Package}
                            image={currentThumb}
                            alt={selectedName}
                            className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
                                Item pesanan · {typeLabel}
                            </p>
                            <p className="mt-0.5 truncate font-display text-base font-bold text-[var(--color-ink)] sm:text-lg">
                                {selectedName}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                                {currentPrice > 0 ? `${rupiah(currentPrice)} / unit` : 'Harga ditetapkan setelah verifikasi'}
                            </p>
                        </div>
                        <div className="hidden text-right sm:block">
                            <p className="text-[11px] text-[var(--color-muted)]">Tarif dasar</p>
                            <p className="mt-0.5 tabular-nums font-display text-lg font-bold text-[var(--color-accent)]">
                                {rupiah(currentPrice)}
                            </p>
                        </div>
                    </div>
                ) : null}

                <div className="mt-6">
                    {/* Unlocked Step 1: Type Selection */}
                    {!locked && step === 1 && (
                        <div className="mx-auto max-w-xl space-y-4">
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
                        <div className="mx-auto max-w-xl space-y-4">
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
                        <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                          <div className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-card sm:p-7">
                            {/* Product Form Fields */}
                            {tipe === 'produk' && (
                                <div className="space-y-5">
                                    <SectionHeading number={1} title="Detail pesanan" />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Jumlah Unit" error={errors.jumlah} htmlFor="f-jumlah">
                                            <div className="flex items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-white focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]">
                                                <button
                                                    type="button"
                                                    aria-label="Kurangi jumlah"
                                                    disabled={parsedQty <= 1}
                                                    onClick={() => setData('jumlah', String(Math.max(1, parsedQty - 1)))}
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <input
                                                    id="f-jumlah"
                                                    type="number"
                                                    min="1"
                                                    value={data.jumlah}
                                                    onChange={(e) => setData('jumlah', e.target.value)}
                                                    placeholder="1"
                                                    className="h-11 w-full min-w-0 border-0 bg-transparent px-1 text-center text-sm font-semibold tabular-nums text-[var(--color-ink)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    aria-label="Tambah jumlah"
                                                    onClick={() => setData('jumlah', String(parsedQty + 1))}
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
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

                                            {shippingError && <AlertBanner type="error" message={shippingError} />}

                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Alamat Pengiriman Lengkap (Jalan, No. Rumah, RT/RW, Patokan)</label>
                                                <textarea
                                                    value={shippingAddress}
                                                    onChange={(e) => {
                                                        setShippingAddress(e.target.value);
                                                        setData('catatan', `Alamat: ${e.target.value} | Kode Pos: ${postalCode || '-'} | Kota: ${selectedCity} | Kurir: ${courier ? courier.toUpperCase() : '-'} | Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}`);
                                                    }}
                                                    rows={2}
                                                    placeholder="Masukkan alamat lengkap penerima..."
                                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-white"
                                                    required={data.metode_pengambilan === 'Diantar'}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                                                    Kode Pos <span className="text-[var(--color-muted)] font-normal">(5 digit)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={postalCode}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                                                        setPostalCode(value);
                                                        setData('catatan', `Alamat: ${shippingAddress} | Kode Pos: ${value || '-'} | Kota: ${selectedCity} | Kurir: ${courier ? courier.toUpperCase() : '-'} | Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}`);
                                                        
                                                        // Auto-calculate ongkir jika kode pos valid (5 digit)
                                                        if (value.length === 5 && courier) {
                                                            calculateOngkirByPostalCode(value, courier);
                                                        }
                                                    }}
                                                    placeholder="Contoh: 16424"
                                                    maxLength={5}
                                                    pattern="\d{5}"
                                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-white"
                                                    required={data.metode_pengambilan === 'Diantar'}
                                                />
                                                <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                                                    Isi kode pos untuk perhitungan ongkir akurat. Jika tidak tahu, pilih kota tujuan di bawah.
                                                </p>
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
                                <div className="space-y-5">
                                    <SectionHeading number={1} title="Detail pengajuan jasa" />
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

                                    {/* Detail kebutuhan pengujian (test lab) & konsultasi biaya */}
                                    <fieldset className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4 sm:p-5">
                                        <legend className="px-2 text-sm font-semibold text-[var(--color-ink)]">Kebutuhan pengujian &amp; konsultasi biaya</legend>
                                        <p className="text-xs text-[var(--color-muted)]">
                                            Isi bila Anda memesan pengujian lab atau layanan teknis. Tim RTPU akan membaca kebutuhan Anda lalu menetapkan tarif sebelum invoice diterbitkan. Semua isian ini opsional.
                                        </p>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Jenis pengujian / layanan" error={errors['kebutuhan_detail.jenis_pengujian']} htmlFor="f-kd-jenis">
                                                <input
                                                    id="f-kd-jenis"
                                                    value={data.kebutuhan_detail.jenis_pengujian}
                                                    onChange={(e) => setData('kebutuhan_detail', { ...data.kebutuhan_detail, jenis_pengujian: e.target.value })}
                                                    className={inputBaseClass}
                                                    maxLength={255}
                                                />
                                            </Field>
                                            <Field label="Metode / standar yang diinginkan" error={errors['kebutuhan_detail.metode_standar']} htmlFor="f-kd-metode">
                                                <input
                                                    id="f-kd-metode"
                                                    value={data.kebutuhan_detail.metode_standar}
                                                    onChange={(e) => setData('kebutuhan_detail', { ...data.kebutuhan_detail, metode_standar: e.target.value })}
                                                    className={inputBaseClass}
                                                    maxLength={255}
                                                />
                                            </Field>
                                            <Field label="Jumlah sampel" error={errors['kebutuhan_detail.jumlah_sampel']} htmlFor="f-kd-sampel">
                                                <input
                                                    id="f-kd-sampel"
                                                    type="number"
                                                    min="1"
                                                    inputMode="numeric"
                                                    value={data.kebutuhan_detail.jumlah_sampel}
                                                    onChange={(e) => setData('kebutuhan_detail', { ...data.kebutuhan_detail, jumlah_sampel: e.target.value })}
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Uraian kebutuhan" error={errors['kebutuhan_detail.uraian_kebutuhan']} htmlFor="f-kd-uraian">
                                            <textarea
                                                id="f-kd-uraian"
                                                rows={3}
                                                value={data.kebutuhan_detail.uraian_kebutuhan}
                                                onChange={(e) => setData('kebutuhan_detail', { ...data.kebutuhan_detail, uraian_kebutuhan: e.target.value })}
                                                placeholder="Jelaskan apa yang ingin diuji atau dikerjakan, kondisi sampel, dan hasil yang diharapkan."
                                                className={inputBaseClass}
                                                maxLength={4000}
                                            />
                                        </Field>
                                        <Field label="Konsultasi biaya" error={errors['kebutuhan_detail.konsultasi_biaya']} htmlFor="f-kd-biaya">
                                            <textarea
                                                id="f-kd-biaya"
                                                rows={2}
                                                value={data.kebutuhan_detail.konsultasi_biaya}
                                                onChange={(e) => setData('kebutuhan_detail', { ...data.kebutuhan_detail, konsultasi_biaya: e.target.value })}
                                                placeholder="Tuliskan anggaran Anda atau hal yang ingin ditanyakan soal biaya."
                                                className={inputBaseClass}
                                                maxLength={1000}
                                            />
                                        </Field>
                                    </fieldset>
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
                                <div className="space-y-5">
                                    <SectionHeading number={1} title="Detail pengajuan sewa" />
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

                                    {/* Rental Period (Jalur C: Sewa) */}
                                    <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface)]">
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
                                            <CalendarRange className="h-4 w-4 text-[var(--color-accent)]" />
                                            Periode Sewa
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Mulai Sewa" error={errors.rental_start} htmlFor="f-rental-start">
                                                <input
                                                    id="f-rental-start"
                                                    type="datetime-local"
                                                    value={data.rental_start}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                    onChange={(e) => {
                                                        setData('rental_start', e.target.value);
                                                        setRentalConflict(null);
                                                    }}
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                            <Field label="Selesai Sewa" error={errors.rental_end} htmlFor="f-rental-end">
                                                <input
                                                    id="f-rental-end"
                                                    type="datetime-local"
                                                    value={data.rental_end}
                                                    min={data.rental_start || new Date().toISOString().slice(0, 16)}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setData('rental_end', val);
                                                        setRentalConflict(null);
                                                        // Auto-check conflict
                                                        if (data.rental_start && val && data.product_id) {
                                                            fetch('/api/rental/check-conflict', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                },
                                                                body: JSON.stringify({
                                                                    product_id: data.product_id,
                                                                    rental_start: data.rental_start,
                                                                    rental_end: val,
                                                                }),
                                                            })
                                                                .then((r) => r.json())
                                                                .then((r) => {
                                                                    if (r.conflict) {
                                                                        setRentalConflict(r.conflict_message || 'Jadwal sudah dipesan.');
                                                                    }
                                                                })
                                                                .catch(() => {});
                                                        }
                                                    }}
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                        </div>
                                        {rentalConflict && (
                                            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <span>{rentalConflict}</span>
                                            </div>
                                        )}
                                        {data.rental_start && data.rental_end && !rentalConflict && (
                                            <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-700 flex items-center gap-2">
                                                <Check className="h-4 w-4 shrink-0" />
                                                <span>Jadwal tersedia</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Renter Data (Jalur C: Sewa) */}
                                    <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-4">
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-[var(--color-accent)]" />
                                            Data Penyewa
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Nama Instansi / Perorangan" htmlFor="f-company-name">
                                                <input
                                                    id="f-company-name"
                                                    type="text"
                                                    value={data.renter_data.company_name}
                                                    onChange={(e) => setData('renter_data', { ...data.renter_data, company_name: e.target.value })}
                                                    placeholder="PT / CV / Nama Lengkap"
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                            <Field label="NPWP (opsional)" htmlFor="f-npwp">
                                                <input
                                                    id="f-npwp"
                                                    type="text"
                                                    value={data.renter_data.npwp}
                                                    onChange={(e) => setData('renter_data', { ...data.renter_data, npwp: e.target.value })}
                                                    placeholder="00.000.000.0-000.000"
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Nomor KTP / NIK" htmlFor="f-ktp">
                                                <input
                                                    id="f-ktp"
                                                    type="text"
                                                    value={data.renter_data.ktp_number}
                                                    onChange={(e) => setData('renter_data', { ...data.renter_data, ktp_number: e.target.value })}
                                                    placeholder="16 digit NIK"
                                                    maxLength={16}
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                            <Field label="Nama Kontak Person" htmlFor="f-contact-person">
                                                <input
                                                    id="f-contact-person"
                                                    type="text"
                                                    value={data.renter_data.contact_person}
                                                    onChange={(e) => setData('renter_data', { ...data.renter_data, contact_person: e.target.value })}
                                                    placeholder="Nama PIC"
                                                    className={inputBaseClass}
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Nomor Telepon Kontak" htmlFor="f-contact-phone">
                                            <input
                                                id="f-contact-phone"
                                                type="tel"
                                                value={data.renter_data.contact_phone}
                                                onChange={(e) => setData('renter_data', { ...data.renter_data, contact_phone: e.target.value })}
                                                placeholder="08xx-xxxx-xxxx"
                                                className={inputBaseClass}
                                            />
                                        </Field>
                                        <p className="text-[10px] text-[var(--color-muted)]">
                                            Data KTP/NIK bersifat rahasia dan hanya dapat dilihat oleh Admin RTPU sesuai UU No. 27 Tahun 2022 tentang PDP.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Add-ons: clean unboxed rows with "Tambahan" heading */}
                            {(termasukItems.length > 0 || addonItems.length > 0) && (
                                <div className="space-y-3 pt-2">
                                    <SectionHeading number={2} title="Tambahan" />

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

                          </div>

                          {/* Kolom kanan: ringkasan pesanan, sticky di desktop */}
                          <aside className="space-y-4 lg:sticky lg:top-24" aria-label="Ringkasan pesanan">
                            <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-card sm:p-6">
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                                <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                                    <ClipboardList className="h-4 w-4 text-[var(--color-accent)]" />
                                    Ringkasan Pesanan
                                </h2>

                                {selectedName && (
                                    <div className="mt-4 flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-[var(--color-ink)]">{selectedName}</p>
                                            {tipe === 'produk' && (
                                                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                                                    {parsedQty} × {rupiah(currentPrice)}
                                                </p>
                                            )}
                                        </div>
                                        <span className="tabular-nums font-semibold text-[var(--color-ink)]">{rupiah(baseTotal)}</span>
                                    </div>
                                )}

                                <dl className="mt-4 space-y-2.5 text-sm">
                                    <div className="flex justify-between text-[var(--color-muted)]">
                                        <dt>Tarif dasar</dt>
                                        <dd className="tabular-nums text-[var(--color-ink)]">{rupiah(baseTotal)}</dd>
                                    </div>
                                    {totalAddons > 0 && (
                                        <div className="flex justify-between text-[var(--color-muted)]">
                                            <dt>Tambahan</dt>
                                            <dd className="tabular-nums text-[var(--color-ink)]">{rupiah(totalAddons)}</dd>
                                        </div>
                                    )}
                                    {data.metode_pengambilan === 'Diantar' && shippingCost > 0 && (
                                        <div className="flex justify-between text-[var(--color-muted)]">
                                            <dt>Ongkos kirim</dt>
                                            <dd className="tabular-nums font-semibold text-[var(--color-success)]">+ {rupiah(shippingCost)}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[var(--color-muted)]">
                                        <dt>PPN (12%)</dt>
                                        <dd className="tabular-nums text-[var(--color-ink)]">{rupiah(displayPpn)}</dd>
                                    </div>
                                </dl>

                                <div className="mt-4 flex items-baseline justify-between border-t border-[var(--color-border)] pt-4">
                                    <span className="text-sm font-semibold text-[var(--color-ink)]">Total</span>
                                    <span className="tabular-nums font-display text-2xl font-bold text-[var(--color-accent)]">
                                        {rupiah(displayTotal)}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Mengirim…' : 'Kirim Pengajuan'}
                                </button>

                                <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                                    Pengajuan diverifikasi Admin RTPU. Pembayaran dilakukan setelah pengajuan disetujui.
                                </p>
                            </div>
                          </aside>
                        </form>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
