import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth }) {
    const user = auth.user;

    const roleLabel = {
        admin_rtpu:      'Administrator RTPU',
        dosen_peneliti:  'Dosen Peneliti',
        mahasiswa:       'Mahasiswa',
        eksternal:       'Mitra / Publik',
    }[user.role] ?? user.role;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-prime-900">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Welcome card */}
                    <div className="mb-8 rounded-2xl bg-prime-gradient p-8 text-white shadow-modal">
                        <p className="text-sm font-medium text-prime-200">{roleLabel}</p>
                        <h1 className="mt-1 text-3xl font-bold">Selamat datang, {user.name}!</h1>
                        <p className="mt-2 text-prime-100">
                            Anda masuk ke PNJ PRIME — Platform Marketplace Digital Politeknik Negeri Jakarta.
                        </p>
                    </div>

                    {/* Quick links by role */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Catalog — visible to all */}
                        <QuickLink
                            href={route('home')}
                            title="Katalog Produk"
                            description="Jelajahi produk, jasa, dan fasilitas unggulan PNJ."
                            icon="🛍️"
                        />

                        {user.role !== 'eksternal' && (
                            <QuickLink
                                href={route('products.index')}
                                title="Manajemen Produk"
                                description="Kelola produk dan pengajuan kurasi."
                                icon="📦"
                            />
                        )}

                        {user.role === 'admin_rtpu' && (
                            <>
                                <QuickLink
                                    href={route('admin.curation.index')}
                                    title="Antrian Kurasi"
                                    description="Tinjau dan setujui produk yang diajukan."
                                    icon="✅"
                                />
                                <QuickLink
                                    href={route('admin.users.index')}
                                    title="Manajemen Pengguna"
                                    description="Kelola akun internal PNJ."
                                    icon="👥"
                                />
                            </>
                        )}

                        <QuickLink
                            href={route('transactions.index')}
                            title="Transaksi"
                            description="Lihat riwayat pesanan dan status pembayaran."
                            icon="🧾"
                        />

                        <QuickLink
                            href={route('reports.index')}
                            title="Laporan"
                            description="Ringkasan transaksi dan performa produk."
                            icon="📊"
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function QuickLink({ href, title, description, icon }) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-surface-border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-modal"
        >
            <span className="text-3xl">{icon}</span>
            <div>
                <p className="font-semibold text-prime-900 group-hover:text-prime-500 transition-colors">
                    {title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            </div>
        </Link>
    );
}
