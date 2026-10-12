import { Head, useForm } from '@inertiajs/react';
import CustomerTabs from '@/Components/CustomerTabs';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

export default function PengajuanEdit({ auth, item }) {
    const role = auth?.user?.role;
    const p = item;
    const { data, setData, patch, processing, errors } = useForm({
        qty: p?.qty ?? '',
        need: p?.need ?? '',
        tanggal: p?.tanggal ?? '',
    });

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
                    <Field label="Jumlah / unit / peserta" error={errors.qty}>
                        <input value={data.qty} onChange={(e) => setData('qty', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Keperluan" error={errors.need}>
                        <textarea value={data.need} onChange={(e) => setData('need', e.target.value)} rows={3} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Tanggal" error={errors.tanggal}>
                        <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </PrimaryButton>
                </form>
            </div>
        </PublicLayout>
    );
}
