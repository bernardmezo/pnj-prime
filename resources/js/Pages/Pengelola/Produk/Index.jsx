import { Head, Link } from '@inertiajs/react';
import { Package, Plus } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge, PrimaryButton } from '@/Components/ui';

export default function PengelolaProdukIndex({ auth, products = [] }) {
    const list = Array.isArray(products) ? products : (products?.data || []);

    return (
        <DashboardLayout title="Katalog Produk Inovasi" breadcrumb="Pengelola / Produk" activeKey="catalog">
            <Head title="Kelola Produk Inovasi · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin Pengelola Unit"
                    title="Katalog Produk & Inovasi Unit"
                    desc="Daftarkan inovasi dan layanan riset unit Anda untuk ditelaah oleh tim kurator RTPU."
                    actions={
                        <PrimaryButton href={route('pengelola.produk.create')}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Tambah Produk Baru
                        </PrimaryButton>
                    }
                />

                {list.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="Belum Ada Produk Riset"
                        desc="Mulai daftarkan inovasi riset unggulan laboratorium/jurusan Anda sekarang."
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {list.map((item) => (
                            <Card key={item.id} className="p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name || item.nama}</h3>
                                        <StatusBadge status={item.curation_status || item.status_kurasi || 'draft'} />
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                        {item.short_description || item.description || 'Tidak ada deskripsi singkat.'}
                                    </p>
                                </div>
                                <div className="border-t pt-3 flex items-center justify-between text-xs text-slate-600">
                                    <span className="font-semibold">Rp {Number(item.base_price || item.harga || 0).toLocaleString('id-ID')}</span>
                                    <span className="text-slate-400">{item.category?.name || 'Inovasi'}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
