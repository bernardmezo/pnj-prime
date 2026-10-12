import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, PageHeader, PrimaryButton, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

const TABS = [
    { value: 'jasa', label: 'Jasa' },
    { value: 'ruangan', label: 'Ruangan' },
    { value: 'produk', label: 'Produk' },
];

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function LayananIndex({ auth, layanan = [] }) {
    const role = auth?.user?.role;
    const rows = layanan;
    const [tab, setTab] = useState('jasa');
    const [del, setDel] = useState(null);
    const visible = rows.filter((l) => l.type === tab);

    return (
        <DashboardLayout title="Kelola Layanan" breadcrumb="Admin RTPU / Kelola Layanan" activeKey="layanan">
            <Head title="Kelola Layanan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Kelola Layanan"
                    desc="Lihat daftar, tambah, ubah, dan hapus layanan jasa, ruangan, dan produk."
                    actions={
                        <PrimaryButton href={navHref('rtpu.layanan.form', { tipe: tab }, role)}>
                            + Tambah {TYPE_LABEL[tab]}
                        </PrimaryButton>
                    }
                />
                <div className="mb-4 flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }} role="tablist">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.value}
                            onClick={() => setTab(t.value)}
                            className="relative px-4 py-2.5 text-sm font-semibold transition"
                            style={{ color: tab === t.value ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                        >
                            {t.label}
                            {tab === t.value && (
                                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                            )}
                        </button>
                    ))}
                </div>
                {visible.length === 0 ? (
                    <EmptyState title={`Belum ada ${TYPE_LABEL[tab]}`} desc="Tambahkan layanan pertama pada tipe ini." />
                ) : (
                    <Table columns={['Kode', 'Nama', 'Harga', 'Status', '']}>
                        <tbody>
                            {visible.map((l) => (
                                <tr key={l.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{l.code}</Td>
                                    <Td strong>
                                        {l.name}
                                        {l.dari_pu && (
                                            <span className="ml-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                                                Dari Produk Unggulan
                                            </span>
                                        )}
                                    </Td>
                                    <Td>Rp {Number(l.price ?? 0).toLocaleString('id-ID')}</Td>
                                    <Td><StatusBadge status={l.status} label={l.status} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <a href={navHref('rtpu.layanan.form', { id: l.id, tipe: tab }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </a>
                                            <button type="button" onClick={() => setDel(l)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
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
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Layanan yang dihapus tidak tampil lagi di katalog. Tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Ya, hapus"
                    danger
                    onConfirm={() => {
                        router.delete(route('rtpu.layanan.destroy', del.id), {
                            onFinish: () => setDel(null),
                        });
                    }}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}

