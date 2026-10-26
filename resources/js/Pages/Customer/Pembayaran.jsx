import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Copy, CreditCard, Landmark, ShieldCheck, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function Pembayaran({ auth, item, tagihan = {}, metode = [] }) {
    const role = auth?.user?.role;
    const p = item;
    const methods = metode;
    const [methodId, setMethodId] = useState(methods[0]?.id ?? null);
    const [files, setFiles] = useState([]);
    const { setData, post, processing, errors } = useForm({
        metode_id: methods[0]?.id ?? '',
        bukti: null,
    });
    const [copied, setCopied] = useState(false);

    const method = methods.find((m) => m.id === methodId) ?? methods[0];
    const subtotal = Number(tagihan.subtotal ?? p?.total ?? 0);
    const ppn = Number(tagihan.ppn ?? 0);
    const total = Number(tagihan.total ?? subtotal + ppn);
    const fmt = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    if (!p) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Pembayaran · PNJ Prime" />
                <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
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

    const submitPayment = (e) => {
        e?.preventDefault();
        post(route('customer.pengajuan.proof', p.id));
    };

    return (
        <PublicLayout auth={auth}>
            <Head title={`Pembayaran ${p.code} · PNJ Prime`} />

            <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
                {/* Back button & official seal */}
                <div className="flex items-center justify-between">
                    <a
                        href={navHref('customer.pengajuan.show', { id: p.id }, role)}
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[var(--color-deep)]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span>Kembali ke Detail</span>
                    </a>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-xs font-medium text-teal-800 shadow-2xs">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                        <span>Pembayaran Resmi</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mt-4">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                        {p.code}
                    </span>
                    <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Pembayaran Layanan
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Silakan transfer sesuai nominal tertera ke rekening resmi PNJ di bawah ini.
                    </p>
                </div>

                <div className="mt-6 space-y-5">
                    {/* Bill Receipt Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    Total Tagihan
                                </span>
                                <div className="mt-0.5 font-mono text-3xl font-extrabold text-slate-900">
                                    {fmt(total)}
                                </div>
                            </div>
                            <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-700">
                                Menunggu Transfer
                            </span>
                        </div>

                        <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                            <div className="flex justify-between">
                                <span>Layanan:</span>
                                <strong className="font-semibold text-slate-800">{p.layanan}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <strong className="font-mono text-slate-700">{fmt(subtotal)}</strong>
                            </div>
                            {ppn > 0 && (
                                <div className="flex justify-between">
                                    <span>PPN (12%):</span>
                                    <strong className="font-mono text-slate-700">{fmt(ppn)}</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank Transfer Card - Styled like a sleek executive card slip */}
                    {method && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00242c] via-[var(--color-deep)] to-[#07575b] p-6 text-white shadow-md border border-teal-850/60">
                            <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-white/10">
                                <h2 className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-teal-300">
                                    <Landmark className="h-4 w-4" />
                                    Cara membayar
                                </h2>
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-[11px] text-teal-200">
                                    {method.name}
                                </span>
                            </div>

                            <div className="mt-4">
                                <span className="text-[11px] font-medium text-slate-300">Nomor Rekening Tujuan (Mandiri Virtual/Rekening):</span>
                                <div className="mt-1.5 flex items-center justify-between rounded-xl bg-black/25 px-4 py-3 backdrop-blur-xs border border-white/10">
                                    <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-white">
                                        {method.account}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copy(String(method.account))}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-[var(--color-accent-hover)] active:scale-95"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                <span>Tersalin!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Salin</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3.5 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-400">Atas Nama: </span>
                                    <strong className="font-semibold text-white">{method.holder}</strong>
                                </div>
                                <span className="text-[11px] text-teal-300 font-medium">Rekening Resmi PNJ</span>
                            </div>
                        </div>
                    )}

                    {/* Upload Proof Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                        <div className="mb-2 flex items-center gap-2">
                            <UploadCloud className="h-4 w-4 text-[var(--color-accent)]" />
                            <h2 className="text-sm font-bold text-slate-900">
                                Unggah Bukti Transfer
                            </h2>
                        </div>
                        <p className="mb-4 text-xs text-slate-500">
                            Lampirkan foto struk ATM, bukti transfer teller, atau tangkapan layar m-Banking Anda.
                        </p>

                        <Field label={null} error={errors.bukti}>
                            <FileDropzone
                                files={files}
                                onChange={(next) => {
                                    setFiles(next);
                                    setData('bukti', next[0] ?? null);
                                }}
                                hint="Format JPG, PNG, atau PDF (maks. 5 MB)"
                            />
                        </Field>

                        {errors.metode_id && (
                            <p className="mt-2 text-xs text-rose-600">{errors.metode_id}</p>
                        )}

                        <button
                            type="button"
                            disabled={processing || files.length === 0}
                            onClick={submitPayment}
                            className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-ink)] py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:from-[var(--color-accent-hover)] hover:to-[var(--color-deep)] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {processing ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran'}
                        </button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
