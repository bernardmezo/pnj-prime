import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { href as navHref } from '@/lib/nav';

export default function Pembayaran({
    auth,
    item,
    tagihan = {},
    clientKey = '',
    isProduction = false,
    snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js',
    latestPayment = null,
}) {
    const role = auth?.user?.role;
    const p = item;

    const subtotal = Number(tagihan.subtotal ?? p?.total ?? 0);
    const ppn = Number(tagihan.ppn ?? 0);
    const total = Number(tagihan.total ?? subtotal + ppn);
    const items = tagihan.items ?? [];
    const fmt = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentStatus, setCurrentStatus] = useState(p?.status ?? '');
    const [paymentRecord, setPaymentRecord] = useState(latestPayment);
    const pollIntervalRef = useRef(null);
    const pollTimeoutRef = useRef(null);

    const isPaid = currentStatus === 'Diproses' || currentStatus === 'Selesai' || paymentRecord?.status === 'paid';
    const isExpired = paymentRecord?.status === 'expired';

    // Load Snap.js dynamically
    const loadSnapScript = () => {
        return new Promise((resolve, reject) => {
            if (window.snap) {
                return resolve(window.snap);
            }
            const existingScript = document.getElementById('midtrans-snap-script');
            if (existingScript) {
                if (window.snap) return resolve(window.snap);
                existingScript.addEventListener('load', () => resolve(window.snap));
                existingScript.addEventListener('error', (e) => reject(e));
                return;
            }
            const script = document.createElement('script');
            script.id = 'midtrans-snap-script';
            script.src = snapScriptUrl;
            script.setAttribute('data-client-key', clientKey);
            script.async = true;
            script.onload = () => resolve(window.snap);
            script.onerror = (e) => reject(new Error('Gagal memuat sistem pembayaran Midtrans.'));
            document.body.appendChild(script);
        });
    };

    // Preload snap.js on mount
    useEffect(() => {
        if (!isPaid && clientKey) {
            loadSnapScript().catch((err) => console.warn('Preload snap.js:', err));
        }
    }, [clientKey, isPaid]);

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
        setPolling(false);
    };

    const startPolling = () => {
        setPolling(true);
        setErrorMessage('');

        const checkStatus = async () => {
            try {
                const res = await fetch(route('customer.pengajuan.pembayaran.status', p.id), {
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'Diproses' || data.payment_status === 'paid') {
                        setCurrentStatus('Diproses');
                        setPaymentRecord((prev) => ({
                            ...prev,
                            status: 'paid',
                            payment_type: data.payment_type,
                            paid_at: data.paid_at,
                        }));
                        stopPolling();
                        // Redirect to pengajuan show page
                        window.location.href = navHref('customer.pengajuan.show', { id: p.id }, role);
                        return;
                    }
                    if (data.payment_status === 'expired') {
                        setPaymentRecord((prev) => ({ ...prev, status: 'expired' }));
                        stopPolling();
                        return;
                    }
                }
            } catch (err) {
                console.error('Polling error', err);
            }
        };

        // Poll immediately and then every 3 seconds
        checkStatus();
        pollIntervalRef.current = setInterval(checkStatus, 3000);

        // Max poll 60 seconds (1 minute)
        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
        }, 60000);
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const handlePayClick = async () => {
        if (loading || polling || isPaid) return;
        setLoading(true);
        setErrorMessage('');

        try {
            await loadSnapScript();

            // Call server create payment endpoint
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(route('customer.pengajuan.pembayaran.create', p.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Gagal memulai transaksi pembayaran.');
            }

            const data = await res.json();
            const token = data.token;

            if (!token) {
                throw new Error('Token pembayaran tidak valid.');
            }

            if (!window.snap || !window.snap.pay) {
                throw new Error('Midtrans Snap belum siap. Silakan muat ulang halaman.');
            }

            window.snap.pay(token, {
                onSuccess: function (result) {
                    startPolling();
                },
                onPending: function (result) {
                    startPolling();
                },
                onError: function (result) {
                    setLoading(false);
                    setErrorMessage('Pembayaran gagal diproses. Silakan coba kembali.');
                },
                onClose: function () {
                    setLoading(false);
                    // Just re-enable the button, no error
                },
            });
        } catch (err) {
            setLoading(false);
            setErrorMessage(err.message || 'Terjadi kesalahan saat memulai pembayaran.');
        }
    };

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
                <div className="mt-6 border-b border-slate-200 pb-6">
                    <span className="block text-xs text-slate-500">
                        Total tagihan
                    </span>
                    <div className="mt-1 font-sans text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                        {fmt(total)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                                background: isPaid ? 'var(--color-accent)' : isExpired ? 'var(--color-danger)' : 'var(--color-gold)'
                            }}
                            aria-hidden
                        />
                        <span>{isPaid ? 'Lunas' : isExpired ? 'Kedaluwarsa' : 'Menunggu pembayaran'}</span>
                    </div>

                    {/* Multiple line items definition list (tarif, add-ons, PPN, total) */}
                    {(items.length > 0 || ppn > 0) && (
                        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                            {subtotal > 0 && items.length === 0 && (
                                <div className="flex justify-between">
                                    <span>Tarif layanan</span>
                                    <span className="tabular-nums text-slate-800">{fmt(subtotal)}</span>
                                </div>
                            )}
                            {items.map((it, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>
                                        {it.nama} {it.qty && it.qty > 1 ? `(${it.qty}x)` : ''}
                                    </span>
                                    <span className="tabular-nums text-slate-800">{fmt(it.total)}</span>
                                </div>
                            ))}
                            {ppn > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>PPN (12%)</span>
                                    <span className="tabular-nums">{fmt(ppn)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-100">
                                <span>Total</span>
                                <span className="tabular-nums">{fmt(total)}</span>
                            </div>
                        </dl>
                    )}
                </div>

                {/* 3. Action Section */}
                <div className="mt-6 space-y-4">
                    {/* Error message */}
                    {errorMessage && (
                        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    {/* Status Polling Line */}
                    {polling && (
                        <p className="text-xs text-slate-500 animate-pulse">
                            Memeriksa status pembayaran...
                        </p>
                    )}

                    {/* Buttons depending on state */}
                    {isPaid ? (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 rounded-[6px] border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-medium text-teal-800">
                                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                                <span>Pembayaran diterima. Pengajuan Anda sedang diproses.</span>
                            </div>
                            <Link
                                href={navHref('customer.pengajuan.show', { id: p.id }, role)}
                                className="inline-flex w-full items-center justify-center rounded-[6px] border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                Kembali ke Detail Pengajuan
                            </Link>
                        </div>
                    ) : isExpired ? (
                        <div className="space-y-3 pt-2">
                            <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                Pembayaran kedaluwarsa. Silakan buat pembayaran baru.
                            </div>
                            <button
                                type="button"
                                disabled={loading || polling}
                                onClick={handlePayClick}
                                className="w-full rounded-[6px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading ? 'Menyiapkan...' : 'Buat pembayaran baru'}
                            </button>
                        </div>
                    ) : (
                        <div className="pt-2 sticky bottom-4 sm:static bg-white/90 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none py-2 sm:py-0">
                            <button
                                type="button"
                                disabled={loading || polling}
                                onClick={handlePayClick}
                                className="w-full rounded-[6px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading ? 'Memproses...' : 'Bayar sekarang'}
                            </button>
                            <p className="mt-2 text-center text-xs text-slate-400">
                                Pembayaran diproses secara instan dan aman via Midtrans.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
