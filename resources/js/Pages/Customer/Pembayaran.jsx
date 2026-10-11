import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck, Check, Copy, Landmark, ShieldCheck, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import { Field, PrimaryButton } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

export default function Pembayaran({ auth, item, tagihan = {}, metode = [] }) {
    const role = auth?.user?.role;
    const p = item;
    const methods = metode;
    const [methodId, setMethodId] = useState(methods[0]?.id ?? null);
    const [files, setFiles] = useState([]);
    const { setData, post, processing, errors } = useForm({ metode_id: methods[0]?.id ?? '', bukti: null });
    const [copied, setCopied] = useState(null);
    const method = methods.find((m) => m.id === methodId) ?? methods[0];
    const subtotal = Number(tagihan.subtotal ?? p?.total ?? 0);
    const ppn = Number(tagihan.ppn ?? 0);
    const total = Number(tagihan.total ?? (subtotal + ppn));
    const fmt = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    if (!p) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Pembayaran · PNJ Prime" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                    <p style={{ color: 'var(--color-muted)' }}>Data tagihan tidak ditemukan.</p>
                </div>
            </PublicLayout>
        );
    }

    const pickMethod = (id) => {
        setMethodId(id);
        setData('metode_id', id);
    };

    const copy = async (key, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            setCopied(null);
        }
    };

    return (
        <PublicLayout auth={auth}>
            <Head title={`Bayar ${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
                <a
                    href={navHref('customer.pengajuan.show', { id: p.id }, role)}
                    className="group inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--color-accent-hover)' }}
                >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Kembali ke detail pengajuan
                </a>

                <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
                    {/* Left: bill + upload */}
                    <div>
                        <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="flex flex-wrap items-center justify-between gap-2 p-6 pb-4">
                                <div>
                                    <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{p.code}</p>
                                    <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                                        {p.layanan}
                                    </h1>
                                </div>
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                                    style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi RTPU
                                </span>
                            </div>
                            <dl className="mx-6 border-t py-2" style={{ borderColor: 'var(--color-border)' }}>
                                {[
                                    ['Tanggal pengajuan', p.date ?? '-'],
                                    ['Jumlah', p.qty ?? '-'],
                                    ...(p.need ? [['Keperluan', p.need]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} className="flex items-start justify-between gap-4 py-2 text-sm">
                                        <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                        <dd className="max-w-[60%] text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <dl className="mx-6 border-t py-2" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-start justify-between gap-4 py-2 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>Subtotal</dt>
                                    <dd className="font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>{fmt(subtotal)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 py-2 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>PPN</dt>
                                    <dd className="font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>
                                        {ppn > 0 ? fmt(ppn) : 'Tidak dikenakan'}
                                    </dd>
                                </div>
                            </dl>
                            <div className="flex items-center justify-between gap-4 px-6 py-5" style={{ background: 'var(--color-deep)' }}>
                                <span className="text-sm font-medium text-white/70">Total tagihan</span>
                                <span className="font-mono text-2xl font-bold text-white">
                                    {fmt(total)}
                                </span>
                            </div>
                        </div>

                        <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                            <UploadCloud className="h-5 w-5" style={{ color: 'var(--color-accent-hover)' }} />
                            Bukti pembayaran
                        </h2>
                        <Field label={null} error={errors.bukti}>
                            <FileDropzone
                                files={files}
                                onChange={(next) => {
                                    setFiles(next);
                                    setData('bukti', next[0] ?? null);
                                }}
                                hint="JPG, PNG, PDF. Maks. 5 MB. Unggah setelah Anda transfer."
                            />
                        </Field>
                        {errors.metode_id && (
                            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-danger)' }}>{errors.metode_id}</p>
                        )}
                    </div>

                    {/* Right: sticky payment panel */}
                    <aside className="lg:sticky lg:top-24">
                        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
                            <h2 className="flex items-center gap-2 font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                                <Landmark className="h-5 w-5" style={{ color: 'var(--color-accent-hover)' }} />
                                Cara membayar
                            </h2>
                            <div role="radiogroup" aria-label="Metode pembayaran" className="mt-4 space-y-2">
                                {methods.map((m) => {
                                    const on = m.id === methodId;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={on}
                                            onClick={() => pickMethod(m.id)}
                                            className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition"
                                            style={
                                                on
                                                    ? { borderColor: 'var(--color-accent)', borderWidth: 2, background: 'var(--color-accent-tint)' }
                                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                            }
                                        >
                                            <span
                                                aria-hidden
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                                                style={{ borderColor: on ? 'var(--color-accent)' : 'var(--color-border)' }}
                                            >
                                                {on && <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-accent)' }} />}
                                            </span>
                                            <span>
                                                <span className="block text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{m.name}</span>
                                                <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>{m.type}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {method && (
                                <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--color-surface)' }}>
                                    {[
                                        ['Rekening', method.account, 'rek'],
                                        ['Atas nama', method.holder, null],
                                    ].map(([k, v, ck]) => (
                                        <div key={k} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                                            <span style={{ color: 'var(--color-muted)' }}>{k}</span>
                                            <span className="flex items-center gap-1.5 font-mono font-bold" style={{ color: 'var(--color-ink)' }}>
                                                {v}
                                                {ck && (
                                                    <button
                                                        type="button"
                                                        onClick={() => copy(ck, String(v))}
                                                        aria-label={`Salin ${k}`}
                                                        className="rounded-md p-1 transition hover:bg-white"
                                                        style={{ color: 'var(--color-muted)' }}
                                                    >
                                                        {copied === ck
                                                            ? <Check className="h-4 w-4" style={{ color: 'var(--color-accent-hover)' }} />
                                                            : <Copy className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                    {method.instructions && (
                                        <p className="mt-2 border-t pt-2 text-[13px] leading-relaxed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                                            {method.instructions}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center justify-between text-sm">
                                    <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
                                    <span className="font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>{fmt(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span style={{ color: 'var(--color-muted)' }}>PPN</span>
                                    <span className="font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>{ppn > 0 ? fmt(ppn) : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Total</span>
                                    <span className="font-mono text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                                        {fmt(total)}
                                    </span>
                                </div>
                            </div>
                            <PrimaryButton
                                className="mt-4 w-full"
                                disabled={processing || files.length === 0}
                                onClick={() => post(route('customer.pengajuan.proof', p.id))}
                            >
                                {processing ? 'Mengirim…' : 'Kirim Bukti Pembayaran'}
                            </PrimaryButton>
                            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-accent-hover)' }} />
                                Bukti diverifikasi Admin RTPU, biasanya dalam 1×24 jam kerja.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
