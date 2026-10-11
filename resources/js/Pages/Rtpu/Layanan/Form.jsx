import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';
import { mockLayanan } from '@/mocks/data';

// TODO(backend): no layanan create/update routes yet. Fields vary by tipe;
// submit shows a neutral notice, nothing is sent.
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

export default function LayananForm({ auth, tipe = 'jasa', initial }) {
    const existing = initial ?? mockLayanan.find((l) => l.type === tipe);
    const isEdit = Boolean(initial?.id);
    const [form, setForm] = useState(() => Object.fromEntries(
        FIELDS[tipe].map((f) => [f.key, existing?.[f.key] ?? '']),
    ));
    const [active, setActive] = useState(existing?.status !== 'Nonaktif');
    const [notice, setNotice] = useState(null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <DashboardLayout title={isEdit ? 'Ubah Layanan' : 'Tambah Layanan'} breadcrumb={`Admin RTPU / Kelola Layanan / ${isEdit ? 'Ubah' : 'Tambah'}`} activeKey="layanan">
            <Head title={`${isEdit ? 'Ubah' : 'Tambah'} ${TYPE_LABEL[tipe]} · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow={`Tipe: ${TYPE_LABEL[tipe]}`}
                    title={`${isEdit ? 'Ubah' : 'Tambah'} Layanan ${TYPE_LABEL[tipe]}`}
                    desc="Lengkapi data layanan. Status aktif menentukan tampil tidaknya layanan di katalog."
                />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setNotice('Penyimpanan layanan belum tersedia. Backend perlu menyediakan endpoint tambah/ubah layanan.');
                    }}
                    className="max-w-2xl space-y-4"
                >
                    {FIELDS[tipe].map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`layanan-${f.key}`}>
                            {f.type === 'textarea' ? (
                                <textarea id={`layanan-${f.key}`} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.ph} className={inputClass} {...inputStyleProps()} />
                            ) : (
                                <input id={`layanan-${f.key}`} type={f.type} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.ph} className={inputClass} {...inputStyleProps()} />
                            )}
                        </Field>
                    ))}
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                        Status aktif (tampil di katalog)
                    </label>
                    {notice && (
                        <p className="rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            {notice}
                        </p>
                    )}
                    <PrimaryButton>{isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}</PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
