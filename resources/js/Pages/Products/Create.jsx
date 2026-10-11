import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader } from '@/Components/ui';

function Section({ title, desc, children }) {
    return (
        <Card className="p-6 sm:p-8">
            <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
            {desc && <p className="mb-5 mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>{desc}</p>}
            <div className="mt-4 space-y-5">{children}</div>
        </Card>
    );
}

export default function ProductCreate({ categories = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: '',
        short_description: '',
        description: '',
        base_price: '',
        final_price: '',
        stock: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('products.store'));
    }

    return (
        <DashboardLayout title="Tambah Produk" breadcrumb="PNJ Prime / Produk / Tambah">
            <Head title="Tambah Produk — PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Ajukan Inovasi Baru"
                    desc="Lengkapi detail produk. Produk tersimpan sebagai Draft dan perlu diajukan untuk kurasi Admin RTPU."
                />
                <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5 pb-24">
                    <Section title="Informasi produk" desc="Nama dan kategori sesuai jenis layanan: produk fisik, jasa pengujian, atau sewa fasilitas.">
                        <div>
                            <InputLabel htmlFor="name" value="Nama Produk" />
                            <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full" required />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="category_id" value="Kategori" />
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="mt-1 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                                required
                            >
                                <option value="">Pilih kategori...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.category_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="short_description" value="Deskripsi Singkat" />
                            <textarea
                                id="short_description"
                                value={data.short_description}
                                onChange={(e) => setData('short_description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            />
                            <InputError message={errors.short_description} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="description" value="Deskripsi Lengkap" />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                className="mt-1 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>
                    </Section>

                    <Section title="Harga & stok" desc="Harga jual adalah harga yang tampil di katalog.">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="base_price" value="Harga Dasar (Rp)" />
                                <TextInput id="base_price" type="number" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.base_price} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="final_price" value="Harga Jual (Rp)" />
                                <TextInput id="final_price" type="number" value={data.final_price} onChange={(e) => setData('final_price', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.final_price} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="stock" value="Stok" />
                                <TextInput id="stock" type="number" value={data.stock} onChange={(e) => setData('stock', e.target.value)} className="mt-1 w-full" />
                                <InputError message={errors.stock} className="mt-1" />
                            </div>
                        </div>
                    </Section>

                    {/* Sticky save bar */}
                    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur lg:left-64" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                Produk akan masuk status <strong>Draft</strong>.
                            </p>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Produk'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
