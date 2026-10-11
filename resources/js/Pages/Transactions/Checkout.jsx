import { Head } from '@inertiajs/react';
import { Landmark, UploadCloud } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card } from '@/Components/ui';

// TODO(backend): superseded by Customer/Pembayaran; remove transactions.checkout route when backend migrates
export default function Checkout({ auth, payment_info }) {
    const info = payment_info ?? {};
    return (
        <PublicLayout auth={auth}>
            <Head title="Checkout · PNJ Prime" />
            <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
                <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Checkout</p>
                <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                    Instruksi Pembayaran
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                    Transfer pembayaran ke rekening resmi PNJ berikut, kemudian unggah bukti transfer pada halaman detail pesanan Anda.
                </p>

                <Card className="mt-6 p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                            <Landmark className="h-5 w-5" />
                        </span>
                        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Rekening Resmi PNJ</h2>
                    </div>
                    <div className="mt-5 space-y-3 rounded-2xl p-5" style={{ background: 'var(--color-surface)' }}>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Bank</span>
                            <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{info.bank ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>No. Rekening</span>
                            <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                                {info.account || '- (belum dikonfigurasi)'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Atas Nama</span>
                            <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{info.holder ?? '-'}</span>
                        </div>
                    </div>
                </Card>

                <Card className="mt-5 p-6 sm:p-8">
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Unggah Bukti Transfer</h2>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                        Format yang diterima: JPG, PNG, PDF. Maks. 5 MB.
                    </p>
                    <div className="mt-4 rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            <UploadCloud className="h-6 w-6" />
                        </span>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Unggah dari halaman detail pesanan</p>
                        <p className="mx-auto mt-1 max-w-sm text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            Setelah pesanan dibuat, buka menu Pesanan Saya, pilih pesanan, lalu unggah bukti transfer di sana.
                        </p>
                    </div>
                </Card>
            </div>
        </PublicLayout>
    );
}
