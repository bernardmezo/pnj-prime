import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, PrimaryButton } from '@/Components/ui';

export default function PengelolaProdukForm({ auth, categories = [], item = null }) {
    const isEdit = Boolean(item);
    const { data, setData, post, patch, processing, errors } = useForm({
        name: item?.name || '',
        category_id: item?.category_id || (categories[0]?.id ?? ''),
        base_price: item?.base_price || '',
        short_description: item?.short_description || '',
        description: item?.description || '',
        stock: item?.stock || 10,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('pengelola.produk.update', item.id));
        } else {
            post(route('pengelola.produk.store'));
        }
    };

    return (
        <DashboardLayout title={isEdit ? 'Ubah Produk Inovasi' : 'Tambah Produk Inovasi'} breadcrumb="Pengelola / Produk / Form" activeKey="catalog">
            <Head title={`${isEdit ? 'Ubah' : 'Tambah'} Produk · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin Pengelola Unit"
                    title={isEdit ? 'Ubah Informasi Produk Riset' : 'Daftarkan Produk / Inovasi Baru'}
                    desc="Lengkapi spesifikasi teknis dan rincian inovasi untuk diajukan ke kurator RTPU."
                />

                <Card className="p-6 max-w-3xl">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk / Inovasi</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Alat Sensor Kualitas Udara Pintar"
                                className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                required
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Produk</label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                    required
                                >
                                    <option value="" disabled>Pilih Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Harga (Rp)</label>
                                <input
                                    type="number"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', e.target.value)}
                                    placeholder="5000000"
                                    className="w-full rounded border border-slate-300 p-2.5 text-sm"
                                    required
                                />
                                {errors.base_price && <p className="text-xs text-red-500 mt-1">{errors.base_price}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                            <input
                                type="text"
                                value={data.short_description}
                                onChange={(e) => setData('short_description', e.target.value)}
                                placeholder="Ringkasan 1-2 kalimat fungsi inovasi"
                                className="w-full rounded border border-slate-300 p-2.5 text-sm"
                            />
                            {errors.short_description && <p className="text-xs text-red-500 mt-1">{errors.short_description}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Lengkap & Spesifikasi</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={5}
                                placeholder="Jelaskan spesifikasi alat, standar pengujian, dan kegunaan..."
                                className="w-full rounded border border-slate-300 p-2.5 text-sm"
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        <div className="pt-3 flex gap-3">
                            <PrimaryButton disabled={processing} className="justify-center">
                                <Save className="w-4 h-4 mr-1.5" />
                                {isEdit ? 'Simpan Perubahan' : 'Simpan Sebagai Draft'}
                            </PrimaryButton>
                        </div>
                    </form>
                </Card>
            </FadeIn>
        </DashboardLayout>
    );
}
