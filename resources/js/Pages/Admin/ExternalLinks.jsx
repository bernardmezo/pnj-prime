import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function AdminExternalLinks({ links = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Tautan Eksternal</h2>}>
            <Head title="Tautan Eksternal — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-prime-900">Tautan Eksternal</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola tautan layanan eksternal untuk ditampilkan pada portal.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Label</th>
                                    <th className="px-6 py-3">URL</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Tab Baru</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {links.map((link) => (
                                    <tr key={link.id} className="hover:bg-surface-muted transition-colors">
                                        <td className="px-6 py-4 font-medium text-prime-900">{link.label}</td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-prime-500 hover:underline truncate max-w-xs block"
                                            >
                                                {link.url}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {link.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{link.open_new_tab ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-6 py-4 text-prime-500 hover:underline cursor-pointer">Edit</td>
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
