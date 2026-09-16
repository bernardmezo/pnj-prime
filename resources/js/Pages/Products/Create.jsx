import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ProductCreate({ categories = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name:              '',
        category_id:       '',
        short_description: '',
        description:       '',
        base_price:        '',
        final_price:       '',
        stock:             '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('products.store'));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Tambah Produk</h2>}>
            <Head title="Tambah Produk — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-white shadow-card p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div>
                                <InputLabel htmlFor="name" value="Nama Produk" />
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 w-full"
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="category_id" value="Kategori" />
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-surface-border shadow-sm focus:border-prime-500 focus:ring-prime-500"
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
                                    className="mt-1 block w-full rounded-md border-surface-border shadow-sm focus:border-prime-500 focus:ring-prime-500"
                                />
                                <InputError message={errors.short_description} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="base_price" value="Harga Dasar (Rp)" />
                                    <TextInput
                                        id="base_price"
                                        type="number"
                                        value={data.base_price}
                                        onChange={(e) => setData('base_price', e.target.value)}
                                        className="mt-1 w-full"
                                    />
                                    <InputError message={errors.base_price} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="final_price" value="Harga Jual (Rp)" />
                                    <TextInput
                                        id="final_price"
                                        type="number"
                                        value={data.final_price}
                                        onChange={(e) => setData('final_price', e.target.value)}
                                        className="mt-1 w-full"
                                    />
                                    <InputError message={errors.final_price} className="mt-1" />
                                </div>
                            </div>

                            <p className="text-xs text-gray-400">
                                * Produk akan masuk status <strong>Draft</strong> dan perlu diajukan untuk kurasi.
                            </p>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan Produk'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
