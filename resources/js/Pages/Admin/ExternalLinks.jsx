import { Head } from '@inertiajs/react';
import { Link2 } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EmptyState, FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';

export default function AdminExternalLinks({ links = [] }) {
    return (
        <DashboardLayout title="Tautan Eksternal" breadcrumb="PNJ Prime / Tautan Eksternal">
            <Head title="Tautan Eksternal — PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Tautan Eksternal"
                    desc="Kelola tautan layanan eksternal untuk ditampilkan pada portal."
                />
                {links.length === 0 ? (
                    <EmptyState icon={Link2} title="Belum ada tautan" desc="Tambahkan tautan layanan eksternal untuk ditampilkan pada portal." />
                ) : (
                    <Table columns={['Label', 'URL', 'Status', 'Tab Baru']}>
                        <tbody>
                            {links.map((link) => (
                                <tr key={link.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{link.label}</Td>
                                    <Td>
                                        <a href={link.url} target="_blank" rel="noreferrer" className="block max-w-xs truncate text-sm font-medium underline-offset-2 hover:underline" style={{ color: 'var(--color-accent-hover)' }}>
                                            {link.url}
                                        </a>
                                    </Td>
                                    <Td>
                                        <StatusBadge label={link.is_active ? 'Aktif' : 'Nonaktif'} tone={link.is_active ? 'teal' : 'neutral'} />
                                    </Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{link.open_new_tab ? 'Ya' : 'Tidak'}</span></Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
