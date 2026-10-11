import { Head } from '@inertiajs/react';
import { useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';
import { mockPengajuan } from '@/mocks/data';

// TODO(backend): no pengajuan update route yet. Prefilled from mock/prop;
// submit shows a neutral notice, nothing is sent.
export default function PengajuanEdit({ auth, item }) {
    const role = auth?.user?.role;
    const p = item ?? mockPengajuan[0];
    const [form, setForm] = useState({
        qty: p.qty ?? '',
        need: p.need ?? '',
        tanggal: p.date ?? '',
    });
    const [notice, setNotice] = useState(null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
                        setNotice('Penyimpanan perubahan belum tersedia. Backend perlu menyediakan endpoint ubah pengajuan.');
                    }}
                    className="space-y-4"
                >
                    <Field label="Jumlah / unit / peserta">
                        <input value={form.qty} onChange={(e) => set('qty', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Keperluan">
                        <textarea value={form.need} onChange={(e) => set('need', e.target.value)} rows={3} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Tanggal">
                        <input type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </Field>
                    {notice && (
                        <p className="rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            {notice}
                        </p>
                    )}
                    <PrimaryButton>Simpan Perubahan</PrimaryButton>
                </form>
            </div>
        </PublicLayout>
    );
}
