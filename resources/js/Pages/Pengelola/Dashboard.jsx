import { Head, Link } from '@inertiajs/react';
import { Box, CheckCircle2, Clock, Plus, ShieldCheck, XCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, StatusBadge, PrimaryButton } from '@/Components/ui';

export default function PengelolaDashboard({ auth, stats = {}, recentProducts = [] }) {
    return (
        <DashboardLayout title="Dashboard Pengelola" breadcrumb="Pengelola / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Pengelola · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin Pengelola Unit"
                    title={`Selamat Datang, ${auth?.user?.name || 'Pengelola Unit'}`}
                    desc="Kelola katalog produk inovasi riset, pantau status kurasi kurator RTPU hingga terbit di katalog umum."
                    actions={
                        <PrimaryButton href={route('pengelola.produk.create')}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Tambah Produk Riset
                        </PrimaryButton>
                    }
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 border-l-4 border-l-blue-500">
                        <span className="text-xs text-slate-500">Total Produk</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total ?? 0}</p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-amber-500">
                        <span className="text-xs text-slate-500">Pending Kurasi</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending ?? 0}</p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-indigo-500">
                        <span className="text-xs text-slate-500">Verifikasi RTPU</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.verified ?? 0}</p>
                    </Card>
                    <Card className="p-4 border-l-4 border-l-emerald-500">
                        <span className="text-xs text-slate-500">Disetujui Publikasi</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.approved ?? 0}</p>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900">Produk Inovasi Terbaru</h2>
                        <Link href={route('pengelola.produk.index')} className="text-xs text-amber-600 font-semibold hover:underline">
                            Lihat Semua
                        </Link>
                    </div>

                    {recentProducts.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">Belum ada produk inovasi yang didaftarkan.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentProducts.map((p) => (
                                <div key={p.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{p.name || p.nama}</p>
                                        <p className="text-xs text-slate-500">{p.category?.name || 'Inovasi'}</p>
                                    </div>
                                    <StatusBadge status={p.curation_status || p.status_kurasi || 'draft'} />
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </FadeIn>
        </DashboardLayout>
    );
}
