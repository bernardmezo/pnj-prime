import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, Field, PageHeader, PrimaryButton, RoleBadge, StatusBadge, Table, Td, inputClass, inputStyleProps } from '@/Components/ui';
import { ROLE_KEYS, roleLabel } from '@/lib/roles';
import { mockUsers } from '@/mocks/data';

// TODO(backend): no user CRUD routes for these six roles yet. Tambah/Ubah/
// Hapus/Aktifkan are local state only, with a neutral notice.
let nextId = 100;

const EMPTY = { name: '', email: '', role: 'customer', active: true };

export default function UsersIndex({ auth, users }) {
    const [rows, setRows] = useState(users ?? mockUsers);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [del, setDel] = useState(null);
    const [notice, setNotice] = useState(null);

    const openAdd = () => { setEditing('new'); setForm(EMPTY); };
    const openEdit = (u) => { setEditing(u.id); setForm({ name: u.name, email: u.email, role: u.role, active: u.status !== 'Nonaktif' }); };
    const save = () => {
        if (editing === 'new') {
            setRows((r) => [...r, { ...form, id: nextId++, status: form.active ? 'Aktif' : 'Nonaktif' }]);
        } else {
            setRows((r) => r.map((x) => (x.id === editing ? { ...x, ...form, status: form.active ? 'Aktif' : 'Nonaktif' } : x)));
        }
        setEditing(null);
        setNotice('Perubahan tersimpan lokal (pratinjau). Backend perlu menyediakan endpoint kelola user.');
    };
    const toggleActive = (u) => {
        setRows((r) => r.map((x) => (x.id === u.id ? { ...x, status: x.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif' } : x)));
        setNotice('Perubahan tersimpan lokal (pratinjau). Backend perlu menyediakan endpoint kelola user.');
    };

    return (
        <DashboardLayout title="Kelola User" breadcrumb="Super Admin / Kelola User" activeKey="users">
            <Head title="Kelola User · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Kelola User"
                    desc="Tambah, ubah, hapus, serta aktifkan dan nonaktifkan akun keenam peran."
                    actions={<PrimaryButton onClick={openAdd}>+ Tambah User</PrimaryButton>}
                />
                {notice && (
                    <p className="mb-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                        {notice}
                    </p>
                )}
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada user" desc="Tambahkan user pertama." />
                ) : (
                    <Table columns={['Nama', 'Email', 'Role', 'Status', '']}>
                        <tbody>
                            {rows.map((u) => (
                                <tr key={u.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{u.name}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{u.email}</span></Td>
                                    <Td><RoleBadge role={u.role} /></Td>
                                    <Td><StatusBadge label={u.status} tone={u.status === 'Nonaktif' ? 'muted' : 'teal'} /></Td>
                                    <Td>
                                        <span className="flex flex-wrap gap-3">
                                            <button type="button" onClick={() => openEdit(u)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </button>
                                            <button type="button" onClick={() => toggleActive(u)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                {u.status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                                            </button>
                                            <button type="button" onClick={() => setDel(u)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
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
                    title={editing === 'new' ? 'Tambah User' : 'Ubah User'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                >
                    <div className="space-y-3">
                        <Field label="Nama lengkap">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Email">
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Role">
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} {...inputStyleProps()}>
                                {ROLE_KEYS.map((k) => <option key={k} value={k}>{roleLabel(k)}</option>)}
                            </select>
                        </Field>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                            Akun aktif
                        </label>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Penghapusan user belum tersedia. Backend perlu menyediakan endpoint hapus user."
                    confirmLabel="Mengerti"
                    onConfirm={() => setDel(null)}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
