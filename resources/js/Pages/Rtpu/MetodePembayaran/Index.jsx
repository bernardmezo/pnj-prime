import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, ConfirmModal, EmptyState, FadeIn, Field, PageHeader, PrimaryButton, StatusBadge, Table, Td, inputClass, inputStyleProps } from '@/Components/ui';

export default function MetodeIndex({ auth, metode = [] }) {
    const rows = metode;
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: '', type: 'Transfer Bank', account: '', holder: '', instructions: '', active: true,
    });

    const openAdd = () => {
        setEditing('new');
        reset();
        setData({ name: '', type: 'Transfer Bank', account: '', holder: '', instructions: '', active: true });
    };
    const openEdit = (m) => {
        setEditing(m.id);
        setData({ name: m.name, type: m.type, account: m.account, holder: m.holder, instructions: m.instructions ?? '', active: m.active });
    };
    const save = () => {
        if (editing === 'new') {
            post(route('rtpu.metode.store'), { onSuccess: () => setEditing(null) });
        } else {
            patch(route('rtpu.metode.update', editing), { onSuccess: () => setEditing(null) });
        }
    };

    return (
        <DashboardLayout title="Metode Pembayaran" breadcrumb="Admin RTPU / Metode Pembayaran" activeKey="metode">
            <Head title="Metode Pembayaran · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Kelola Metode Pembayaran"
                    desc="Daftar metode yang bisa dipilih Customer saat membayar."
                    actions={<PrimaryButton onClick={openAdd}>+ Tambah Metode</PrimaryButton>}
                />
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada metode pembayaran" desc="Tambahkan metode pertama." />
                ) : (
                    <Table columns={['Nama Metode', 'Tipe', 'Nomor / VA', 'Status', '']}>
                        <tbody>
                            {rows.map((m) => (
                                <tr key={m.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{m.name}</Td>
                                    <Td>{m.type}</Td>
                                    <Td className="font-mono">{m.account}</Td>
                                    <Td><StatusBadge label={m.active ? 'Aktif' : 'Nonaktif'} tone={m.active ? 'teal' : 'muted'} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <button type="button" onClick={() => openEdit(m)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </button>
                                            <button type="button" onClick={() => setDel(m)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                Hapus
                                            </button>
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <ConfirmModal
                    open={editing !== null}
                    title={editing === 'new' ? 'Tambah Metode' : 'Ubah Metode'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                    processing={processing}
                >
                    <div className="space-y-3">
                        <Field label="Nama metode" error={errors.name}>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="mis. Transfer Bank BNI" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Tipe" error={errors.type}>
                            <select value={data.type} onChange={(e) => setData('type', e.target.value)} className={inputClass} {...inputStyleProps()}>
                                {['Transfer Bank', 'Virtual Account', 'Tunai', 'Lainnya'].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Field label="Nomor rekening / VA" error={errors.account}>
                            <input value={data.account} onChange={(e) => setData('account', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Atas nama" error={errors.holder}>
                            <input value={data.holder} onChange={(e) => setData('holder', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Instruksi" error={errors.instructions}>
                            <textarea value={data.instructions} onChange={(e) => setData('instructions', e.target.value)} rows={2} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                            Aktif (bisa dipilih Customer)
                        </label>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Metode yang dihapus tidak bisa dipilih lagi. Riwayat yang sudah ada tidak berubah."
                    confirmLabel="Ya, hapus"
                    danger
                    onConfirm={() => {
                        router.delete(route('rtpu.metode.destroy', del.id), {
                            onFinish: () => setDel(null),
                        });
                    }}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
