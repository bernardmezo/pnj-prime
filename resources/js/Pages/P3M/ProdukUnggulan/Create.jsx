import { Head } from '@inertiajs/react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

// TODO(backend): no produk-unggulan route yet. Submit shows a neutral
// notice; nothing is sent and no success is faked.
export default function ProdukCreate({ auth }) {
    const [form, setForm] = useState({ name: '', desc: '', researcher: '', team: '', category: '', price: '' });
    const [docs, setDocs] = useState([]);
    const [notice, setNotice] = useState(null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <DashboardLayout title="Ajukan Produk Unggulan" breadcrumb="Admin P3M / Ajukan Produk Unggulan" activeKey="ajukan">
            <Head title="Ajukan Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Ajukan Produk Unggulan"
                    desc="Lengkapi data produk beserta dokumen pendukung untuk diverifikasi Pimpinan RTPU."
                />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setNotice('Pengiriman pengajuan belum tersedia. Backend perlu menyediakan endpoint pengajuan produk unggulan.');
                    }}
                    className="max-w-2xl space-y-4"
                >
                    <Field label="Nama produk" htmlFor="pu-name">
                        <input id="pu-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="mis. Kompor Biomassa Hemat Energi" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Deskripsi" htmlFor="pu-desc">
                        <textarea id="pu-desc" value={form.desc} onChange={(e) => set('desc', e.target.value)} rows={4} placeholder="Keunggulan, cara kerja, dan target pengguna…" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Peneliti / tim" htmlFor="pu-team">
                            <input id="pu-team" value={form.team} onChange={(e) => set('team', e.target.value)} placeholder="mis. Teknik Mesin" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Nama peneliti utama" htmlFor="pu-researcher">
                            <input id="pu-researcher" value={form.researcher} onChange={(e) => set('researcher', e.target.value)} placeholder="Nama lengkap" className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori" htmlFor="pu-category">
                            <input id="pu-category" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="mis. Energi" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Usulan harga (Rp)" htmlFor="pu-price">
                            <input id="pu-price" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="1850000" className={inputClass} {...inputStyleProps()} />
                        </Field>
                    </div>
                    <Field label="Dokumen pendukung">
                        <FileDropzone multiple files={docs} onChange={setDocs} hint="Proposal, foto produk, hasil uji. PDF/JPG/PNG." />
                    </Field>
                    {notice && (
                        <p className="rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            {notice}
                        </p>
                    )}
                    <PrimaryButton>Kirim Pengajuan</PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
