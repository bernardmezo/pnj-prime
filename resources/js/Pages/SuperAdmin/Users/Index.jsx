import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, PageHeader, PrimaryButton, RoleBadge, StatusBadge, Table, Td } from '@/Components/ui';
import TextInput from '@/Components/ui/TextInput';
import Select from '@/Components/ui/Select';
import Switch from '@/Components/ui/Switch';
import { roleLabel } from '@/lib/roles';

// Top-level role choices when creating/editing a user. Admin P3M and Admin
// Jurusan are no longer offered directly here — they are variants selected
// after picking "Admin Pengelola" (see PENGELOLA_VARIANTS below).
const CREATABLE_ROLES = ['customer', 'admin_rtpu', 'admin_pengelola', 'pimpinan_rtpu', 'direktur', 'super_admin'];
const PENGELOLA_VARIANTS = [
    { value: 'admin_p3m', label: 'Admin Pengelola — P3M' },
    { value: 'admin_jurusan', label: 'Admin Pengelola — Jurusan' },
];

const PROFILE_LABELS = {
    phone: 'Nomor telepon / WhatsApp', institution: 'Instansi/organisasi', nik_npwp: 'NIK/NPWP',
    nip: 'NIP', jurusan: 'Jurusan', prodi: 'Program Studi',
    npwp_perusahaan: 'NPWP Perusahaan', penanggung_jawab: 'Nama Penanggung Jawab', bidang_usaha: 'Bidang Usaha',
    nomor_mou_pks: 'Nomor MoU/PKS', contact_person: 'Nama Contact Person', periode_kerja_sama: 'Periode Kerja Sama',
};
const CUSTOMER_FIELDS = {
    'Industri/Perusahaan': ['institution', 'npwp_perusahaan', 'penanggung_jawab', 'bidang_usaha'],
    'Mitra kerja sama': ['institution', 'nomor_mou_pks', 'contact_person', 'periode_kerja_sama'],
    'Perguruan tinggi/lembaga lain': ['institution'],
};
const USER_TYPES = ['Masyarakat umum', 'Industri/Perusahaan', 'Mitra kerja sama', 'Perguruan tinggi/lembaga lain'];
const EMPTY = { name: '', email: '', password: '', role: 'customer', pengelola_variant: 'admin_p3m', active: true, user_type: '', ...Object.fromEntries(Object.keys(PROFILE_LABELS).map((field) => [field, ''])) };

export default function UsersIndex({ auth, users = [] }) {
    const rows = users;
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const editingUser = rows.find((u) => u.id === editing);
    const { data, setData, post, patch, processing, errors, reset } = useForm(EMPTY);

    const openAdd = () => { setEditing('new'); reset(); setData(EMPTY); };
    const openEdit = (u) => {
        setEditing(u.id);
        // admin_p3m / admin_jurusan rows edit as the admin_pengelola role with their variant preselected
        const isPengelolaVariant = u.role === 'admin_p3m' || u.role === 'admin_jurusan';
        setData({
            name: u.name,
            email: u.email,
            password: '',
            role: isPengelolaVariant ? 'admin_pengelola' : u.role,
            pengelola_variant: isPengelolaVariant || u.role === 'admin_pengelola' ? u.role : 'admin_p3m',
            active: u.status !== 'Nonaktif',
            user_type: u.user_type ?? '',
            ...Object.fromEntries(Object.keys(PROFILE_LABELS).map((field) => [field, u[field] ?? ''])),
        });
    };
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
                            options={CREATABLE_ROLES
                                .filter((k) => !(editingUser?.role === 'customer' && k === 'admin_pengelola'))
                                .map((k) => ({ value: k, label: roleLabel(k) }))}
                            error={errors.role}
                        />
                        {data.role === 'admin_pengelola' && (
                            <Select label="Jenis pengelola" value={data.pengelola_variant} onChange={(v) => setData('pengelola_variant', v)} options={editing !== 'new' && data.pengelola_variant === 'admin_pengelola' ? [...PENGELOLA_VARIANTS, { value: 'admin_pengelola', label: 'Pengelola unit (akun lama)' }] : PENGELOLA_VARIANTS} error={errors.pengelola_variant} />
                        )}
                        {data.role === 'customer' && <Select
                            label="Tipe pengguna"
                            value={data.user_type}
                            onChange={(v) => setData('user_type', v)}
                            options={[{ value: '', label: '— Tidak diisi —' }, ...(data.user_type && !USER_TYPES.includes(data.user_type) ? [{ value: data.user_type, label: data.user_type }] : []), ...USER_TYPES.map((t) => ({ value: t, label: t }))]}
                            error={errors.user_type}
                        />}
                        {Object.entries(PROFILE_LABELS).filter(([field]) => {
                            if (field === 'phone') return true;
                            if (data.role === 'customer') return field === 'nik_npwp' || (CUSTOMER_FIELDS[data.user_type] ?? []).includes(field);
                            return data.role === 'admin_pengelola' && ['institution', 'nip', 'jurusan', 'prodi'].includes(field);
                        }).map(([field, label]) => (
                            <TextInput
                                key={field}
                                label={label}
                                value={data[field] ?? ''}
                                onChange={(e) => setData(field, e.target.value)}
                                error={errors[field]}
                            />
                        ))}
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
