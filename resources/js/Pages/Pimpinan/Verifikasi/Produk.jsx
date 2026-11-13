import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import Modal from '@/Components/ui/Modal';

const CHECKLIST = [
    'Kelengkapan data dan spesifikasi produk telah diperiksa',
    'Kelaikan legalitas & orisinalitas riset terjamin',
    'Kesiapan komersialisasi dan dampak hilirisasi optimal',
    'Persetujuan publikasi resmi ke katalog umum PNJ Prime',
];

export default function PimpinanVerifikasiProduk({ auth, products }) {
    const rows = products?.data || (Array.isArray(products) ? products : []);
    const [selId, setSelId] = useState(null);
    const sel = rows.find((r) => r.id === selId) ?? null;

    const detail = sel?.product_detail;
    const meta = detail?.meta ?? {};
    const photos = [...new Set([detail?.thumbnail, ...(Array.isArray(detail?.images) ? detail.images : [])].filter(Boolean))];
    const display = (value, unit = '') => value === null || value === undefined || value === '' ? 'Belum diisi' : `${value}${unit}`;
    const rupiah = (value) => value === null || value === undefined ? 'Belum diisi' : `Rp ${Number(value).toLocaleString('id-ID')}`;


    const handleApprove = (catatan) => {
        if (!sel) return;
        router.patch(route('pimpinan.verify.produk.approve', sel.id), { catatan }, { onSuccess: () => setSelId(null) });
    };

    const handleReject = (catatan) => {
        if (!sel) return;
        router.patch(route('pimpinan.verify.produk.reject', sel.id), { catatan }, { onSuccess: () => setSelId(null) });
    };

    return (
        <DashboardLayout title="Persetujuan Final Produk" breadcrumb="Pimpinan RTPU / Verifikasi Produk" activeKey="verify">
            <Head title="Persetujuan Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Persetujuan Publikasi Katalog"
                    desc="Persetujuan oleh Pimpinan RTPU atau Admin RTPU langsung mengaktifkan produk di katalog sesuai sasaran publikasinya."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Tidak Ada Produk Menunggu Persetujuan"
                        desc="Seluruh produk terverifikasi telah ditindaklanjuti atau belum ada produk baru dari kurasi RTPU."
                    />
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Antrean Persetujuan ({rows.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {rows.map((p) => {
                                    const isSelected = sel?.id === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelId(p.id)}
                                            aria-haspopup="dialog"
                                            className="block w-full rounded-xl border p-4 text-left transition"
                                            style={
                                                isSelected
                                                    ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                                                    {p.nama ?? p.name}
                                                </span>
                                                <StatusBadge status={p.curation_status} />
                                            </div>
                                            <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-1">
                                                Kurator: {p.meta?.rtpu_verifier_name ?? 'Belum diisi'}
                                            </p>
                                            <span className="mt-4 inline-flex rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white">Lihat Detail &amp; Verifikasi</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Modal open={Boolean(sel)} onClose={() => setSelId(null)} title="Detail Persetujuan Final Katalog" size="2xl">
                        {sel && (
                            <div>
                                <h3 className="font-display text-xl font-bold text-[var(--color-ink)]">{sel.name}</h3>
                                <StatusBadge status={sel.curation_status} />
                                <section className="mt-5 space-y-3" aria-label="Foto pengajuan">
                                    {photos.length ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {photos.map((photo, index) => (
                                                <a key={photo} href={`/storage/${photo}`} target="_blank" rel="noopener noreferrer"
                                                    className={`${index === 0 ? 'col-span-3' : ''} overflow-hidden rounded-2xl border bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]`}
                                                    style={{ borderColor: 'var(--color-border)' }} aria-label={`Perbesar foto ${index + 1}`}>
                                                    <img src={`/storage/${photo}`} alt={`${sel.name} — foto ${index + 1}`} className={`w-full object-contain ${index === 0 ? 'h-64 sm:h-80' : 'h-24'}`} />
                                                </a>
                                            ))}
                                        </div>
                                    ) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted)]">Foto belum dilampirkan.</div>}
                                    {photos.length > 0 && <p className="text-xs text-[var(--color-muted)]">Klik foto untuk melihat ukuran penuh di tab baru.</p>}
                                </section>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        ['Harga dasar', rupiah(sel.base_price)],
                                        ['Berat per unit', display(meta.weight, ' gram')],
                                        ['Stok', display(detail?.stock)],
                                        ['Ketersediaan', meta.availability_status === 'tersedia' ? 'Tersedia' : meta.availability_status === 'preorder' ? 'Pre-order' : 'Belum diisi'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                                            <p className="text-xs text-[var(--color-muted)]">{label}</p>
                                            <p className="mt-1 break-words font-display text-base font-semibold text-[var(--color-accent)]">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="mt-6 font-display text-sm font-bold text-[var(--color-ink)]">Informasi pemohon & pengajuan</h3>
                                <dl className="mt-3 divide-y rounded-2xl border px-4" style={{ borderColor: 'var(--color-border)' }}>
                                    {[
                                        ['Pemohon', sel.owner],
                                        ['Nomor telepon', display(sel.phone)],
                                        ['NIP pengaju', display(sel.nip)],
                                        ['Jurusan pengaju', display(sel.jurusan)],
                                        ['Tipe', 'Produk katalog'],
                                        ['Sasaran', sel.target_audience === 'internal_pnj' ? 'Internal PNJ' : 'Publik'],
                                        ['Kurator RTPU', display(meta.rtpu_verifier_name)],
                                        ['Tanggal', sel.created_at],
                                        ['Kategori', display(sel.category)],
                                        ['Unit / institusi', display(sel.unit)],
                                        ['Panjang', display(meta.length, ' cm')],
                                        ['Lebar', display(meta.width, ' cm')],
                                        ['Tinggi', display(meta.height, ' cm')],
                                        ['Estimasi pre-order', display(meta.preorder_duration)],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                            <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                            <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <section className="mt-5 space-y-4 rounded-2xl bg-[var(--color-surface)] p-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Deskripsi singkat</h3>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-muted)]">{display(detail?.short_description)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Deskripsi lengkap</h3>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-muted)]">{display(detail?.description)}</p>
                                    </div>
                                </section>
                                <div className="mt-5 border-t pt-5">
                                <ReviewPanel
                                    title="Persetujuan Akhir Pimpinan"
                                    checklist={CHECKLIST}
                                    approveLabel="Setujui & Publikasikan ke Katalog"
                                    rejectLabel="Tolak / Minta Kaji Ulang"
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                                </div>
                            </div>
                        )}
                        </Modal>
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}
