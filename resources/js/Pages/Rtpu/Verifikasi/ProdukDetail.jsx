import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, FileText, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const CHECKLIST = [
    'Kelengkapan deskripsi dan spesifikasi teknis inovasi',
    'Kesesuaian kategori dan unit pengusul',
    'Kelaikan komersialisasi dan dokumen pendukung HKI/riset',
    'Struktur penentuan harga estimasi atau opsi layanan',
];

function DetailRow({ label, value, className = '' }) {
    if (!value || value === '-') return null;
    return (
        <div className={`flex justify-between gap-4 py-2 border-b border-[var(--color-border)] ${className}`}>
            <dt className="text-sm text-[var(--color-muted)]">{label}</dt>
            <dd className="text-sm font-medium text-[var(--color-ink)] text-right">{value}</dd>
        </div>
    );
}

export default function ProdukDetail({ auth, product }) {
    const [processing, setProcessing] = useState(false);

    const handleVerify = (catatan) => {
        if (processing) return;
        setProcessing(true);
        router.patch(route('rtpu.verify.produk.verify', product.id), { catatan }, {
            onFinish: () => setProcessing(false),
        });
    };

    const handleReject = (catatan) => {
        if (processing) return;
        setProcessing(true);
        router.patch(route('rtpu.verify.produk.reject', product.id), { catatan }, {
            onFinish: () => setProcessing(false),
        });
    };

    const formatPrice = (price) => {
        return price ? `Rp ${Number(price).toLocaleString('id-ID')}` : '-';
    };

    return (
        <DashboardLayout title={`Verifikasi: ${product.name}`} breadcrumb="Admin RTPU / Verifikasi Produk" activeKey="verify-layanan">
            <Head title={`Verifikasi ${product.name} · PNJ Prime`} />
            <FadeIn>
                <div className="mb-6">
                    <Link
                        href={route('rtpu.verify.produk')}
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline mb-3"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali ke Antrean</span>
                    </Link>
                    <PageHeader
                        eyebrow="Admin RTPU · Detail Verifikasi"
                        title={product.name}
                        desc="Telaah kelengkapan dan kelaikan produk inovasi sebelum diteruskan ke Pimpinan RTPU."
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    {/* Left Column: Product Detail */}
                    <div className="space-y-6">
                        {/* Foto Produk */}
                        {product.photos && product.photos.length > 0 && (
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Foto Produk</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {product.photos.slice(0, 4).map((photo, idx) => (
                                        <img
                                            key={idx}
                                            src={photo}
                                            alt={`Foto ${idx + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-[var(--color-border)]"
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Informasi Umum */}
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Informasi Produk</span>
                            </h3>
                            <dl className="space-y-0">
                                <DetailRow label="Kategori" value={product.category} />
                                <DetailRow label="Status Kurasi" value={<StatusBadge status={product.curation_status} />} />
                                <DetailRow label="Target Audience" value={
                                    product.target_audience === 'internal_pnj' 
                                        ? '🔒 Khusus Sivitas PNJ' 
                                        : '🌐 Publik & Eksternal'
                                } />
                                <DetailRow label="Harga Dasar" value={formatPrice(product.base_price)} />
                                <DetailRow label="Harga Final" value={formatPrice(product.final_price)} />
                                <DetailRow label="Berat (gram)" value={product.meta?.weight || '-'} />
                                <DetailRow label="Stok" value={product.meta?.stock || '-'} />
                                <DetailRow label="Diajukan pada" value={product.created_at} />
                            </dl>
                        </Card>

                        {/* Deskripsi */}
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Deskripsi Produk</h3>
                            <p className="text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
                                {product.description || 'Tidak ada deskripsi.'}
                            </p>
                        </Card>

                        {/* Owner Detail */}
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Pemilik Produk</span>
                            </h3>
                            <dl className="space-y-3">
                                {product.owner_detail.name && (
                                    <div className="flex items-start gap-3">
                                        <User className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">Nama</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{product.owner_detail.name}</dd>
                                        </div>
                                    </div>
                                )}
                                {product.owner_detail.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">Email</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{product.owner_detail.email}</dd>
                                        </div>
                                    </div>
                                )}
                                {product.owner_detail.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">Telepon</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{product.owner_detail.phone}</dd>
                                        </div>
                                    </div>
                                )}
                                {product.owner_detail.nip && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">NIP</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{product.owner_detail.nip}</dd>
                                        </div>
                                    </div>
                                )}
                                {product.owner_detail.jurusan && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">Jurusan</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{product.owner_detail.jurusan}</dd>
                                        </div>
                                    </div>
                                )}
                                {(product.owner_detail.unit_name || product.owner_detail.institution) && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                        <div>
                                            <dt className="text-xs text-[var(--color-muted)]">Unit / Institusi</dt>
                                            <dd className="text-sm font-medium text-[var(--color-ink)]">
                                                {product.owner_detail.unit_name || product.owner_detail.institution}
                                            </dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </Card>

                        {/* Dokumen Pendukung */}
                        {product.documents && product.documents.length > 0 && (
                            <Card className="p-5">
                                <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Dokumen Pendukung</h3>
                                <ul className="space-y-2">
                                    {product.documents.map((doc, idx) => (
                                        <li key={idx}>
                                            <a
                                                href={doc.url || doc}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-2"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>{doc.name || `Dokumen ${idx + 1}`}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Review Panel */}
                    <div>
                        <Card className="p-6 sticky top-6">
                            <ReviewPanel
                                title="Formulir Kurasi RTPU"
                                checklist={CHECKLIST}
                                approveLabel="Verifikasi Produk (Loloskan ke Pimpinan)"
                                rejectLabel="Kembalikan untuk Revisi"
                                onApprove={handleVerify}
                                onReject={handleReject}
                                processing={processing}
                            />
                        </Card>
                    </div>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
