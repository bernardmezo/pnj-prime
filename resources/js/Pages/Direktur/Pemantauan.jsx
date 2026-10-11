import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';
import { mockPengajuan, mockProdukUnggulan } from '@/mocks/data';

// Read-only everywhere on this page.
export default function DirekturPemantauan({ auth, produk, layanan }) {
    const [tab, setTab] = useState('produk');
    const produkRows = produk ?? mockProdukUnggulan;
    const layananRows = layanan ?? mockPengajuan;

    return (
        <DashboardLayout title="Pemantauan" breadcrumb="Direktur / Pemantauan" activeKey="pantau">
            <Head title="Pemantauan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Direktur"
                    title="Pemantauan"
                    desc="Pengajuan produk unggulan dan layanan dalam semua status. Halaman ini hanya untuk pemantauan."
                />
                <div className="mb-4 flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }} role="tablist">
                    {[
                        ['produk', 'Produk Unggulan'],
                        ['layanan', 'Layanan'],
                    ].map(([v, label]) => (
                        <button
                            key={v}
                            type="button"
                            role="tab"
                            aria-selected={tab === v}
                            onClick={() => setTab(v)}
                            className="relative px-4 py-2.5 text-sm font-semibold transition"
                            style={{ color: tab === v ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                        >
                            {label}
                            {tab === v && (
                                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                            )}
                        </button>
                    ))}
                </div>
                {tab === 'produk' ? (
                    <Table columns={['Kode', 'Nama Produk', 'Peneliti', 'Tanggal', 'Status']}>
                        <tbody>
                            {produkRows.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td strong>{p.name}</Td>
                                    <Td>{p.researcher}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <Table columns={['Kode', 'Layanan', 'Customer', 'Tanggal', 'Status']}>
                        <tbody>
                            {layananRows.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td strong>{p.layanan}</Td>
                                    <Td>{p.customer}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
