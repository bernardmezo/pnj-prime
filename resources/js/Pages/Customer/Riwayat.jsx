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
                                <a className="mb-4 block text-sm underline" href={open.detail_url}>Lihat rincian transaksi lengkap</a>
                                {open.invoice_url && <a className="mb-4 block text-sm underline" href={open.invoice_url}>Lihat invoice</a>}
                                <StatusTimeline flow={LAYANAN_FLOW} history={open.history ?? []} current={open.status} />
                                {(open.history ?? []).map((h, i) => <div key={i} className="mt-3 border-t pt-3 text-sm"><strong>{h.status}</strong><p>{h.at} · {h.by}</p><p>{h.note}</p></div>)}
                                {open.pickup?.handed_over_at && <section className="mt-5 space-y-2 text-sm"><h3 className="font-bold">Bukti serah terima</h3><p>Pengambil: {open.pickup.collector_name}</p><p>Kontak: {open.pickup.collector_contact}</p><p>{open.pickup.handed_over_at}</p><img src={open.pickup.photo_url} alt="Pengambil bersama barang saat serah terima" className="w-full rounded-xl" /></section>}
                                {open.status === 'Selesai' && open.pickup && !open.pickup.handed_over_at && <p className="mt-4 text-sm">Bukti serah terima belum tercatat pada transaksi lama ini.</p>}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PublicLayout>
    );
}
