import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

export default function ProdukEdit({ auth, item }) {
    const p = item;
    const { data, setData, patch, processing, errors } = useForm({
        name: p?.name ?? '',
        desc: p?.desc ?? '',
        researcher: p?.researcher ?? '',
        team: p?.team ?? '',
        category: p?.category ?? '',
        price: p?.price ?? '',
    });

    if (!p) {
        return (
            <DashboardLayout title="Ubah Produk Unggulan" breadcrumb="Admin P3M / Pemantauan / Ubah" activeKey="pantau">
                <Head title="Ubah Produk Unggulan · PNJ Prime" />
                <FadeIn><p style={{ color: 'var(--color-muted)' }}>Data tidak ditemukan.</p></FadeIn>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Ubah Produk Unggulan" breadcrumb="Admin P3M / Pemantauan / Ubah" activeKey="pantau">
            <Head title={`Ubah ${p.code} · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow={p.code}
                    title={`Ubah: ${p.name}`}
                    desc="Perubahan hanya bisa disimpan saat status Diajukan atau Ditolak."
                />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        patch(route('p3m.produk.update', p.id));
                    }}
                    className="max-w-2xl space-y-4"
                >
                    <Field label="Nama produk" htmlFor="pu-name" error={errors.name}>
                        <input id="pu-name" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Deskripsi" htmlFor="pu-desc" error={errors.desc}>
                        <textarea id="pu-desc" value={data.desc} onChange={(e) => setData('desc', e.target.value)} rows={4} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nama peneliti utama" htmlFor="pu-researcher" error={errors.researcher}>
                            <input id="pu-researcher" value={data.researcher} onChange={(e) => setData('researcher', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Peneliti / tim" htmlFor="pu-team" error={errors.team}>
                            <input id="pu-team" value={data.team} onChange={(e) => setData('team', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori" htmlFor="pu-category" error={errors.category}>
                            <input id="pu-category" value={data.category} onChange={(e) => setData('category', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Usulan harga (Rp)" htmlFor="pu-price" error={errors.price}>
                            <input id="pu-price" type="number" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
