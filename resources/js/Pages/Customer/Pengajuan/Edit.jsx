import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import OpsiBreakdown from '@/Components/OpsiBreakdown';
import OpsiPicker from '@/Components/OpsiPicker';
import PublicLayout from '@/Layouts/PublicLayout';
import Select from '@/Components/ui/Select';
import { Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';
import { useOpsiQuote } from '@/lib/useOpsiQuote';

const METODE_OPTIONS = [
    { value: 'Ambil di lokasi', label: 'Ambil di lokasi' },
    { value: 'Diantar', label: 'Diantar' },
];

/** Picked add-ons (from the frozen snapshot) as a `{ [opsiId]: qty }` map. */
function initialSelection(rows) {
    const map = {};
    (rows ?? []).forEach((o) => {
        if (o.jenis !== 'termasuk' && o.opsi_id != null) {
            map[o.opsi_id] = Number(o.qty) || 1;
        }
    });
    return map;
}

export default function PengajuanEdit({ auth, item, layanan = null }) {
    const role = auth?.user?.role;
    const p = item;
    const tipe = p?.type ?? layanan?.type ?? 'jasa';
    const productId = p?.product_id ?? layanan?.id ?? null;
    const opsiOptions = layanan?.opsi ?? [];

    const [selectedOpsi, setSelectedOpsi] = useState(() => initialSelection(p?.opsi));

    const opsiPayload = useMemo(
        () => Object.entries(selectedOpsi).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) || 1 })),
        [selectedOpsi],
    );

    const { quote, loading, error } = useOpsiQuote({
        productId,
        tipe,
        selection: {
            jumlah: p?.jumlah ?? p?.qty ?? '',
            peserta: p?.peserta ?? '',
            jam_mulai: p?.jam_mulai ?? '',
            jam_selesai: p?.jam_selesai ?? '',
        },
        opsi: opsiPayload,
    });

    const { data, setData, patch, processing, errors } = useForm({
        keperluan: p?.keperluan ?? p?.need ?? '',
        jumlah: p?.jumlah ?? p?.qty ?? '',
        tanggal: p?.tanggal ?? '',
        peserta: p?.peserta ?? '',
        jam_mulai: p?.jam_mulai ?? '',
        jam_selesai: p?.jam_selesai ?? '',
        metode_pengambilan: p?.metode_pengambilan ?? '',
        catatan: p?.catatan ?? '',
        opsi: opsiPayload,
    });

    const onOpsiChange = (next) => {
        setSelectedOpsi(next);
        setData(
            'opsi',
            Object.entries(next).map(([id, qty]) => ({ id: Number(id), qty: Number(qty) || 1 })),
        );
    };

    if (!p) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Ubah Pengajuan · PNJ Prime" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                    <p style={{ color: 'var(--color-muted)' }}>Pengajuan tidak ditemukan.</p>
                </div>
            </PublicLayout>
        );
    }

    const opsiSection = opsiOptions.length > 0 ? (
        <div className="space-y-4">
            <OpsiPicker options={opsiOptions} value={selectedOpsi} onChange={onOpsiChange} />
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

    return (
        <PublicLayout auth={auth}>
            <Head title={`Ubah ${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow={p.code}
                    title={`Ubah: ${p.layanan}`}
                    desc="Perubahan hanya bisa disimpan saat status Diajukan atau Ditolak."
                />
                <CustomerTabs active="pengajuan" role={role} />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        patch(route('customer.pengajuan.update', p.id));
                    }}
                    className="space-y-4"
                >
                    {tipe === 'ruangan' ? (
                        <>
                            <Field label="Tanggal" error={errors.tanggal}>
                                <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Jam mulai" error={errors.jam_mulai}>
                                    <input type="time" value={data.jam_mulai} onChange={(e) => setData('jam_mulai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <Field label="Jam selesai" error={errors.jam_selesai}>
                                    <input type="time" value={data.jam_selesai} onChange={(e) => setData('jam_selesai', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                                <Field label="Jumlah peserta" error={errors.peserta}>
                                    <input type="number" min="1" value={data.peserta} onChange={(e) => setData('peserta', e.target.value)} className={inputClass} {...inputStyleProps()} />
                                </Field>
                            </div>
                        </>
                    ) : (
                        <Field label={tipe === 'produk' ? 'Jumlah' : 'Jumlah / unit'} error={errors.jumlah}>
                            <input
                                type={tipe === 'produk' ? 'number' : 'text'}
                                min={tipe === 'produk' ? 1 : undefined}
                                value={data.jumlah}
                                onChange={(e) => setData('jumlah', e.target.value)}
                                className={inputClass}
                                {...inputStyleProps()}
                            />
                        </Field>
                    )}

                    {tipe === 'produk' ? (
                        <Select
                            label="Metode pengambilan"
                            value={data.metode_pengambilan}
                            onChange={(v) => setData('metode_pengambilan', v)}
                            options={METODE_OPTIONS}
                            error={errors.metode_pengambilan}
                            placeholder="Pilih metode…"
                        />
                    ) : null}

                    <Field label="Keperluan" error={errors.keperluan}>
                        <textarea value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} rows={3} className={inputClass} {...inputStyleProps()} />
                    </Field>

                    {tipe === 'jasa' && (
                        <Field label="Tanggal diharapkan" error={errors.tanggal}>
                            <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    )}

                    {tipe === 'produk' && (
                        <Field label="Catatan" error={errors.catatan}>
                            <textarea value={data.catatan} onChange={(e) => setData('catatan', e.target.value)} rows={2} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    )}

                    {opsiSection}

                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </PrimaryButton>
                </form>
            </div>
        </PublicLayout>
    );
}
