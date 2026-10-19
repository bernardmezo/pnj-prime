import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, PageHeader, PrimaryButton, RoleBadge, StatusBadge, Table, Td } from '@/Components/ui';
import TextInput from '@/Components/ui/TextInput';
import Select from '@/Components/ui/Select';
import Switch from '@/Components/ui/Switch';
import { ROLE_KEYS, roleLabel } from '@/lib/roles';

const EMPTY = { name: '', email: '', password: '', role: 'customer', active: true };

export default function UsersIndex({ auth, users = [] }) {
    const rows = users;
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm(EMPTY);

    const openAdd = () => { setEditing('new'); reset(); setData(EMPTY); };
    const openEdit = (u) => { setEditing(u.id); setData({ name: u.name, email: u.email, password: '', role: u.role, active: u.status !== 'Nonaktif' }); };
    const save = () => {
        if (editing === 'new') {
            post(route('superadmin.users.store'), { onSuccess: () => setEditing(null) });
        } else {
            patch(route('superadmin.users.update', editing), { onSuccess: () => setEditing(null) });
        }
    };
    const toggleActive = (u) => {
        router.patch(route('superadmin.users.toggle', u.id));
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
                    processing={processing}
                >
                    <div className="space-y-3">
                        <TextInput
                            label="Nama lengkap"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        <TextInput
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                        />
                        <TextInput
                            label={editing === 'new' ? 'Kata sandi' : 'Kata sandi baru (kosongkan bila tidak diubah)'}
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            error={errors.password}
                        />
                        <Select
                            label="Role"
                            value={data.role}
                            onChange={(v) => setData('role', v)}
                            options={ROLE_KEYS.map((k) => ({ value: k, label: roleLabel(k) }))}
                            error={errors.role}
                        />
                        <Switch
                            checked={data.active}
                            onChange={(v) => setData('active', v)}
                            label="Akun aktif"
                            description="Nonaktifkan agar user tidak dapat masuk."
                        />
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="User yang dihapus tidak dapat masuk lagi. Tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Ya, hapus"
                    danger
                    onConfirm={() => {
                        router.delete(route('superadmin.users.destroy', del.id), {
                            onFinish: () => setDel(null),
                        });
                    }}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
