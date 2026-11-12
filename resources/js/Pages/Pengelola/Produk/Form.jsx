import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, PrimaryButton } from '@/Components/ui';

export default function PengelolaProdukForm({ auth, categories = [], item = null }) {
    const isEdit = Boolean(item);
    const pageErrors = usePage().props.errors || {};
    const [modalImageIndex, setModalImageIndex] = useState(null);
    const { data, setData, post, patch, processing, errors } = useForm({
        name: item?.name || '',
        category_id: item?.category_id || (categories[0]?.id ?? ''),
        target_audience: item?.target_audience || 'publik',
        availability_status: item?.availability_status || item?.meta?.availability_status || 'tersedia',
        preorder_duration: item?.preorder_duration || item?.meta?.preorder_duration || '',
        weight: item?.weight || item?.meta?.weight || 500,
        length: item?.length || item?.meta?.length || 20,
        width: item?.width || item?.meta?.width || 10,
        height: item?.height || item?.meta?.height || 5,
        base_price: item?.base_price || '',
        short_description: item?.short_description || '',
        description: item?.description || '',
        stock: item?.stock || 10,
        thumbnail: null,
        thumbnail_file: null,
        existing_thumbnail: item?.thumbnail || '',
        images: [],
        existing_images: item?.images || [],
        video_url: item?.video_url || '',
        video_file: null,
        existing_video_path: item?.video_path || '',
    });
    const formErrors = { ...errors, ...pageErrors };

    const allGalleryUrls = [];
    if (data.thumbnail_file) {
        allGalleryUrls.push(URL.createObjectURL(data.thumbnail_file));
    } else if (data.existing_thumbnail) {
        allGalleryUrls.push(`/storage/${data.existing_thumbnail}`);
    }
    data.images.forEach((f) => allGalleryUrls.push(URL.createObjectURL(f)));
    data.existing_images.forEach((img) => allGalleryUrls.push(`/storage/${img}`));

    const submit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category_id', data.category_id);
        formData.append('target_audience', data.target_audience || 'publik');
        formData.append('availability_status', data.availability_status);
        formData.append('preorder_duration', data.preorder_duration || '');
        formData.append('weight', data.weight || 1000);
        formData.append('length', data.length || 10);
        formData.append('width', data.width || 10);
        formData.append('height', data.height || 10);
        formData.append('base_price', data.base_price);
        formData.append('short_description', data.short_description || '');
        formData.append('description', data.description || '');
        formData.append('stock', data.stock || 0);
        formData.append('video_url', data.video_url || '');

        if (data.thumbnail_file) {
            formData.append('thumbnail', data.thumbnail_file);
        }
        if (data.video_file) {
            formData.append('video_file', data.video_file);
        }
        formData.append('existing_video_path', data.existing_video_path || '');

        data.images.forEach((file) => {
            formData.append('images[]', file);
        });

        data.existing_images.forEach((img) => {
            formData.append('existing_images[]', img);
        });

        if (isEdit) {
            router.post(route('pengelola.produk.update', item.id), {
                _method: 'patch',
                ...Object.fromEntries(formData),
            });
        } else {
            router.post(route('pengelola.produk.store'), formData);
        }
    };

    return (
        <DashboardLayout title={isEdit ? 'Ubah Produk Inovasi' : 'Tambah Produk Inovasi'} breadcrumb="Pengelola / Produk / Form" activeKey="catalog">
            <Head title={`${isEdit ? 'Ubah' : 'Tambah'} Produk · PNJ Prime`} />
            <FadeIn>
                <div className="max-w-7xl mx-auto space-y-6 pb-12">
                    <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 mb-2">Admin Pengelola Unit</span>
                            <h1 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Ubah Informasi Produk Riset' : 'Daftarkan Produk / Inovasi Baru'}</h1>
                            <p className="text-xs text-[var(--color-muted)] mt-1">Lengkapi spesifikasi teknis dan rincian inovasi untuk diajukan ke kurator RTPU.</p>
                        </div>
                        <a
                            href={route('pengelola.produk.index')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </a>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Kolom Form Utama (8 Span dari 12 - Lebih Lebar & Proporsional) */}
                        <div className="lg:col-span-8">
                            <Card className="p-8 shadow-sm border-[var(--color-border)] rounded-2xl">
                                <form onSubmit={submit} id="productForm" className="space-y-6" noValidate>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Nama Produk / Inovasi <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Alat Sensor Kualitas Udara Pintar"
                                    className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                    required
                                />
                                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Jenis Item <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.item_type}
                                        onChange={(e) => setData('item_type', e.target.value)}
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                        required
                                    >
                                        <option value="produk">Produk Fisik</option>
                                        <option value="jasa">Jasa / Layanan Uji</option>
                                        <option value="sewa">Sewa Fasilitas</option>
                                    </select>
                                    {formErrors.item_type && <p className="text-xs text-red-500 mt-1">{formErrors.item_type}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Ketersediaan <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.availability_status}
                                        onChange={(e) => setData('availability_status', e.target.value)}
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                        required
                                    >
                                        <option value="tersedia">Tersedia (Ready)</option>
                                        <option value="preorder">Pre-Order (PO)</option>
                                    </select>
                                    {formErrors.availability_status && <p className="text-xs text-red-500 mt-1">{formErrors.availability_status}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                                        {data.availability_status === 'preorder' ? 'Estimasi PO' : 'Stok'}
                                    </label>
                                    {data.availability_status === 'preorder' ? (
                                        <input
                                            type="text"
                                            value={data.preorder_duration}
                                            onChange={(e) => setData('preorder_duration', e.target.value)}
                                            placeholder="Cth: 3-5 hari"
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                            required
                                        />
                                    ) : (
                                        <input
                                            type="number"
                                            value={data.stock}
                                            onChange={(e) => setData('stock', e.target.value)}
                                            placeholder="10"
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                            required
                                        />
                                    )}
                                    {formErrors.preorder_duration && <p className="text-xs text-red-500 mt-1">{formErrors.preorder_duration}</p>}
                                    {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Sasaran Akses Produk <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.target_audience}
                                        onChange={(e) => setData('target_audience', e.target.value)}
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                        required
                                    >
                                        <option value="publik">Semua Pengguna (Publik & Eksternal)</option>
                                        <option value="internal_pnj">Khusus Sivitas Akademika PNJ (Internal / SSO)</option>
                                    </select>
                                    <p className="text-[11px] text-[var(--color-muted)]">
                                        {data.target_audience === 'internal_pnj'
                                            ? 'Hanya dapat dilihat dan dipesan oleh mahasiswa/dosen/staf PNJ.'
                                            : 'Dapat dilihat dan dipesan oleh masyarakat umum dan perusahaan.'}
                                    </p>
                                    {formErrors.target_audience && <p className="text-xs text-red-500 mt-1">{formErrors.target_audience}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Kategori Produk <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                        required
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.category_id && <p className="text-xs text-red-500 mt-1">{formErrors.category_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Estimasi Harga <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-[var(--color-muted)]">Rp</span>
                                        <input
                                            type="number"
                                            value={data.base_price}
                                            onChange={(e) => setData('base_price', e.target.value)}
                                            placeholder="Contoh: 1500000"
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 py-3 pl-10 pr-3 text-sm transition"
                                            required
                                        />
                                    </div>
                                    {data.base_price ? (
                                        <p className="mt-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <span>Format:</span>
                                            <span>Rp {Number(data.base_price).toLocaleString('id-ID')}</span>
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-[11px] text-[var(--color-muted)]">Masukkan angka tanpa titik/koma (misal: 1500000)</p>
                                    )}
                                    {formErrors.base_price && <p className="text-xs text-red-500 mt-1">{formErrors.base_price}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Deskripsi Singkat</label>
                                <textarea
                                    id="short_description"
                                    value={data.short_description}
                                    onChange={(e) => setData('short_description', e.target.value)}
                                    rows={2}
                                    placeholder="Ringkasan singkat produk..."
                                    className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                />
                                {formErrors.short_description && <p className="text-xs text-red-500 mt-1">{formErrors.short_description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Berat (gram) <span className="text-red-500">*</span></label>
                                    <input
                                        id="weight"
                                        type="number"
                                        value={data.weight}
                                        onChange={(e) => setData('weight', e.target.value)}
                                        placeholder="500"
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                        required
                                    />
                                    {formErrors.weight && <p className="text-xs text-red-500 mt-1">{formErrors.weight}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Panjang (cm)</label>
                                    <input
                                        id="length"
                                        type="number"
                                        value={data.length}
                                        onChange={(e) => setData('length', e.target.value)}
                                        placeholder="20"
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                    />
                                    {formErrors.length && <p className="text-xs text-red-500 mt-1">{formErrors.length}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Lebar (cm)</label>
                                    <input
                                        id="width"
                                        type="number"
                                        value={data.width}
                                        onChange={(e) => setData('width', e.target.value)}
                                        placeholder="10"
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                    />
                                    {formErrors.width && <p className="text-xs text-red-500 mt-1">{formErrors.width}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Tinggi (cm)</label>
                                    <input
                                        id="height"
                                        type="number"
                                        value={data.height}
                                        onChange={(e) => setData('height', e.target.value)}
                                        placeholder="5"
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                    />
                                    {formErrors.height && <p className="text-xs text-red-500 mt-1">{formErrors.height}</p>}
                                </div>
                            </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                Foto Utama / Thumbnail <span className="text-red-500">*</span>
                            </label>
                            <p className="text-[11px] text-[var(--color-muted)]">Digunakan sebagai gambar utama pada katalog e-commerce dan kartu produk.</p>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-teal-500 rounded-2xl p-4 bg-[var(--color-surface)]/50 hover:bg-teal-50/30 transition group">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)] group-hover:text-teal-700">
                                        <svg className="w-5 h-5 text-[var(--color-muted)] group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        <span>Klik untuk pilih foto utama</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData('thumbnail_file', file);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {data.thumbnail_file && (
                                <div className="mt-3 relative inline-block group rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white shadow-sm p-1">
                                    <div 
                                        onClick={() => setModalImageIndex(0)}
                                        className="relative cursor-pointer w-36 h-24 rounded-xl overflow-hidden bg-[var(--color-surface)] flex items-center justify-center"
                                    >
                                        <img src={URL.createObjectURL(data.thumbnail_file)} alt="Thumbnail" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                            <ZoomIn className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('thumbnail_file', null)}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow-md hover:bg-red-700 transition z-10"
                                        title="Hapus foto utama"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {!data.thumbnail_file && data.existing_thumbnail && (
                                <div className="mt-3 relative inline-block group rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white shadow-sm p-1">
                                    <div 
                                        onClick={() => setModalImageIndex(0)}
                                        className="relative cursor-pointer w-36 h-24 rounded-xl overflow-hidden bg-[var(--color-surface)] flex items-center justify-center"
                                    >
                                        <img src={`/storage/${data.existing_thumbnail}`} alt="Existing Thumbnail" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                            <ZoomIn className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('existing_thumbnail', '')}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow-md hover:bg-red-700 transition z-10"
                                        title="Hapus foto utama"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {formErrors.thumbnail && <p className="text-xs text-red-500 mt-1">{formErrors.thumbnail}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                Galeri Foto Tambahan <span className="text-[var(--color-muted)] font-normal">(Opsional: Variasi Warna/Tipe)</span>
                            </label>
                            <p className="text-[11px] text-[var(--color-muted)]">Pilih foto satu per satu atau sekaligus banyak. Klik pada foto untuk memperbesar.</p>
                            
                            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-teal-500 rounded-2xl p-5 bg-[var(--color-surface)]/50 hover:bg-teal-50/30 transition group">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)] group-hover:text-teal-700">
                                    <svg className="w-5 h-5 text-[var(--color-muted)] group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                    <span>Tambah Foto ke Galeri</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        setData('images', [...data.images, ...newFiles]);
                                    }}
                                    className="hidden"
                                />
                            </label>

                            {/* Preview list */}
                            {data.images.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {data.images.map((file, idx) => {
                                        const previewUrl = URL.createObjectURL(file);
                                        return (
                                            <div key={idx} className="relative group rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white shadow-sm flex flex-col p-1">
                                                <div 
                                                    onClick={() => setModalImageIndex((data.thumbnail_file || data.existing_thumbnail ? 1 : 0) + idx)}
                                                    className="relative cursor-pointer w-full h-24 rounded-xl overflow-hidden bg-[var(--color-surface)] flex items-center justify-center"
                                                >
                                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                                        <ZoomIn className="w-5 h-5" />
                                                    </div>
                                                </div>
                                                <div className="p-1.5 w-full">
                                                    <span className="text-[10px] text-[var(--color-muted)] truncate block text-center">{file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = data.images.filter((_, i) => i !== idx);
                                                        setData('images', updated);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow-md hover:bg-red-700 transition z-10"
                                                    title="Hapus foto"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Existing images for edit mode */}
                            {data.existing_images.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Foto Tersimpan Sebelumnya:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {data.existing_images.map((imgUrl, idx) => {
                                            const fullUrl = `/storage/${imgUrl}`;
                                            return (
                                                <div key={idx} className="relative group rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white shadow-sm flex flex-col p-1">
                                                    <div 
                                                        onClick={() => setModalImageIndex((data.thumbnail_file || data.existing_thumbnail ? 1 : 0) + data.images.length + idx)}
                                                        className="relative cursor-pointer w-full h-24 rounded-xl overflow-hidden bg-[var(--color-surface)] flex items-center justify-center"
                                                    >
                                                        <img src={fullUrl} alt="Product" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                                            <ZoomIn className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = data.existing_images.filter((_, i) => i !== idx);
                                                            setData('existing_images', updated);
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow-md hover:bg-red-700 transition z-10"
                                                        title="Hapus foto"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {formErrors.images && <p className="text-xs text-red-500 mt-1">{formErrors.images}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Link Video Promosi (YouTube / Demo Produk)</label>
                            <input
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full rounded border border-[var(--color-border)] p-2.5 text-sm"
                            />
                            {formErrors.video_url && <p className="text-xs text-red-500 mt-1">{formErrors.video_url}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Atau Upload File Video (MP4 / MOV, Max 20MB)</label>
                            <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/avi,video/x-ms-wmv"
                                onChange={(e) => setData('video_file', e.target.files[0])}
                                className="w-full rounded border border-[var(--color-border)] p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            />
                            {data.video_file && (
                                <div className="mt-3 relative rounded-xl border overflow-hidden bg-black max-w-sm">
                                    <video controls className="w-full max-h-48 object-contain">
                                        <source src={URL.createObjectURL(data.video_file)} type={data.video_file.type} />
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                    <button
                                        type="button"
                                        onClick={() => setData('video_file', null)}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow hover:bg-red-700 transition z-10"
                                        title="Hapus video"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {!data.video_file && data.existing_video_path && (
                                <div className="mt-3 relative rounded-xl border overflow-hidden bg-black max-w-sm">
                                    <video controls className="w-full max-h-48 object-contain">
                                        <source src={`/storage/${data.existing_video_path}`} />
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                    <button
                                        type="button"
                                        onClick={() => setData('existing_video_path', '')}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow hover:bg-red-700 transition z-10"
                                        title="Hapus video"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {formErrors.video_file && <p className="text-xs text-red-500 mt-1">{formErrors.video_file}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Deskripsi Lengkap & Spesifikasi</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={5}
                                placeholder="Jelaskan spesifikasi alat, standar pengujian, dan kegunaan..."
                                className="w-full rounded border border-[var(--color-border)] p-2.5 text-sm"
                            />
                            {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                        </div>

                        <div className="pt-3 flex items-center justify-between">
                            <PrimaryButton disabled={processing} className="justify-center">
                                <Save className="w-4 h-4 mr-1.5" />
                                {isEdit ? 'Simpan Perubahan' : 'Simpan Sebagai Draft'}
                            </PrimaryButton>
                            {isEdit && (item?.curation_status === 'draft' || item?.curation_status === 'rejected') && (
                                <button
                                    type="button"
                                    onClick={() => router.post(route('pengelola.produk.submit', item.id))}
                                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                                    style={{ background: 'var(--color-accent)' }}
                                >
                                    Ajukan ke RTPU
                                </button>
                            )}
                        </div>
                    </form>
                            </Card>
                        </div>

                        {/* Kolom Informasi / Panduan (4 Span dari 12) */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="p-6 shadow-sm border-[var(--color-border)] rounded-2xl bg-gradient-to-br from-teal-50/50 via-white to-white">
                                <h3 className="text-sm font-bold text-[var(--color-ink)] mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                                    Panduan Pengajuan Inovasi
                                </h3>
                                <ul className="space-y-2 text-xs text-[var(--color-muted)] list-disc list-inside">
                                    <li>Pastikan nama produk dan kategori sesuai dengan riset atau karya unit Anda.</li>
                                    <li>Estimasi harga mencerminkan nilai pasar atau biaya produksi dasar.</li>
                                    <li>Unggah thumbnail utama yang menarik agar produk menonjol di katalog e-commerce PNJ.</li>
                                    <li>Gunakan galeri tambahan untuk menampilkan variasi tipe, warna, atau sudut foto produk.</li>
                                    <li>Sertakan file video atau link demo untuk promosi produk yang lebih interaktif.</li>
                                </ul>
                            </Card>

                            <Card className="p-6 shadow-sm border-[var(--color-border)] rounded-2xl">
                                <h3 className="text-sm font-bold text-[var(--color-ink)] mb-2">Status & Validasi</h3>
                                <p className="text-xs text-[var(--color-muted)] mb-4">
                                    Produk yang disimpan akan berstatus <strong>Draft</strong> sebelum Anda mengajukannya secara resmi ke kurator RTPU.
                                </p>
                                <button
                                    type="submit"
                                    form="productForm"
                                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-90 flex items-center justify-center gap-2"
                                    style={{ background: 'var(--color-accent)' }}
                                >
                                    <Save className="w-4 h-4" />
                                    {isEdit ? 'Simpan Perubahan' : 'Simpan Sebagai Draft'}
                                </button>
                            </Card>
                        </div>
                    </div>
                </div>
            </FadeIn>
            {/* Lightbox Modal */}
            {modalImageIndex !== null && allGalleryUrls[modalImageIndex] && (
                <div 
                    id="lightbox-backdrop"
                    onClick={() => setModalImageIndex(null)}
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
                    >
                        <img 
                            id="lightbox-image"
                            src={allGalleryUrls[modalImageIndex]} 
                            alt={`Preview ${modalImageIndex + 1}`} 
                            className="max-h-[80vh] max-w-full rounded-xl shadow-2xl object-contain" 
                        />
                        
                        {/* Photo counter */}
                        <div id="lightbox-counter" className="mt-3 text-white text-xs font-semibold px-3 py-1 rounded-full bg-black/50">
                            Foto {modalImageIndex + 1} dari {allGalleryUrls.length}
                        </div>

                        {/* Navigation Buttons */}
                        {allGalleryUrls.length > 1 && (
                            <>
                                <button
                                    id="lightbox-prev"
                                    type="button"
                                    aria-label="Foto Sebelumnya"
                                    onClick={() => setModalImageIndex((modalImageIndex - 1 + allGalleryUrls.length) % allGalleryUrls.length)}
                                    className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--color-ink)] rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg transition"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    id="lightbox-next"
                                    type="button"
                                    aria-label="Foto Selanjutnya"
                                    onClick={() => setModalImageIndex((modalImageIndex + 1) % allGalleryUrls.length)}
                                    className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--color-ink)] rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg transition"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Close button */}
                        <button
                            id="lightbox-close"
                            type="button"
                            aria-label="Tutup Lightbox"
                            onClick={() => setModalImageIndex(null)}
                            className="absolute -top-4 -right-4 bg-white text-[var(--color-ink)] rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg hover:bg-[var(--color-surface)] transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
