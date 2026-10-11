import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, FadeIn, StatusBadge, Stepper, isInternalRole } from '@/Components/ui';

const STATUS_LABEL = {
    menunggu_pembayaran: 'Menunggu Pembayaran',
    menunggu_verifikasi: 'Menunggu Verifikasi',
    diproses: 'Diproses',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
};

const STEPS = ['Pesanan dibuat', 'Pembayaran', 'Verifikasi', 'Diproses', 'Selesai'];

function stepIndex(status) {
    switch (status) {
        case 'menunggu_pembayaran': return 1;
        case 'menunggu_verifikasi': return 2;
        case 'diproses': return 3;
        case 'selesai': return 5;
        default: return 0;
    }
}

export default function TransactionShow({ auth, order }) {
    const proofs = order?.paymentProofs ?? order?.payment_proofs ?? [];
    const items = order?.items ?? [];

    const content = (
        <>
            <div className="mb-6">
                <Link href={route('transactions.index')} className="group inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Kembali ke riwayat
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                        {order?.order_number ?? 'Detail Pesanan'}
                    </h1>
                    <StatusBadge status={order?.status} label={STATUS_LABEL[order?.status] ?? order?.status} />
                </div>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    Dibuat {order?.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    {order?.buyer ? ` · oleh ${order.buyer.name}` : ''}
                </p>
            </div>

            <Card className="mb-5 p-6">
                <Stepper steps={STEPS} current={stepIndex(order?.status)} />
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card className="p-6">
                    <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Item Pesanan</h2>
                    <ul className="mt-4 space-y-3">
                        {items.length === 0 && (
                            <li className="text-sm" style={{ color: 'var(--color-muted)' }}>Tidak ada item pada pesanan ini.</li>
                        )}
                        {items.map((item, i) => (
                            <li key={item.id ?? i} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)' }}>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                                    {item.product?.name ?? `Item #${i + 1}`}
                                    {item.quantity ? <span style={{ color: 'var(--color-muted)' }}> × {item.quantity}</span> : null}
                                </span>
                                <span className="shrink-0 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                    Rp {Number(item.price ?? item.subtotal ?? 0).toLocaleString('id-ID')}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Total</span>
                        <span className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                            Rp {Number(order?.total ?? 0).toLocaleString('id-ID')}
                        </span>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Bukti Pembayaran</h2>
                    {proofs.length === 0 ? (
                        <div className="mt-4 rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                <FileText className="h-6 w-6" />
                            </span>
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Belum ada bukti pembayaran yang diunggah.</p>
                        </div>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {proofs.map((proof, i) => (
                                <li key={proof.id ?? i} className="rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)' }}>
                                    {proof.file_url || proof.url ? (
                                        <a href={proof.file_url ?? proof.url} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                                            Lihat bukti {i + 1}
                                        </a>
                                    ) : (
                                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Bukti {i + 1} (pratinjau tidak tersedia)</span>
                                    )}
                                    {proof.status && (
                                        <span className="ml-2"><StatusBadge status={proof.status} label={proof.status} /></span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="mt-4 text-xs" style={{ color: 'var(--color-muted)' }}>
                        Verifikasi pembayaran dilakukan Admin RTPU. Status diperbarui otomatis setelah verifikasi.
                    </p>
                </Card>
            </div>
        </>
    );

    if (!isInternalRole(auth?.user?.role)) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Detail Pesanan — PNJ Prime" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">{content}</div>
            </PublicLayout>
        );
    }
    return (
        <DashboardLayout title="Detail Pesanan" breadcrumb="PNJ Prime / Transaksi / Detail">
            <Head title="Detail Pesanan — PNJ Prime" />
            <FadeIn>{content}</FadeIn>
        </DashboardLayout>
    );
}
