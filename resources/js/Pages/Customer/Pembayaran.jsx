import { Head } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import FileDropzone from '@/Components/FileDropzone';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, Field, PageHeader, PrimaryButton } from '@/Components/ui';
import { mockMetode, mockPengajuan } from '@/mocks/data';

// TODO(backend): no payment routes yet. Method choice is local state;
// upload/submit show a neutral notice, nothing is sent.
export default function Pembayaran({ auth, item, metode }) {
    const role = auth?.user?.role;
    const p = item ?? mockPengajuan[1];
    const methods = metode ?? mockMetode.filter((m) => m.active);
    const [methodId, setMethodId] = useState(methods[0]?.id ?? null);
    const [files, setFiles] = useState([]);
    const [copied, setCopied] = useState(false);
    const [notice, setNotice] = useState(null);
    const method = methods.find((m) => m.id === methodId) ?? methods[0];

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <PublicLayout auth={auth}>
            <Head title={`Bayar ${p.code} · PNJ Prime`} />
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow={p.code}
                    title="Pembayaran"
                    desc={`Tagihan ${p.layanan} sebesar Rp ${Number(p.total ?? 0).toLocaleString('id-ID')}.`}
                />
                <CustomerTabs active="pengajuan" role={role} />

                <h2 className="mb-3 font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                    1. Pilih metode pembayaran
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    {methods.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setMethodId(m.id)}
                            aria-pressed={methodId === m.id}
                            className="rounded-2xl border p-4 text-left transition"
                            style={
                                methodId === m.id
                                    ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                            }
                        >
                            <span className="block text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{m.name}</span>
                            <span className="mt-0.5 block text-xs" style={{ color: 'var(--color-muted)' }}>{m.type}</span>
                        </button>
                    ))}
                </div>

                {method && (
                    <Card className="mt-5 p-6">
                        <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                            2. Instruksi: {method.name}
                        </h2>
                        <dl className="mt-3 divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {[
                                ['Nomor / VA', method.account],
                                ['Atas nama', method.holder],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                                    <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                    <dd className="flex items-center gap-2 font-mono font-semibold" style={{ color: 'var(--color-ink)' }}>
                                        {v}
                                        <button
                                            type="button"
                                            onClick={() => copy(String(v))}
                                            aria-label={`Salin ${k}`}
                                            className="rounded-lg p-1.5 transition"
                                            style={{ color: 'var(--color-muted)' }}
                                        >
                                            {copied ? <Check className="h-4 w-4" style={{ color: 'var(--color-accent-hover)' }} /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-2 text-[13px]" style={{ color: 'var(--color-muted)' }}>{method.instructions}</p>
                    </Card>
                )}

                <div className="mt-5">
                    <h2 className="mb-3 font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                        3. Unggah bukti pembayaran
                    </h2>
                    <Field label={null}>
                        <FileDropzone files={files} onChange={setFiles} hint="JPG, PNG, PDF. Maks. 5 MB." />
                    </Field>
                    {notice && (
                        <p className="mt-3 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                            {notice}
                        </p>
                    )}
                    <PrimaryButton
                        className="mt-4"
                        onClick={() => setNotice('Pengiriman bukti belum tersedia. Backend perlu menyediakan endpoint unggah bukti pembayaran.')}
                    >
                        Kirim Bukti Pembayaran
                    </PrimaryButton>
                </div>
            </div>
        </PublicLayout>
    );
}
