import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import Modal from '@/Components/ui/Modal';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };
const CHECKLIST = [
    'Identitas pemohon jelas (nama dan kontak)',
    'Jenis layanan dan kebutuhan terisi lengkap',
    'Jadwal / jumlah / peserta masuk akal',
    'Dokumen pendukung dilampirkan bila diperlukan',
];

export default function VerifikasiLayanan({ auth, antrean = [], selected = null }) {
    const rows = antrean;
    const [selId, setSelId] = useState(null);
    const sel = rows.find((r) => r.id === selId) ?? null;
    const [processing, setProcessing] = useState(false);
    const detail = sel?.product_detail;
    const meta = detail?.meta ?? {};
    const photos = [...new Set([detail?.thumbnail, ...(Array.isArray(detail?.images) ? detail.images : [])].filter(Boolean))];
    const display = (value, unit = '') => value === null || value === undefined || value === '' ? 'Belum diisi' : `${value}${unit}`;
    const rupiah = (value) => value === null || value === undefined ? 'Belum diisi' : `Rp ${Number(value).toLocaleString('id-ID')}`;

    return (
        <DashboardLayout title="Verifikasi Pengajuan" breadcrumb="Admin RTPU / Verifikasi Pengajuan" activeKey="verify-layanan">
            <Head title="Verifikasi Pengajuan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Pengajuan Layanan"
                    desc="Periksa kelengkapan data, verifikasi isi pengajuan, lalu verifikasi atau tolak dengan catatan."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Antrean Pengajuan Kosong"
                        desc="Tidak ada pengajuan layanan baru yang menunggu verifikasi saat ini. Seluruh permohonan telah ditindaklanjuti."
                    />
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Antrean Pengajuan ({rows.length})
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {rows.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelId(p.id)}
                                        aria-haspopup="dialog"
                                        className="block w-full rounded-2xl border p-5 text-left shadow-[var(--shadow-card)] transition duration-150 hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                                        style={
                                            sel?.id === p.id
                                                ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                        }
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{p.code}</span>
                                            <StatusBadge status={p.status} label={p.status} />
                                        </span>
                                        <span className="mt-1 block truncate text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                                            {p.layanan}
                                        </span>
                                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {TYPE_LABEL[p.type]} · {p.customer} · {p.date}
                                        </span>
                                        <span className="mt-4 inline-flex rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white">Lihat Detail &amp; Verifikasi</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Modal open={Boolean(sel)} onClose={() => setSelId(null)} title="Detail Pengajuan & Verifikasi" size="2xl">
                            {sel && (
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{sel.code}</span>
                                    <StatusBadge status={sel.status} label={sel.status} />
                                </div>
                                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{sel.layanan}</h2>
                                <section className="mt-5 space-y-3" aria-label="Foto pengajuan">
                                    {photos.length ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {photos.map((photo, index) => (
                                                <a key={photo} href={`/storage/${photo}`} target="_blank" rel="noopener noreferrer"
                                                    className={`${index === 0 ? 'col-span-3' : ''} overflow-hidden rounded-2xl border bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]`}
                                                    style={{ borderColor: 'var(--color-border)' }} aria-label={`Perbesar foto ${index + 1}`}>
                                                    <img src={`/storage/${photo}`} alt={`${sel.layanan} — foto ${index + 1}`} className={`w-full object-contain ${index === 0 ? 'h-64 sm:h-80' : 'h-24'}`} />
                                                </a>
                                            ))}
                                        </div>
                                    ) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-muted)]">Foto belum dilampirkan.</div>}
                                    {photos.length > 0 && <p className="text-xs text-[var(--color-muted)]">Klik foto untuk melihat ukuran penuh di tab baru.</p>}
                                </section>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        [sel.is_product ? 'Harga dasar' : 'Total pengajuan', rupiah(sel.is_product ? detail?.base_price : sel.total)],
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
                                        ['Pemohon', sel.customer],
                                        ['Nomor telepon', display(sel.phone)],
                                        ['NIP pengaju', display(sel.nip)],
                                        ['Jurusan pengaju', display(sel.jurusan)],
                                        ['Tipe', TYPE_LABEL[sel.type]],
                                        ['Jumlah', sel.qty ?? '-'],
                                        ['Keperluan', sel.need ?? '-'],
                                        ['Tanggal', sel.date],
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
                                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <ReviewPanel
                                        title="Panel peninjau"
                                        checklist={CHECKLIST}
                                        approveLabel="Verifikasi"
                                        onApprove={() => {
                                            setProcessing(true);
                                            router.patch(route('rtpu.verify.layanan.approve', sel.id), {}, {
                                                onSuccess: () => setSelId(null),
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
                                        onReject={(catatan) => {
                                            setProcessing(true);
                                            router.patch(route('rtpu.verify.layanan.reject', sel.id), { catatan }, {
                                                onSuccess: () => setSelId(null),
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
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
