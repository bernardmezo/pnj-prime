import { Head } from '@inertiajs/react';
import { BarChart3, Download, ShoppingCart, Wallet } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, SecondaryButton, StatCard, inputClass, inputStyleProps } from '@/Components/ui';

export default function OwnerReport({ summary = {} }) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    return (
        <DashboardLayout title="Laporan Saya" breadcrumb="PNJ Prime / Laporan">
            <Head title="Laporan — PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Laporan Transaksi Produk Anda"
                    desc="Pantau performa produk dan inovasi yang Anda ajukan."
                    actions={
                        <SecondaryButton onClick={() => window.print()}>
                            <Download className="h-4 w-4" /> Ekspor
                        </SecondaryButton>
                    }
                />

                <Card className="mb-5 flex flex-wrap items-end gap-4 p-5">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Dari tanggal</span>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Sampai tanggal</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </label>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Produk saya" value={Number(summary.my_products ?? 0)} icon={BarChart3} index={0} />
                    <StatCard label="Pesanan produk saya" value={Number(summary.my_orders ?? 0)} icon={ShoppingCart} index={1} />
                    <StatCard label="Pendapatan produk saya" value={Number(summary.my_revenue ?? 0)} icon={Wallet} index={2} />
                </div>

                <Card className="mt-5 p-10 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        Data rinci laporan akan tampil di sini setelah modul analitik backend tersedia.
                    </p>
                </Card>
            </FadeIn>
        </DashboardLayout>
    );
}
