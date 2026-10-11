import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Users } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EmptyState, FadeIn, PageHeader, PrimaryButton, RoleBadge, Table, Td } from '@/Components/ui';

const ORIGIN_LABEL = { sso_pnj: 'SSO PNJ', local: 'Lokal', google: 'Google' };

export default function UserManagementIndex({ users }) {
    const rows = users?.data ?? [];

    return (
        <DashboardLayout title="Manajemen Pengguna & Role" breadcrumb="PNJ Prime / Pengguna">
            <Head title="Pengguna — PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Daftar Pengguna"
                    desc="Kelola akun Customer, Admin P3M, Admin RTPU, dan Super Admin beserta perannya."
                    actions={
                        <PrimaryButton href={route('admin.users.create')}>
                            <Plus className="h-4 w-4" /> Tambah Pengguna
                        </PrimaryButton>
                    }
                />
                {rows.length === 0 ? (
                    <EmptyState icon={Users} title="Belum ada pengguna" desc="Tambahkan pengguna pertama untuk platform ini." />
                ) : (
                    <Table columns={['Nama', 'Email', 'Role', 'Asal Akun', 'Bergabung', '']}>
                        <tbody>
                            {rows.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{user.name}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{user.email}</span></Td>
                                    <Td><RoleBadge role={user.role} /></Td>
                                    <Td><span className="text-xs" style={{ color: 'var(--color-muted)' }}>{ORIGIN_LABEL[user.account_origin] ?? user.account_origin ?? '—'}</span></Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '—'}</span></Td>
                                    <Td>
                                        <Link href={route('admin.users.edit', user.id)} className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </Link>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
