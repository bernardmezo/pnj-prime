import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';
import { mockProdukUnggulan } from '@/mocks/data';

// TODO(backend): no produk-unggulan update route yet. Prefilled from
// mock/prop; submit shows a neutral notice, nothing is sent.
export default function ProdukEdit({ auth, item }) {
    const p = item ?? mockProdukUnggulan[0];
    const [form, setForm] = useState({
        name: p.name ?? '',
        desc: p.desc ?? '',
        researcher: p.researcher ?? '',
        team: p.team ?? '',
        category: p.category ?? '',
        price: p.price ?? '',
    });
    const [notice, setNotice] = useState(null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
                        setNotice('Penyimpanan perubahan belum tersedia. Backend perlu menyediakan endpoint ubah produk unggulan.');
                    }}
                    className="max-w-2xl space-y-4"
                >
                    <Field label="Nama produk" htmlFor="pu-name">
                        <input id="pu-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Deskripsi" htmlFor="pu-desc">
                        <textarea id="pu-desc" value={form.desc} onChange={(e) => set('desc', e.target.value)} rows={4} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nama peneliti utama" htmlFor="pu-researcher">
                            <input id="pu-researcher" value={form.researcher} onChange={(e) => set('researcher', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Peneliti / tim" htmlFor="pu-team">
                            <input id="pu-team" value={form.team} onChange={(e) => set('team', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori" htmlFor="pu-category">
                            <input id="pu-category" value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Usulan harga (Rp)" htmlFor="pu-price">
                            <input id="pu-price" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    {notice && (
                        <p className="rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            {notice}
                        </p>
                    )}
                    <PrimaryButton>Simpan Perubahan</PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
