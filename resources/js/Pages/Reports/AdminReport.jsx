import { Head } from '@inertiajs/react';
import { BarChart3, Download, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, SecondaryButton, StatCard, inputClass, inputStyleProps } from '@/Components/ui';

// TODO(backend): not in use-case diagram; remove reports routes when backend migrates
export default function AdminReport({ summary = {} }) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [kategori, setKategori] = useState('all');

    return (
        <DashboardLayout title="Laporan" breadcrumb="PNJ Prime / Laporan">
            <Head title="Laporan Global · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Laporan & Analitik"
                    desc="Ringkasan transaksi dan performa produk di seluruh platform."
                    actions={
                        <SecondaryButton onClick={() => window.print()}>
                            <Download className="h-4 w-4" /> Ekspor
                        </SecondaryButton>
                    }
                />

                {/* Filter bar */}
                <Card className="mb-5 flex flex-wrap items-end gap-4 p-5">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Dari tanggal</span>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Sampai tanggal</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} {...inputStyleProps()} />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Kategori</span>
                        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={inputClass} {...inputStyleProps()}>
                            <option value="all">Semua kategori</option>
                            <option value="produk">Produk Fisik</option>
                            <option value="jasa">Jasa Pengujian</option>
                            <option value="sewa">Sewa Fasilitas</option>
                        </select>
                    </label>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total transaksi" value={Number(summary.total_orders ?? 0)} icon={ShoppingCart} index={0} />
                    <StatCard label="Pendapatan" value={Number(summary.revenue ?? 0)} icon={Wallet} index={1} />
                    <StatCard label="Produk aktif" value={Number(summary.active_products ?? 0)} icon={TrendingUp} index={2} />
                    <StatCard label="Pesanan selesai" value={Number(summary.completed_orders ?? 0)} icon={BarChart3} tone="gold" index={3} />
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
