import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function UserManagementIndex({ users }) {
    const roleLabel = {
        admin_rtpu:     'Admin RTPU',
        dosen_peneliti: 'Dosen Peneliti',
        mahasiswa:      'Mahasiswa',
        eksternal:      'Eksternal',
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Manajemen Pengguna</h2>}>
            <Head title="Pengguna — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-prime-900">Daftar Pengguna</h1>
                        <Link
                            href={route('admin.users.create')}
                            className="rounded-xl bg-prime-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-card"
                        >
                            + Tambah Pengguna
                        </Link>
                    </div>

                    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Nama</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Asal Akun</th>
                                    <th className="px-6 py-3">Bergabung</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-muted transition-colors">
                                        <td className="px-6 py-4 font-medium text-prime-900">{user.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-prime-100 px-2.5 py-0.5 text-xs font-medium text-prime-700">
                                                {roleLabel[user.role] ?? user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{user.account_origin}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={route('admin.users.edit', user.id)} className="text-prime-500 hover:underline">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
