import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, Field, PageHeader, PrimaryButton, StatusBadge, Table, Td, inputClass, inputStyleProps } from '@/Components/ui';

const EMPTY = { name: '', key: '', desc: '', active: true };

const PROTECTED_FITUR = ['pengguna', 'hak-akses', 'fitur'];

export default function FiturIndex({ auth, fitur = [] }) {
    const rows = fitur;
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm(EMPTY);

    const openAdd = () => { setEditing('new'); reset(); setData(EMPTY); };
    const openEdit = (f) => { setEditing(f.key); setData({ name: f.name, key: f.key, desc: f.desc ?? '', active: f.active }); };
    const save = () => {
        if (editing === 'new') {
            post(route('superadmin.fitur.store'), { onSuccess: () => setEditing(null) });
        } else {
            patch(route('superadmin.fitur.update', editing), { onSuccess: () => setEditing(null) });
        }
    };

    return (
        <DashboardLayout title="Kelola Fitur" breadcrumb="Super Admin / Kelola Fitur" activeKey="fitur">
            <Head title="Kelola Fitur · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Kelola Fitur"
                    desc="Modul dan menu yang menjadi baris pada matriks Hak Akses."
                    actions={<PrimaryButton onClick={openAdd}>+ Tambah Fitur</PrimaryButton>}
                />
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada fitur" desc="Tambahkan fitur pertama." />
                ) : (
                    <Table columns={['Nama Fitur', 'Kunci', 'Deskripsi', 'Status', '']}>
                        <tbody>
                            {rows.map((f) => (
                                <tr key={f.key} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{f.name}</Td>
                                    <Td className="font-mono">{f.key}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{f.desc}</span></Td>
                                    <Td><StatusBadge label={f.active ? 'Aktif' : 'Nonaktif'} tone={f.active ? 'teal' : 'muted'} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <button type="button" onClick={() => openEdit(f)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </button>
                                            {PROTECTED_FITUR.includes(f.key) ? (
                                                <span className="text-sm" style={{ color: 'var(--color-muted)' }} title="Fitur dilindungi agar tidak terkunci">
                                                    Dilindungi
                                                </span>
                                            ) : (
                                                <button type="button" onClick={() => setDel(f)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                    Hapus
                                                </button>
                                            )}
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <ConfirmModal
                    open={editing !== null}
                    title={editing === 'new' ? 'Tambah Fitur' : 'Ubah Fitur'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                    processing={processing}
                >
                    <div className="space-y-3">
                        <Field label="Nama fitur" error={errors.name}>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        {editing === 'new' && (
                            <Field label="Kunci" error={errors.key}>
                                <input value={data.key} onChange={(e) => setData('key', e.target.value)} placeholder="mis. katalog" className={inputClass} {...inputStyleProps()} />
                            </Field>
                        )}
                        <Field label="Deskripsi" error={errors.desc}>
                            <textarea value={data.desc} onChange={(e) => setData('desc', e.target.value)} rows={2} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            <input
                                type="checkbox"
                                checked={data.active}
                                onChange={(e) => setData('active', e.target.checked)}
                                disabled={editing !== 'new' && PROTECTED_FITUR.includes(data.key)}
                                title={editing !== 'new' && PROTECTED_FITUR.includes(data.key) ? 'Fitur dilindungi agar tidak terkunci' : undefined}
                                className="h-4 w-4 rounded disabled:opacity-40"
                                style={{ accentColor: 'var(--color-accent)' }}
                            />
                            Aktif
                        </label>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Izin yang memakai fitur ini ikut terhapus. Tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Ya, hapus"
                    danger
                    onConfirm={() => {
                        router.delete(route('superadmin.fitur.destroy', del.key), {
                            onFinish: () => setDel(null),
                        });
                    }}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
