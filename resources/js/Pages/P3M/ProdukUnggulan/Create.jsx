import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

export default function ProdukCreate({ auth }) {
    const { data, setData, processing, errors } = useForm({
        name: '', desc: '', researcher: '', team: '', category: '', price: '',
    });
    const [docs, setDocs] = useState([]);
    const set = (k, v) => setData(k, v);

    const submit = (e) => {
        e.preventDefault();
        router.post(route('p3m.produk.store'), { ...data, dokumen: docs });
    };

    return (
        <DashboardLayout title="Ajukan Produk Unggulan" breadcrumb="Admin P3M / Ajukan Produk Unggulan" activeKey="ajukan">
            <Head title="Ajukan Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Ajukan Produk Unggulan"
                    desc="Lengkapi data produk beserta dokumen pendukung untuk diverifikasi Pimpinan RTPU."
                />
                <form onSubmit={submit} className="max-w-2xl space-y-4">
                    <Field label="Nama produk" htmlFor="pu-name" error={errors.name}>
                        <input id="pu-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="mis. Kompor Biomassa Hemat Energi" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Deskripsi" htmlFor="pu-desc" error={errors.desc}>
                        <textarea id="pu-desc" value={data.desc} onChange={(e) => setData('desc', e.target.value)} rows={4} placeholder="Keunggulan, cara kerja, dan target pengguna…" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Peneliti / tim" htmlFor="pu-team" error={errors.team}>
                            <input id="pu-team" value={data.team} onChange={(e) => setData('team', e.target.value)} placeholder="mis. Teknik Mesin" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Nama peneliti utama" htmlFor="pu-researcher" error={errors.researcher}>
                            <input id="pu-researcher" value={data.researcher} onChange={(e) => setData('researcher', e.target.value)} placeholder="Nama lengkap" className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori" htmlFor="pu-category" error={errors.category}>
                            <input id="pu-category" value={data.category} onChange={(e) => setData('category', e.target.value)} placeholder="mis. Energi" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Usulan harga (Rp)" htmlFor="pu-price" error={errors.price}>
                            <input id="pu-price" type="number" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="1850000" className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <Field label="Dokumen pendukung" error={errors.dokumen}>
                        <FileDropzone multiple files={docs} onChange={setDocs} hint="Proposal, foto produk, hasil uji. PDF/JPG/PNG." />
                    </Field>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Mengirim…' : 'Kirim Pengajuan'}
                    </PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
