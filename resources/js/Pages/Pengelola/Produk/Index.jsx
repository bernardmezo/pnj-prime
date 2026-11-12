import { Head, Link, router } from '@inertiajs/react';
import { Package, Plus, Send } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge, PrimaryButton } from '@/Components/ui';

export default function PengelolaProdukIndex({ auth, products = [] }) {
    const list = Array.isArray(products) ? products : (products?.data || []);

    const handleSubmit = (id) => {
        if (confirm('Ajukan produk ini untuk verifikasi RTPU?')) {
            router.post(route('pengelola.produk.submit', id));
        }
    };

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
                                        <h3 className="font-bold text-[var(--color-ink)] text-sm line-clamp-1">{item.name || item.nama}</h3>
                                        <StatusBadge
                                            status={item.curation_status || 'draft'}
                                            label={item.curation_status === 'approved' ? 'Disetujui' : item.curation_status === 'rejected' ? 'Ditolak' : item.curation_status === 'pending' ? 'Menunggu Persetujuan' : 'Draft'}
                                            tone={item.curation_status === 'approved' ? 'teal' : item.curation_status === 'rejected' ? 'danger' : 'gold'}
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-3">
                                        {item.short_description || item.description || 'Tidak ada deskripsi singkat.'}
                                    </p>
                                    {item.curation_status === 'rejected' && item.rejection_reason && (
                                        <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                                            <strong>Alasan Penolakan:</strong> {item.rejection_reason}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t pt-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
                                    <span className="font-semibold">Rp {Number(item.base_price || item.harga || 0).toLocaleString('id-ID')}</span>
                                    <div className="flex items-center gap-2">
                                        <Link href={route('pengelola.produk.edit', item.id)} className="text-blue-600 font-semibold hover:underline">
                                            Ubah
                                        </Link>
                                        {(item.curation_status === 'draft' || item.curation_status === 'rejected') && (
                                            <button
                                                onClick={() => handleSubmit(item.id)}
                                                className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                                            >
                                                <Send className="w-3 h-3" /> Ajukan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
