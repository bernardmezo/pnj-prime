import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

export default function Pembayaran({ auth, item, tagihan = {}, metode = [] }) {
    const role = auth?.user?.role;
    const p = item;
    const methods = metode;
    const [methodId, setMethodId] = useState(methods[0]?.id ?? null);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const { setData, post, processing, errors } = useForm({
        metode_id: methods[0]?.id ?? '',
        bukti: null,
    });
    const [copied, setCopied] = useState(false);

    const method = methods.find((m) => m.id === methodId) ?? methods[0];
    const subtotal = Number(tagihan.subtotal ?? p?.total ?? 0);
    const ppn = Number(tagihan.ppn ?? 0);
    const total = Number(tagihan.total ?? subtotal + ppn);
    const items = tagihan.items ?? [];
    const fmt = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    if (!p) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Pembayaran · PNJ Prime" />
                <div className="mx-auto w-full max-w-[560px] px-4 py-16 text-center">
                    <p className="text-sm text-slate-500">Data tagihan tidak ditemukan.</p>
                </div>
            </PublicLayout>
        );
    }

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setData('bukti', selectedFile);
    };

    const handleFileRemove = () => {
        setFile(null);
        setData('bukti', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submitPayment = (e) => {
        e?.preventDefault();
        post(route('customer.pengajuan.proof', p.id));
    };

    const hasAccount = Boolean(method?.account && String(method.account).trim() !== '-' && String(method.account).trim() !== '');

    return (
        <PublicLayout auth={auth}>
            <Head title={`Pembayaran ${p.code} · PNJ Prime`} />

            <div className="mx-auto w-full max-w-[560px] px-4 py-8 sm:px-6">
                {/* 1. Header */}
                <div>
                    <a
                        href={navHref('customer.pengajuan.show', { id: p.id }, role)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Detail</span>
                    </a>
                </div>

                <div className="mt-4">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Pembayaran Layanan
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {p.code} · {p.layanan}
                    </p>
                </div>

                {/* 2. Amount (the hero of the page) */}
                <div className="mt-8 border-b border-slate-200 pb-6">
                    <span className="block text-xs text-slate-500">
                        Total tagihan
                    </span>
                    <div className="mt-1 font-sans text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {fmt(total)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                        <span>Menunggu transfer</span>
                    </div>

                    {/* If multiple line items (add-ons), show a small definition list */}
                    {items.length > 1 && (
                        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                            {items.map((it, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{it.nama}</span>
                                    <span className="tabular-nums text-slate-800">{fmt(it.total)}</span>
                                </div>
                            ))}
                            {ppn > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>PPN (12%)</span>
                                    <span className="tabular-nums">{fmt(ppn)}</span>
                                </div>
                            )}
                        </dl>
                    )}
                </div>

                {/* 3. Transfer to */}
                <div className="mt-6 border-b border-slate-200 pb-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Transfer ke</h2>
                        <span className="sr-only">Cara membayar</span>
                    </div>

                    {hasAccount ? (
                        <div className="space-y-3">
                            <div className="space-y-0.5 text-sm text-slate-700">
                                <p className="font-medium text-slate-900">{method?.name || 'Bank Mandiri'}</p>
                                <p className="text-xs text-slate-500">a.n. {method?.holder || 'Politeknik Negeri Jakarta'}</p>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-1">
                                <span className="font-sans text-2xl font-bold text-slate-900 tabular-nums tracking-wider">
                                    {method.account}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copy(String(method.account))}
                                    className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition"
                                >
                                    {copied ? 'Tersalin' : 'Salin'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Nomor rekening belum tersedia. Hubungi admin untuk mendapatkan nomor tujuan.
                        </p>
                    )}
                </div>

                {/* 4. Upload proof */}
                <div className="mt-6 space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Unggah bukti transfer</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Foto struk ATM, bukti transfer, atau tangkapan layar m-Banking. JPG, PNG, atau PDF, maks. 5 MB.
                        </p>
                    </div>

                    <Field label={null} error={errors.bukti}>
                        {file ? (
                            <div className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-white px-4 py-3 text-sm">
                                <div className="min-w-0 pr-3">
                                    <p className="truncate font-medium text-slate-900">{file.name}</p>
                                    <p className="text-xs text-slate-400 tabular-nums">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFileRemove}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline shrink-0"
                                >
                                    Hapus
                                </button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    disabled={!hasAccount}
                                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                    className="hidden"
                                    id="bukti-upload"
                                />
                                <label
                                    htmlFor={hasAccount ? 'bukti-upload' : undefined}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!hasAccount) return;
                                        handleFileSelect(e.dataTransfer?.files?.[0]);
                                    }}
                                    className={`flex h-24 w-full items-center justify-center rounded-[6px] border border-dashed text-xs transition ${
                                        hasAccount
                                            ? 'cursor-pointer border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                                            : 'cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50'
                                    }`}
                                >
                                    <span>Seret berkas atau klik untuk memilih</span>
                                </label>
                            </div>
                        )}
                    </Field>

                    {errors.metode_id && (
                        <p className="text-xs text-red-600">{errors.metode_id}</p>
                    )}

                    {/* Primary Button: rectangular 6px radius, sticky bottom on mobile */}
                    <div className="pt-2 sticky bottom-4 sm:static bg-white/90 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none py-2 sm:py-0">
                        <button
                            type="button"
                            disabled={processing || !file || !hasAccount}
                            onClick={submitPayment}
                            className="w-full rounded-[6px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {processing ? 'Mengirim…' : 'Kirim bukti pembayaran'}
                        </button>
                        {/* 5. Next step note */}
                        <p className="mt-2 text-center text-xs text-slate-400">
                            Admin akan memverifikasi pembayaran Anda.
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
