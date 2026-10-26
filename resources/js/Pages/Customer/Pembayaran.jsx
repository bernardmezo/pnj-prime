import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Copy } from 'lucide-react';
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

            <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
                {/* Back button */}
                <a
                    href={navHref('customer.pengajuan.show', { id: p.id }, role)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-800"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali
                </a>

                {/* Header */}
                <div className="mt-4">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                        Pembayaran
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {p.code} · {p.layanan}
                    </p>
                </div>

                <div className="mt-6 space-y-6">
                    {/* Amount card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <span className="text-xs text-slate-500">Total yang harus dibayar</span>
                        <div className="mt-1 font-mono text-3xl font-bold text-slate-900">
                            {fmt(total)}
                        </div>
                        {(subtotal !== total || ppn > 0) && (
                            <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>Subtotal: <strong className="text-slate-700">{fmt(subtotal)}</strong></span>
                                {ppn > 0 && <span>PPN (12%): <strong className="text-slate-700">{fmt(ppn)}</strong></span>}
                            </div>
                        )}
                    </div>

                    {/* Bank Transfer Info */}
                    {method && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Cara membayar
                            </h2>

                            <div className="mt-3 flex items-center justify-between">
                                <div>
                                    <span className="block text-sm font-bold text-slate-900">{method.name}</span>
                                    <span className="block text-xs text-slate-500">{method.holder}</span>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                    Rekening Resmi
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="font-mono text-base font-bold text-slate-900 sm:text-lg">
                                    {method.account}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copy(String(method.account))}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            <span className="text-emerald-700">Tersalin</span>
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
                    )}

                    {/* Proof Upload */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Unggah Bukti Transfer
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Lampirkan struk atau tangkapan layar bukti pembayaran Anda.
                        </p>

                        <div className="mt-4">
                            <Field label={null} error={errors.bukti}>
                                <FileDropzone
                                    files={files}
                                    onChange={(next) => {
                                        setFiles(next);
                                        setData('bukti', next[0] ?? null);
                                    }}
                                    hint="JPG, PNG, atau PDF (maks. 5 MB)"
                                />
                            </Field>
                        </div>

                        {errors.metode_id && (
                            <p className="mt-2 text-xs text-rose-600">{errors.metode_id}</p>
                        )}

                        <button
                            type="button"
                            disabled={processing || files.length === 0}
                            onClick={submitPayment}
                            className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {processing ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                        </button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
