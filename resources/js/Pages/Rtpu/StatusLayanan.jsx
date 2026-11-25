import { Head } from '@inertiajs/react';
import { Check, ClipboardList } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

export default function StatusLayanan({ auth, daftar = [] }) {
    const isDirektur = auth?.user?.role === 'direktur';
    const title = isDirektur ? 'Monitoring Pesanan' : 'Status Layanan';
    const role = isDirektur ? 'Direktur' : 'Admin RTPU';

    return (
        <DashboardLayout title={title} breadcrumb={`${role} / ${title}`} activeKey={isDirektur ? 'monitoring-pesanan' : 'status'}>
            <Head title={`${title} · PNJ Prime`} />
            <FadeIn>
                <PageHeader eyebrow={role} title={isDirektur ? title : 'Monitoring Status Layanan'} desc="Pantau status dan riwayat pengajuan aktif. Halaman ini hanya untuk monitoring." />
                {daftar.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="Tidak ada pengajuan aktif" desc="Pengajuan aktif akan tampil di sini." />
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-[var(--color-muted)]">Pengajuan aktif ({daftar.length})</p>
                        {daftar.map((item) => {
                            const history = Array.isArray(item.history) ? item.history.filter((entry) => entry?.status) : [];
                            const rental = ['ruangan', 'alat'].includes(item.type);
                            const stages = ['Diajukan', ...(item.status === 'Menunggu Persetujuan Pimpinan' || history.some((h) => h.status === 'Menunggu Persetujuan Pimpinan') ? ['Menunggu Persetujuan Pimpinan'] : []), ...(item.status === 'Menunggu Invoice' || history.some((h) => h.status === 'Menunggu Invoice') ? ['Menunggu Invoice'] : []), 'Menunggu Pembayaran', ...(item.status === 'Menunggu Verifikasi Pembayaran' || history.some((h) => h.status === 'Menunggu Verifikasi Pembayaran') ? ['Menunggu Verifikasi Pembayaran'] : []), 'Lunas', ...(rental ? ['Berjalan'] : item.type === 'jasa' ? ['Diproses', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah'] : ['Diproses', ...(/ambil/i.test(item.fulfillment || '') ? ['Siap Diambil'] : ['kurir', 'Diantar'].includes(item.fulfillment) ? ['Dikirim'] : [])]), 'Selesai'];
                            const currentStatus = item.status === 'Diproses' && item.pickup_ready ? 'Siap Diambil' : item.status;
                            if (!stages.includes(currentStatus)) stages.splice(stages.length - 1, 0, currentStatus);
                            const currentIndex = stages.indexOf(currentStatus);
                            return (
                                <Card key={item.id} className="p-5 sm:p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-[var(--color-muted)]">{item.type === 'jasa' ? 'Jasa' : ['ruangan', 'alat'].includes(item.type) ? 'Sewa fasilitas' : 'Produk'}</p>
                                            <h2 className="mt-1 break-words font-display text-lg font-bold text-[var(--color-ink)]">{item.layanan}</h2>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                    <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-[var(--color-border)] pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                                        <div><dt className="text-xs text-[var(--color-muted)]">ID pesanan</dt><dd className="mt-1 break-words font-semibold text-[var(--color-ink)]">{item.order_number || 'Belum tersedia'}</dd></div>
                                        <div><dt className="text-xs text-[var(--color-muted)]">ID pengajuan</dt><dd className="mt-1 break-words font-semibold text-[var(--color-ink)]">{item.code}</dd></div>
                                        <div><dt className="text-xs text-[var(--color-muted)]">Pemesan</dt><dd className="mt-1 break-words font-semibold text-[var(--color-ink)]">{item.customer || 'Tidak tersedia'}</dd></div>
                                        <div><dt className="text-xs text-[var(--color-muted)]">Pemilik produk / layanan</dt><dd className="mt-1 break-words font-semibold text-[var(--color-ink)]">{item.owner || 'Tidak tersedia'}</dd></div>
                                    </dl>
                                    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Progres pesanan</h3>
                                            <p className="text-xs text-[var(--color-muted)]">Tahapan dari awal hingga selesai · geser untuk melihat seluruhnya</p>
                                        </div>
                                        <div className="mt-4 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]" tabIndex={0} aria-label={`Riwayat progres ${item.code}`}>
                                            <ol className="flex min-w-max">
                                                {stages.map((status, index) => {
                                                    const current = index === currentIndex;
                                                    const done = index < currentIndex;
                                                    const step = [...history].reverse().find((entry) => entry.status === status) ?? { status };
                                                    return (
                                                        <li key={`${index}-${step.status}`} aria-current={current ? 'step' : undefined} className="relative w-44 shrink-0 pr-5 last:pr-0">
                                                            {index < stages.length - 1 && <span aria-hidden="true" className={`absolute left-7 right-0 top-3 h-0.5 ${done ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />}
                                                            <span className={`relative flex h-6 w-6 items-center justify-center rounded-full ${current ? 'bg-[var(--color-gold)] text-white' : done ? 'bg-[var(--color-accent)] text-white' : 'border-2 border-[var(--color-border)] bg-white'}`} aria-hidden="true">{done && <Check className="h-3.5 w-3.5" />}</span>
                                                            <p className="mt-2 break-words text-sm font-semibold text-[var(--color-ink)]">{step.status}</p>
                                                            <p className="mt-1 text-xs text-[var(--color-muted)]">{current ? 'Status saat ini' : done ? 'Sudah dilalui' : 'Belum dimulai'}</p>
                                                            {step.at && <p className="mt-1 text-xs text-[var(--color-muted)]">{step.at}{step.by ? ` · ${step.by}` : ''}</p>}
                                                            {step.note && <p className="mt-1 break-words text-xs leading-relaxed text-[var(--color-muted)]">{step.note}</p>}
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
