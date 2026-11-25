import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import OpsiEditor from '@/Components/OpsiEditor';
import { resolveImageUrl } from '@/Components/Public/CatalogCard';
import Switch from '@/Components/ui/Switch';
import { FadeIn, Field, PageHeader, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';
import { renumberOpsi, serializeOpsi, toOpsiRow } from '@/lib/opsi';

// Form fields vary by tipe; category is derived server-side from tipe.
const FIELDS = {
    jasa: [
        { key: 'name', label: 'Nama jasa', type: 'text', ph: 'mis. Uji Kuat Tekan Beton' },
        { key: 'desc', label: 'Deskripsi', type: 'textarea', ph: 'Ruang lingkup layanan…' },
        { key: 'price', label: 'Tarif dasar (Rp)', type: 'number', ph: '350000' },
        { key: 'cost_price', label: 'Harga Modal (Rp)', type: 'number', ph: 'Harga modal/biaya produksi', readonly: 'isOwnerOnly' },
        { key: 'location', label: 'Lokasi', type: 'text', ph: 'Lab Struktur, Gedung A' },
        { key: 'photo', label: 'Foto', type: 'file', ph: '' },
    ],
    ruangan: [
        { key: 'name', label: 'Nama ruangan', type: 'text', ph: 'mis. Aula Gedung Serbaguna' },
        { key: 'capacity', label: 'Kapasitas (orang)', type: 'number', ph: '300' },
        { key: 'location', label: 'Gedung / lokasi', type: 'text', ph: 'Gedung Serbaguna Lt.1' },
        { key: 'price', label: 'Tarif (Rp)', type: 'number', ph: '2500000' },
        { key: 'cost_price', label: 'Harga Modal (Rp)', type: 'number', ph: 'Harga modal/biaya produksi', readonly: 'isOwnerOnly' },
        { key: 'satuan', label: 'Satuan Tarif', type: 'select', ph: 'Pilih satuan', options: [{v:'hari',l:'Per hari'},{v:'jam',l:'Per jam'}] },
        { key: 'facilities', label: 'Fasilitas', type: 'textarea', ph: 'Proyektor, sound system, AC…' },
        { key: 'photo', label: 'Foto', type: 'file', ph: '' },
    ],
    produk: [
        { key: 'name', label: 'Nama produk', type: 'text', ph: 'mis. Alat Uji Kualitas Air' },
        { key: 'category', label: 'Kategori', type: 'text', ph: 'Alat Uji' },
        { key: 'price', label: 'Harga (Rp)', type: 'number', ph: '2450000' },
        { key: 'cost_price', label: 'Harga Modal (Rp)', type: 'number', ph: 'Harga modal/biaya produksi', readonly: 'isOwnerOnly' },
        { key: 'stock', label: 'Stok', type: 'number', ph: '16' },
        { key: 'specs', label: 'Spesifikasi', type: 'textarea', ph: 'Spesifikasi teknis…' },
        { key: 'photo', label: 'Foto', type: 'file', ph: '' },
    ],
};

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function LayananForm({ auth, tipe = 'jasa', initial = null, suggestions = [], categories = [] }) {
    const existing = initial;
    const isEdit = Boolean(existing?.id);
    const initialOpsi = (existing?.opsi ?? []).map((row, i) => toOpsiRow({ ...row, tipe }, i));
    const [opsi, setOpsi] = useState(initialOpsi);
    const { data, setData, post, transform, processing, errors } = useForm({
        tipe,
        name: existing?.name ?? '',
        category_id: existing?.category_id ?? '', target_audience: existing?.target_audience ?? 'publik', description: existing?.description ?? '',
        availability_status: existing?.availability_status ?? 'tersedia', preorder_duration: existing?.preorder_duration ?? '',
        weight: existing?.weight ?? '', length: existing?.length ?? '', width: existing?.width ?? '', height: existing?.height ?? '',
        operational_days: (existing?.operational_days ?? [1, 2, 3, 4, 5]).map(Number), operational_start: existing?.operational_start ?? '08:00', operational_end: existing?.operational_end ?? '16:00',
        desc: existing?.desc ?? '',
        price: existing?.price ?? '',
        cost_price: existing?.cost_price ?? '',
        location: existing?.location ?? '',
        capacity: existing?.capacity ?? '',
        facilities: existing?.facilities ?? '',
        category: existing?.category ?? '',
        stock: existing?.stock ?? '',
        specs: existing?.specs ?? '',
        photo: null,
        images: [], existing_images: existing?.images ?? [],
        video_url: existing?.video_url ?? '', video_file: null, remove_video: false,
        satuan: existing?.satuan ?? 'hari',
        active: existing ? existing.status !== 'Nonaktif' : true,
        opsi: serializeOpsi(initialOpsi),
    });

    const isPengelola = auth?.user?.role === 'admin_pengelola';
    const isOwner = Boolean(existing?.owner_id && auth?.user?.id && existing.owner_id === auth.user.id);

    const onOpsiChange = (rows) => {
        setOpsi(rows);
        setData('opsi', serializeOpsi(rows));
    };

    const submit = (e) => {
        e.preventDefault();
        transform((values) => {
            const payload = { ...values, ...(isEdit ? { _method: 'PATCH' } : {}) };
            if (!payload.category_id) delete payload.category_id;
            if (tipe !== 'produk') { delete payload.stock; ['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height'].forEach((key) => delete payload[key]); }
            else ['operational_days', 'operational_start', 'operational_end'].forEach((key) => delete payload[key]);
            const ordered = renumberOpsi(opsi);
            payload.opsi = serializeOpsi(ordered).map((row, index) => ordered[index].foto_file ? { ...row, foto: ordered[index].foto_file } : row);
            payload.existing_images_present = 1;
            if (values.opsi.length === 0) payload.opsi_present = 1;
            return payload;
        });
        post(isEdit ? route('rtpu.layanan.update', existing.id) : route('rtpu.layanan.store'), { forceFormData: true });
    };

    return (
        <DashboardLayout title={isEdit ? 'Ubah Layanan' : 'Tambah Layanan'} breadcrumb={`Admin RTPU / Kelola Layanan / ${isEdit ? 'Ubah' : 'Tambah'}`} activeKey="layanan">
            <Head title={`${isEdit ? 'Ubah' : 'Tambah'} ${TYPE_LABEL[tipe]} · PNJ Prime`} />
            <FadeIn>
                <PageHeader
                    eyebrow={`Tipe: ${TYPE_LABEL[tipe]}`}
                    title={`${isEdit ? 'Ubah' : 'Tambah'} Layanan ${TYPE_LABEL[tipe]}`}
                    desc="Lengkapi data layanan. Status aktif menentukan tampil tidaknya layanan di katalog."
                />
                <form onSubmit={submit} className="max-w-3xl space-y-4">
                    {FIELDS[tipe].map((f) => {
                        const isCostPrice = f.key === 'cost_price';
                        const isReadonly = f.readonly === 'isOwnerOnly' ? !isOwner : false;
                        const isDisabled = (isPengelola && f.key === 'price') || isReadonly;
                        return (
                            <Field key={f.key} label={f.label} htmlFor={`layanan-${f.key}`} error={errors[f.key]}>
                                {f.type === 'textarea' ? (
                                    <textarea id={`layanan-${f.key}`} value={data[f.key]} onChange={(e) => setData(f.key, e.target.value)} rows={3} placeholder={f.ph} disabled={isDisabled} className={inputClass} {...inputStyleProps()} />
                                ) : f.type === 'select' ? (
                                    <select id={`layanan-${f.key}`} value={data[f.key]} onChange={(e) => setData(f.key, e.target.value)} disabled={isDisabled} className={inputClass} {...inputStyleProps()}>
                                        <option value="" disabled>{f.ph}</option>
                                        {f.options?.map((opt) => (
                                            <option key={opt.v} value={opt.v}>{opt.l}</option>
                                        ))}
                                    </select>
                                ) : f.type === 'file' ? (
                                    <input id={`layanan-${f.key}`} type="file" accept="image/*" onChange={(e) => setData(f.key, e.target.files?.[0] ?? null)} className={inputClass} {...inputStyleProps()} />
                                ) : (
                                    <input id={`layanan-${f.key}`} type={f.type} value={data[f.key]} onChange={(e) => setData(f.key, e.target.value)} placeholder={f.ph} disabled={isDisabled} className={inputClass} {...inputStyleProps()} />
                                )}
                                {isPengelola && f.key === 'price' && (
                                    <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                                        Harga ditetapkan oleh Admin RTPU. Hubungi admin untuk perubahan harga.
                                    </p>
                                )}
                                {isCostPrice && !isOwner && isEdit && (
                                    <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                                        Harga modal hanya dapat diubah oleh pemilik produk yang mengajukan.
                                    </p>
                                )}
                            </Field>
                        );
                    })}
                    <Field label="Kategori" htmlFor="category-id" error={errors.category_id}>
                        <select id="category-id" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} className={inputClass} {...inputStyleProps()}><option value="">Kategori utama (bawaan)</option>{categories.map((c) => <option key={c.id} value={c.id}>{[c.parent_name, c.name].filter(Boolean).join(' / ')}</option>)}</select>
                    </Field>
                    <Field label="Target pengguna" htmlFor="target-audience" error={errors.target_audience}><select id="target-audience" value={data.target_audience} onChange={(e) => setData('target_audience', e.target.value)} className={inputClass} {...inputStyleProps()}><option value="publik">Publik</option><option value="internal_pnj">Internal PNJ</option></select></Field>
                    <Field label="Deskripsi lengkap" htmlFor="description" error={errors.description}><textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={4} className={inputClass} {...inputStyleProps()} /></Field>
                    {tipe === 'produk' ? <>
                        <Field label="Ketersediaan" htmlFor="availability-status" error={errors.availability_status}><select id="availability-status" value={data.availability_status} onChange={(e) => setData('availability_status', e.target.value)} className={inputClass} {...inputStyleProps()}><option value="tersedia">Tersedia</option><option value="preorder">Pre-order</option></select></Field>
                        {data.availability_status === 'preorder' && <Field label="Estimasi pre-order" htmlFor="preorder-duration" error={errors.preorder_duration}><input id="preorder-duration" value={data.preorder_duration} onChange={(e) => setData('preorder_duration', e.target.value)} className={inputClass} {...inputStyleProps()} /></Field>}
                        {[['weight', 'Berat (gram)'], ['length', 'Panjang (cm)'], ['width', 'Lebar (cm)'], ['height', 'Tinggi (cm)']].map(([key, label]) => <Field key={key} label={label} htmlFor={key} error={errors[key]}><input id={key} type="number" min="1" value={data[key]} onChange={(e) => setData(key, e.target.value)} className={inputClass} {...inputStyleProps()} /></Field>)}
                    </> : <section className="space-y-3"><h2 className="font-display text-lg font-bold">Hari & jam operasional layanan</h2>
                        <div className="flex flex-wrap gap-3">{[[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [7, 'Minggu']].map(([day, label]) => <label key={day} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.operational_days.includes(day)} onChange={(e) => setData('operational_days', e.target.checked ? [...data.operational_days, day].sort((a, b) => a - b) : data.operational_days.filter((d) => d !== day))} />{label}</label>)}</div>
                        {errors.operational_days && <p className="text-sm text-red-600">{errors.operational_days}</p>}
                        {[['operational_start', 'Jam mulai'], ['operational_end', 'Jam selesai']].map(([key, label]) => <Field key={key} label={label} htmlFor={key} error={errors[key]}><input id={key} type="time" value={data[key]} onChange={(e) => setData(key, e.target.value)} className={inputClass} {...inputStyleProps()} /></Field>)}
                    </section>}
                    <Field label="Foto galeri" htmlFor="gallery" error={errors.images || errors['images.0'] || errors.existing_images}>
                        <input id="gallery" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setData('images', Array.from(e.target.files ?? []))} className={inputClass} {...inputStyleProps()} />
                        <p className="text-xs">Maksimal 2 MB per foto.</p>
                    </Field>
                    <Field label="Tautan video" htmlFor="video-url" error={errors.video_url}><input id="video-url" type="url" value={data.video_url} onChange={(e) => setData('video_url', e.target.value)} className={inputClass} {...inputStyleProps()} /></Field>
                    <Field label="File video" htmlFor="video-file" error={errors.video_file}><input id="video-file" type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv" onChange={(e) => setData('video_file', e.target.files?.[0] ?? null)} className={inputClass} {...inputStyleProps()} /><p className="text-xs">MP4, MOV, AVI, WMV; maksimal 50 MB.</p></Field>
                    {isEdit && (
                        <section className="space-y-3">
                            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Media tersimpan</h2>
                            {existing.photo && <img src={resolveImageUrl(existing.photo)} alt="Foto utama" className="h-28 w-28 rounded-lg object-cover" />}
                            <div className="flex flex-wrap gap-3">{data.existing_images.map((image, index) => <div key={`${image}-${index}`}><img src={resolveImageUrl(image)} alt="Foto galeri" className="h-28 w-28 rounded-lg object-cover" /><button type="button" onClick={() => setData('existing_images', data.existing_images.filter((_, i) => i !== index))}>Hapus foto galeri</button></div>)}</div>
                            {existing.video_path && !data.remove_video && <><video controls className="max-h-64 w-full" src={resolveImageUrl(existing.video_path)} /><button type="button" onClick={() => setData('remove_video', true)}>Hapus video tersimpan</button></>}
                            {existing.video_url && <a href={existing.video_url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: 'var(--color-accent)' }}>Buka video</a>}
                        </section>
                    )}
                    <Switch
                        checked={Boolean(data.active)}
                        onChange={(v) => setData('active', v)}
                        label="Status aktif (tampil di katalog)"
                    />

                    <div className="pt-2">
                        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Opsi & add-on</h2>
                        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            Item “Termasuk” gratis, add-on opsional dipilih pelanggan saat mengajukan.
                        </p>
                    </div>
                    <OpsiEditor value={opsi} onChange={onOpsiChange} tipe={tipe} suggestions={suggestions} />
                    {Object.entries(errors).filter(([key]) => key.startsWith('opsi.')).map(([key, message]) => <p key={key} role="alert" className="text-sm text-red-600">{key}: {message}</p>)}

                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}
                    </PrimaryButton>
                </form>
            </FadeIn>
        </DashboardLayout>
    );
}
