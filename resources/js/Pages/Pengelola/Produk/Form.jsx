import { Head, router, useForm, usePage } from '@inertiajs/react';
import OpsiEditor from '@/Components/OpsiEditor';
import { serializeOpsi, toOpsiRow } from '@/lib/opsi';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, PrimaryButton } from '@/Components/ui';
import AlertBanner from '@/Components/AlertBanner';

export default function PengelolaProdukForm({ auth, categories = [], item = null }) {
    const isEdit = Boolean(item);
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
        cost_price: item?.cost_price || '',
        short_description: item?.short_description || '',
        description: item?.description || '',
        stock: item?.stock ?? 10,
        satuan: item?.meta?.satuan || 'hari',
        capacity: item?.meta?.capacity || '',
        location: item?.meta?.location || '',
        operational_days: item?.meta?.operational_days || [1, 2, 3, 4, 5],
        operational_start: item?.meta?.operational_start || '08:00',
        operational_end: item?.meta?.operational_end || '16:00',
        thumbnail: null,
        thumbnail_file: null,
        existing_thumbnail: item?.thumbnail || '',
        images: [],
        existing_images: item?.images || [],
        video_url: item?.video_url || '',
        video_file: null,
        existing_video_path: item?.video_path || '',
    });
    const [uploadErrors, setUploadErrors] = useState({});
    const [opsi, setOpsi] = useState(() =>
        Array.isArray(item?.opsi) && item.opsi.length > 0
            ? item.opsi.map((o, i) => toOpsiRow({ ...o, tipe: categories.find((c) => String(c.id) === String(item.category_id))?.parent_slug?.includes('sewa') ? 'ruangan' : 'produk', urutan: o.urutan ?? i }))
            : []
    );
    const [videoError, setVideoError] = useState('');
    const maxImageBytes = 2 * 1024 * 1024;
    const maxVideoBytes = 50 * 1024 * 1024; // 50 MB
    const maxVideoDuration = 120; // 2 menit (detik)
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-ms-wmv'];
    const validateImage = (file) => {
        if (!file.type.startsWith('image/')) return `File "${file.name}" harus berupa gambar.`;
        if (file.size > maxImageBytes) return `Foto "${file.name}" melebihi batas 2 MB per gambar. Ukuran file: ${(file.size / 1024 / 1024).toFixed(2)} MB. Silakan kompres atau pilih foto lain.`;
        return null;
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        setVideoError('');
        if (!file) { setData('video_file', null); return; }

        // Validasi format
        if (!allowedVideoTypes.includes(file.type)) {
            setVideoError('Format video tidak didukung. Gunakan MP4, MOV, AVI, atau WMV.');
            e.target.value = '';
            return;
        }

        // Validasi ukuran
        if (file.size > maxVideoBytes) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            setVideoError(`Ukuran video maksimal 50 MB. File Anda ${sizeMB} MB. Kompres video sebelum mengunggah.`);
            e.target.value = '';
            return;
        }

        // Validasi durasi via metadata
        const url = URL.createObjectURL(file);
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        videoEl.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            if (videoEl.duration > maxVideoDuration) {
                const mnt = Math.floor(videoEl.duration / 60);
                const dtk = Math.round(videoEl.duration % 60);
                setVideoError(`Durasi video maksimal 2 menit. Video Anda ${mnt}:${String(dtk).padStart(2,'0')} menit. Potong video sebelum mengunggah.`);
                e.target.value = '';
                return;
            }
            setData('video_file', file);
        };
        videoEl.onerror = () => {
            // Tidak bisa baca metadata (codec tidak dikenal) — izinkan saja, server yang validasi
            URL.revokeObjectURL(url);
            setData('video_file', file);
        };
        videoEl.src = url;
    };

    const selectedCategory = categories.find((c) => String(c.id) === String(data.category_id));
    const parentSlug = selectedCategory?.parent_slug ?? '';
    const tipe = parentSlug.includes('jasa') ? 'jasa' : (parentSlug.includes('sewa') || parentSlug.includes('fasilitas')) ? 'sewa' : 'produk';
    const TIPE_COPY = {
        produk: { typeLabel: 'Produk Fisik', nameLabel: 'Nama Produk / Inovasi', namePlaceholder: 'Contoh: Alat Sensor Kualitas Udara Pintar', priceLabel: 'Estimasi Harga', hint: 'Produk memiliki stok atau pre-order, berat, dan dimensi untuk perhitungan ongkir.' },
        jasa: { typeLabel: 'Jasa / Layanan', nameLabel: 'Nama Jasa / Layanan', namePlaceholder: 'Nama jasa atau layanan', priceLabel: 'Tarif Dasar', hint: 'Jasa tidak memiliki stok, berat, maupun ongkir.' },
        sewa: { typeLabel: 'Sewa Fasilitas', nameLabel: 'Nama Fasilitas / Alat', namePlaceholder: 'Contoh: Aula Gedung Serbaguna', priceLabel: 'Tarif Sewa', hint: 'Sewa memakai tarif per hari atau per jam dan jadwal, tanpa ongkir.' },
    };
    const copy = TIPE_COPY[tipe];

    const SUGGESTIONS = {
        produk: [
            { nama: 'Kotak kemasan', harga: 0, satuan: 'flat', jenis: 'termasuk' },
            { nama: 'Instalasi', harga: 100000, satuan: 'flat', jenis: 'addon' },
            { nama: 'Garansi tambahan', harga: 150000, satuan: 'per_unit', jenis: 'addon' },
        ],
        jasa: [
            { nama: 'Alat pelindung diri', harga: 0, satuan: 'flat', jenis: 'termasuk' },
            { nama: 'Pengambilan sampel', harga: 100000, satuan: 'flat', jenis: 'addon' },
            { nama: 'Laporan tambahan', harga: 50000, satuan: 'per_unit', jenis: 'addon' },
        ],
        sewa: [
            { nama: 'Proyektor', harga: 0, satuan: 'flat', jenis: 'termasuk' },
            { nama: 'Sound system', harga: 150000, satuan: 'flat', jenis: 'addon' },
            { nama: 'Extra bangku', harga: 5000, satuan: 'per_unit', jenis: 'addon' },
            { nama: 'Snack peserta', harga: 25000, satuan: 'per_orang', jenis: 'addon' },
            { nama: 'Petugas kebersihan', harga: 200000, satuan: 'per_hari', jenis: 'addon' },
        ],
    };

    const formErrors = { ...errors, ...usePage().props.errors, ...uploadErrors };

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
        // Blokir submit jika ada error validasi video client-side
        if (videoError) return;
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('category_id', data.category_id);
        formData.append('target_audience', data.target_audience || 'publik');
        formData.append('base_price', data.base_price);
        formData.append('cost_price', data.cost_price || '');
        formData.append('short_description', data.short_description || '');
        formData.append('description', data.description || '');
        if (tipe === 'produk') {
            formData.append('availability_status', data.availability_status);
            formData.append('preorder_duration', data.preorder_duration || '');
            formData.append('weight', data.weight || 1000);
            formData.append('length', data.length || 10);
            formData.append('width', data.width || 10);
            formData.append('height', data.height || 10);
            formData.append('stock', data.stock || 0);
        } else {
            formData.append('availability_status', 'tersedia');
            formData.append('stock', 0);
        }
        if (tipe === 'sewa') {
            formData.append('satuan', data.satuan);
            formData.append('capacity', data.capacity || '');
            formData.append('location', data.location || '');
        }
        if (tipe === 'sewa' || tipe === 'jasa') {
            data.operational_days.forEach((day) => formData.append('operational_days[]', day));
            formData.append('operational_start', data.operational_start);
            formData.append('operational_end', data.operational_end);
        }
        formData.append('video_url', data.video_url || '');
        const serializedOpsi = serializeOpsi(opsi);
        if (serializedOpsi.length === 0) {
            formData.append('opsi_present', '1');
        } else {
            serializedOpsi.forEach((row, index) => {
                Object.entries(row).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(`opsi[${index}][${key}]`, typeof value === 'boolean' ? (value ? '1' : '0') : value);
                    }
                });
            });
        }

        // Foto add-on (file upload terpisah)
        opsi.forEach((row, index) => {
            if (row.foto_file) {
                formData.append(`opsi[${index}][foto]`, row.foto_file);
            }
        });

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

        formData.append('existing_images_present', '1');
        data.existing_images.forEach((img) => {
            formData.append('existing_images[]', img);
        });

        const url = item?.id ? route('pengelola.produk.update', item.id) : route('pengelola.produk.store');
        if (item?.id) {
            formData.append('_method', 'PATCH');
        }
        router.post(url, formData, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout title={isEdit ? 'Ubah Produk Inovasi' : 'Tambah Produk Inovasi'} breadcrumb="Pengelola / Produk / Form" activeKey="produk">
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
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">{copy.nameLabel} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={copy.namePlaceholder}
                                    className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                    required
                                />
                                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">{tipe === 'produk' ? 'Kategori Produk' : tipe === 'jasa' ? 'Kategori Jasa / Layanan' : 'Kategori Fasilitas'} <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                        required
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {/* Kelompokkan sub-kategori berdasarkan parent */}
                                        {Object.entries(
                                            categories.reduce((acc, c) => {
                                                const key = c.parent_name ?? 'Lainnya';
                                                (acc[key] = acc[key] ?? []).push(c);
                                                return acc;
                                            }, {})
                                        ).map(([parentName, items]) => (
                                            <optgroup key={parentName} label={parentName}>
                                                {items.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {formErrors.category_id && <p className="text-xs text-red-500 mt-1">{formErrors.category_id}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Sasaran Akses <span className="text-red-500">*</span></label>
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
                            </div>

                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                                <p className="text-xs font-bold text-[var(--color-ink)]">Jenis: {copy.typeLabel}</p>
                                <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{copy.hint}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">{copy.priceLabel} <span className="text-red-500">*</span></label>
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
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Harga Modal <span className="text-[var(--color-muted)]">(internal)</span></label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-[var(--color-muted)]">Rp</span>
                                        <input
                                            type="number"
                                            value={data.cost_price}
                                            onChange={(e) => setData('cost_price', e.target.value)}
                                            placeholder="Harga modal/beli produk"
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 py-2.5 pl-8 pr-3 text-sm font-semibold text-[var(--color-ink)] bg-[var(--color-surface)] placeholder:text-[var(--color-muted)]/60"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-[var(--color-muted)]">Tidak ditampilkan ke pembeli; hanya untuk internal keuangan.</p>
                                    {formErrors.cost_price && <p className="text-xs text-red-500 mt-1">{formErrors.cost_price}</p>}
                                </div>
                                {tipe === 'produk' && (
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
                                )}
                                {tipe === 'sewa' && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Satuan Tarif <span className="text-red-500">*</span></label>
                                        <select
                                            value={data.satuan}
                                            onChange={(e) => setData('satuan', e.target.value)}
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm bg-white transition"
                                            required
                                        >
                                            <option value="hari">Per hari</option>
                                            <option value="jam">Per jam</option>
                                        </select>
                                        {formErrors.satuan && <p className="text-xs text-red-500 mt-1">{formErrors.satuan}</p>}
                                    </div>
                                )}
                            </div>

                            {tipe === 'produk' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            )}

                            {tipe === 'sewa' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Kapasitas (orang)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.capacity}
                                            onChange={(e) => setData('capacity', e.target.value)}
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                        />
                                        {formErrors.capacity && <p className="text-xs text-red-500 mt-1">{formErrors.capacity}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Lokasi</label>
                                        <input
                                            type="text"
                                            value={data.location}
                                            onChange={(e) => setData('location', e.target.value)}
                                            className="w-full rounded-xl border border-[var(--color-border)] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 p-3 text-sm transition"
                                        />
                                        {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
                                    </div>
                                </div>
                            )}


                            {(tipe === 'sewa' || tipe === 'jasa') && (
                                <section className="rounded-2xl border border-[var(--color-border)] p-4 space-y-4">
                                    <h3 className="text-sm font-semibold text-[var(--color-ink)]">Hari & jam operasional layanan</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {[[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [7, 'Minggu']].map(([day, label]) => (
                                            <label key={day} className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={data.operational_days.includes(day)} onChange={(e) => setData('operational_days', e.target.checked ? [...data.operational_days, day].sort() : data.operational_days.filter((d) => d !== day))} />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                    {formErrors.operational_days && <p className="text-xs text-red-500">{formErrors.operational_days}</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="block text-sm">Jam mulai<input required type="time" value={data.operational_start} onChange={(e) => setData('operational_start', e.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--color-border)] p-3" /></label>
                                        <label className="block text-sm">Jam selesai<input required type="time" value={data.operational_end} onChange={(e) => setData('operational_end', e.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--color-border)] p-3" /></label>
                                    </div>
                                    <p className="text-xs text-[var(--color-muted)]">Customer hanya dapat mengajukan jadwal pada hari dan jam ini, di luar tanggal merah akademik.</p>
                                </section>
                            )}

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

                            {tipe === 'produk' && (
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
                            )}

                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                Foto Utama / Thumbnail <span className="text-red-500">*</span>
                            </label>
                            <p className="text-[11px] text-[var(--color-muted)]">Digunakan sebagai gambar utama pada katalog e-commerce dan kartu produk. Maksimal 2 MB per gambar.</p>
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
                                            if (!file) return;
                                            const message = validateImage(file);
                                            setUploadErrors((previous) => ({ ...previous, thumbnail: message }));
                                            if (!message) setData('thumbnail_file', file);
                                            e.target.value = '';
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
                            <p className="text-[11px] text-[var(--color-muted)]">Pilih foto satu per satu atau sekaligus banyak. Maksimal 2 MB per gambar. Klik pada foto untuk memperbesar.</p>
                            
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
                                        const messages = newFiles.map(validateImage).filter(Boolean);
                                        setUploadErrors((previous) => ({ ...previous, images: messages.join(' ') || null }));
                                        const acceptedFiles = newFiles.filter((file) => !validateImage(file));
                                        setData('images', [...data.images, ...acceptedFiles]);
                                        e.target.value = '';
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
                            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Atau Upload File Video (MP4 / MOV / AVI / WMV, Maks 50 MB, maks 2 menit)</label>
                            <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/avi,video/x-ms-wmv"
                                onChange={handleVideoChange}
                                className="w-full rounded border border-[var(--color-border)] p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            />
                            {videoError && (
                                <div className="mt-2">
                                    <AlertBanner type="warning" message={videoError} />
                                </div>
                            )}
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

                        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                            <div>
                                <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Kelengkapan & Add-on</h3>
                                <p className="text-[13px] text-[var(--color-muted)]">
                                    Tentukan item yang sudah termasuk dalam harga (mis. proyektor) dan add-on opsional (mis. sound system, extra bangku) yang dapat dipilih customer saat mengajukan.
                                </p>
                            </div>
                            <OpsiEditor value={opsi} onChange={setOpsi} tipe={tipe} suggestions={SUGGESTIONS[tipe] ?? []} />
                        </section>

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
