import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, Field, PageHeader, PrimaryButton, StatusBadge, Table, Td, inputClass, inputStyleProps } from '@/Components/ui';
import { mockFitur } from '@/mocks/data';

// TODO(backend): no fitur routes yet. List/CRUD is local state only, with a
// neutral notice; nothing is sent. These rows feed the Hak Akses matrix.
let nextId = 100;

const EMPTY = { name: '', key: '', desc: '', active: true };

export default function FiturIndex({ auth, fitur }) {
    const [rows, setRows] = useState(fitur ?? mockFitur);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [del, setDel] = useState(null);
    const [notice, setNotice] = useState(null);

    const openAdd = () => { setEditing('new'); setForm(EMPTY); };
    const openEdit = (f) => { setEditing(f.key); setForm({ name: f.name, key: f.key, desc: f.desc, active: f.active }); };
    const save = () => {
        if (editing === 'new') {
            setRows((r) => [...r, { ...form, key: form.key || `fitur-${nextId++}` }]);
        } else {
            setRows((r) => r.map((x) => (x.key === editing ? { ...x, ...form } : x)));
        }
        setEditing(null);
        setNotice('Perubahan tersimpan lokal (pratinjau). Backend perlu menyediakan endpoint kelola fitur.');
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
                {notice && (
                    <p className="mb-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                        {notice}
                    </p>
                )}
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
                                            <button type="button" onClick={() => setDel(f)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
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
                    title={editing === 'new' ? 'Tambah Fitur' : 'Ubah Fitur'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                >
                    <div className="space-y-3">
                        <Field label="Nama fitur">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Kunci">
                            <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="mis. katalog" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Deskripsi">
                            <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                            Aktif
                        </label>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Penghapusan fitur belum tersedia. Backend perlu menyediakan endpoint hapus fitur."
                    confirmLabel="Mengerti"
                    onConfirm={() => setDel(null)}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
