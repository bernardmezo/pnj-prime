import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

// Form fields vary by tipe; category is derived server-side from tipe.
const FIELDS = {
    jasa: [
        { key: 'name', label: 'Nama jasa', type: 'text', ph: 'mis. Uji Kuat Tekan Beton' },
        { key: 'desc', label: 'Deskripsi', type: 'textarea', ph: 'Ruang lingkup layanan…' },
        { key: 'price', label: 'Tarif dasar (Rp)', type: 'number', ph: '350000' },
        { key: 'location', label: 'Lokasi', type: 'text', ph: 'Lab Struktur, Gedung A' },
        { key: 'photo', label: 'Foto (URL)', type: 'text', ph: 'https://…' },
    ],
    ruangan: [
        { key: 'name', label: 'Nama ruangan', type: 'text', ph: 'mis. Aula Gedung Serbaguna' },
        { key: 'capacity', label: 'Kapasitas (orang)', type: 'number', ph: '300' },
        { key: 'location', label: 'Gedung / lokasi', type: 'text', ph: 'Gedung Serbaguna Lt.1' },
        { key: 'price', label: 'Tarif (Rp)', type: 'number', ph: '2500000' },
        { key: 'facilities', label: 'Fasilitas', type: 'textarea', ph: 'Proyektor, sound system, AC…' },
        { key: 'photo', label: 'Foto (URL)', type: 'text', ph: 'https://…' },
    ],
    produk: [
        { key: 'name', label: 'Nama produk', type: 'text', ph: 'mis. Alat Uji Kualitas Air' },
        { key: 'category', label: 'Kategori', type: 'text', ph: 'Alat Uji' },
        { key: 'price', label: 'Harga (Rp)', type: 'number', ph: '2450000' },
        { key: 'stock', label: 'Stok', type: 'number', ph: '16' },
        { key: 'specs', label: 'Spesifikasi', type: 'textarea', ph: 'Spesifikasi teknis…' },
        { key: 'photo', label: 'Foto (URL)', type: 'text', ph: 'https://…' },
    ],
};

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function LayananForm({ auth, tipe = 'jasa', initial = null }) {
    const existing = initial;
    const isEdit = Boolean(existing?.id);
    const { data, setData, post, patch, processing, errors } = useForm({
        tipe,
        name: existing?.name ?? '',
        desc: existing?.desc ?? '',
        price: existing?.price ?? '',
        location: existing?.location ?? '',
        capacity: existing?.capacity ?? '',
        facilities: existing?.facilities ?? '',
        category: existing?.category ?? '',
        stock: existing?.stock ?? '',
        specs: existing?.specs ?? '',
        photo: existing?.photo ?? '',
        active: existing ? existing.status !== 'Nonaktif' : true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('rtpu.layanan.update', existing.id));
        } else {
            post(route('rtpu.layanan.store'));
        }
    };

    return (
        <DashboardLayout title={isEdit ? 'Ubah Layanan' : 'Tambah Layanan'} breadcrumb={`Admin RTPU / Kelola Layanan / ${isEdit ? 'Ubah' : 'Tambah'}`} activeKey="layanan">
            <Head title={`${isEdit ? 'Ubah' : 'Tambah'} ${TYPE_LABEL[tipe]} · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow={`Tipe: ${TYPE_LABEL[tipe]}`}
                    title={`${isEdit ? 'Ubah' : 'Tambah'} Layanan ${TYPE_LABEL[tipe]}`}
                    desc="Lengkapi data layanan. Status aktif menentukan tampil tidaknya layanan di katalog."
                />
                <form onSubmit={submit} className="max-w-2xl space-y-4">
                    {FIELDS[tipe].map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`layanan-${f.key}`} error={errors[f.key]}>
                            {f.type === 'textarea' ? (
                                <textarea id={`layanan-${f.key}`} value={data[f.key]} onChange={(e) => setData(f.key, e.target.value)} rows={3} placeholder={f.ph} className={inputClass} {...inputStyleProps()} />
                            ) : (
                                <input id={`layanan-${f.key}`} type={f.type} value={data[f.key]} onChange={(e) => setData(f.key, e.target.value)} placeholder={f.ph} className={inputClass} {...inputStyleProps()} />
                            )}
                        </Field>
                    ))}
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                        <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                        Status aktif (tampil di katalog)
                    </label>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}
                    </PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
