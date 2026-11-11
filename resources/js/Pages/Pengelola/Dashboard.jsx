import { Head, Link } from '@inertiajs/react';
import { Box, CheckCircle2, Clock, Plus, ShieldCheck, XCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function Card({ children, className = '' }) {
    return (
        <div className={`rounded-2xl border bg-white shadow-sm ${className}`} style={{ borderColor: 'var(--color-border)' }}>
            {children}
        </div>
    );
}

function FadeIn({ children, className = '' }) {
    return <div className={className}>{children}</div>;
}

function PageHeader({ eyebrow, title, desc, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                {eyebrow && <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>{eyebrow}</span>}
                <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{title}</h1>
                {desc && <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700' },
        pending: { label: 'Pending Kurasi', bg: 'bg-amber-50', text: 'text-amber-700' },
        verified: { label: 'Verifikasi RTPU', bg: 'bg-indigo-50', text: 'text-indigo-700' },
        approved: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        rejected: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700' },
    };
    const s = map[status] || map.draft;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

export default function PengelolaDashboard({ auth, stats = {}, recentProducts = [] }) {
    return (
        <DashboardLayout title="Dashboard Pengelola" breadcrumb="Pengelola / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Pengelola · PNJ Prime" />
            <FadeIn>
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 mb-2">Admin Pengelola Unit</span>
                            <h1 className="text-2xl font-bold text-slate-950">Selamat Datang, {auth?.user?.name || 'Pengelola Unit'}</h1>
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl">Kelola katalog produk inovasi riset, pantau status kurasi kurator RTPU hingga terbit di katalog umum PNJ Prime.</p>
                        </div>
                        <Link
                            href={route('pengelola.produk.create')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90 self-start md:self-auto"
                            style={{ background: 'var(--color-accent)' }}
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Produk Riset
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Produk</span>
                            <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats?.total ?? 0}</p>
                            <span className="text-[11px] text-slate-400 mt-1 block">Seluruh inovasi terdaftar</span>
                        </Card>
                        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Kurasi</span>
                            <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats?.pending ?? 0}</p>
                            <span className="text-[11px] text-slate-400 mt-1 block">Menunggu review kurator</span>
                        </Card>
                        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verifikasi RTPU</span>
                            <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats?.verified ?? 0}</p>
                            <span className="text-[11px] text-slate-400 mt-1 block">Proses akhir pimpinan</span>
                        </Card>
                        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Disetujui Publikasi</span>
                            <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats?.approved ?? 0}</p>
                            <span className="text-[11px] text-slate-400 mt-1 block">Tayang di katalog umum</span>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="p-6 lg:col-span-2 rounded-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Produk Inovasi Terbaru</h2>
                                    <p className="text-xs text-slate-500">Daftar produk atau layanan riset yang baru saja diajukan</p>
                                </div>
                                <Link href={route('pengelola.produk.index')} className="text-xs font-bold text-teal-700 hover:underline">
                                    Lihat Semua →
                                </Link>
                            </div>

                            {recentProducts.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm">
                                    Belum ada produk inovasi yang didaftarkan.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentProducts.map((p) => (
                                        <div key={p.id} className="py-3.5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{p.name || p.nama}</p>
                                                <p className="text-xs text-slate-500">{p.category?.name || 'Inovasi'} · Rp {Number(p.base_price || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                            <StatusBadge status={p.curation_status || p.status_kurasi || 'draft'} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-2">Informasi & Panduan Unit</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                Pastikan setiap produk riset atau layanan yang didaftarkan melampirkan foto utama, galeri variasi, serta deskripsi spesifikasi yang lengkap.
                            </p>
                            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Status Akun:</span>
                                    <span className="font-bold text-emerald-600">Aktif & Terverifikasi</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Unit / Jurusan:</span>
                                    <span className="font-bold text-slate-900">{auth?.user?.jurusan || 'Pengelola PNJ'}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
