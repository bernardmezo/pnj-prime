import { Head } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import PublicLayout from '@/Layouts/PublicLayout';
import StatusTimeline from '@/Components/StatusTimeline';
import { EASE, EmptyState, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';
import { LAYANAN_FLOW } from '@/lib/statuses';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function Riwayat({ auth, riwayat = [] }) {
    const role = auth?.user?.role;
    const rows = riwayat;
    const [openId, setOpenId] = useState(null);
    const reduce = useReducedMotion();
    const open = rows.find((r) => r.id === openId) ?? null;

    return (
        <PublicLayout auth={auth}>
            <Head title="Riwayat Transaksi · PNJ Prime" />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow="Customer"
                    title="Riwayat Transaksi Layanan"
                    desc="Item yang sudah selesai, dibatalkan, atau ditolak final."
                />
                <CustomerTabs active="riwayat" role={role} />
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada riwayat" desc="Transaksi yang sudah selesai akan muncul di sini." />
                ) : (
                    <Table columns={['Kode', 'Tipe', 'Layanan', 'Tanggal', 'Status', '']}>
                        <tbody>
                            {rows.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td>{TYPE_LABEL[p.type] ?? p.type}</Td>
                                    <Td strong>{p.layanan}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                    <Td>
                                        <button type="button" onClick={() => setOpenId(p.id)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                            Detail
                                        </button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <AnimatePresence>
                    {open && (
                        <>
                            <motion.div
                                className="fixed inset-0 z-[70]"
                                style={{ background: 'rgba(26,29,28,0.5)' }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.2 }}
                                onClick={() => setOpenId(null)}
                            />
                            <motion.aside
                                className="fixed inset-y-0 right-0 z-[71] w-full max-w-md overflow-y-auto bg-white p-6"
                                initial={{ x: reduce ? 0 : '100%' }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : '100%' }}
                                transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                                aria-label={`Detail ${open.code}`}
                            >
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{open.code}</p>
                                        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{open.layanan}</h2>
                                        <div className="mt-1.5"><StatusBadge status={open.status} label={open.status} /></div>
                                    </div>
                                    <button type="button" onClick={() => setOpenId(null)} className="rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}>
                                        Tutup
                                    </button>
                                </div>
                                <StatusTimeline flow={LAYANAN_FLOW} history={open.history ?? []} current={open.status} />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PublicLayout>
    );
}
