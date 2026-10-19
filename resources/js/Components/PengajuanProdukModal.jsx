import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import Modal from '@/Components/ui/Modal';
import { Field, PrimaryButton, SecondaryButton, inputClass, inputStyleProps } from '@/Components/ui';

/**
 * Modal form for "Ajukan Produk Unggulan".
 * Replaces the standalone Create page so admin_p3m can submit directly
 * from the dashboard without a full-page navigation.
 */
export default function PengajuanProdukModal({ open, onClose }) {
    const { data, setData, processing, errors, reset } = useForm({
        name: '', desc: '', researcher: '', team: '', category: '', price: '',
    });
    const [docs, setDocs] = useState([]);

    const submit = (e) => {
        e.preventDefault();
        router.post(route('p3m.produk.store'), { ...data, dokumen: docs }, {
            onSuccess: () => {
                reset();
                setDocs([]);
                onClose?.();
            },
        });
    };

    const handleClose = () => {
        if (!processing) {
            reset();
            setDocs([]);
            onClose?.();
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            size="2xl"
            title="Ajukan Produk Unggulan"
            description="Lengkapi data produk beserta dokumen pendukung untuk diverifikasi Pimpinan RTPU."
            dismissible={!processing}
            footer={
                <>
                    <SecondaryButton onClick={handleClose} disabled={processing}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton onClick={submit} disabled={processing}>
                        {processing ? 'Mengirim…' : 'Kirim Pengajuan'}
                    </PrimaryButton>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" id="pengajuan-produk-form">
                <Field label="Nama produk" htmlFor="pu-modal-name" error={errors.name}>
                    <input id="pu-modal-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="mis. Kompor Biomassa Hemat Energi" className={inputClass} {...inputStyleProps()} />
                </Field>
                <Field label="Deskripsi" htmlFor="pu-modal-desc" error={errors.desc}>
                    <textarea id="pu-modal-desc" value={data.desc} onChange={(e) => setData('desc', e.target.value)} rows={3} placeholder="Keunggulan, cara kerja, dan target pengguna…" className={inputClass} {...inputStyleProps()} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Peneliti / tim" htmlFor="pu-modal-team" error={errors.team}>
                        <input id="pu-modal-team" value={data.team} onChange={(e) => setData('team', e.target.value)} placeholder="mis. Teknik Mesin" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Nama peneliti utama" htmlFor="pu-modal-researcher" error={errors.researcher}>
                        <input id="pu-modal-researcher" value={data.researcher} onChange={(e) => setData('researcher', e.target.value)} placeholder="Nama lengkap" className={inputClass} {...inputStyleProps()} />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Kategori" htmlFor="pu-modal-category" error={errors.category}>
                        <input id="pu-modal-category" value={data.category} onChange={(e) => setData('category', e.target.value)} placeholder="mis. Energi" className={inputClass} {...inputStyleProps()} />
                    </Field>
                    <Field label="Usulan harga (Rp)" htmlFor="pu-modal-price" error={errors.price}>
                        <input id="pu-modal-price" type="number" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="1850000" className={inputClass} {...inputStyleProps()} />
                    </Field>
                </div>
                <Field label="Dokumen pendukung" error={errors.dokumen}>
                    <FileDropzone multiple files={docs} onChange={setDocs} hint="Proposal, foto produk, hasil uji. PDF/JPG/PNG." />
                </Field>
            </form>
        </Modal>
    );
}
