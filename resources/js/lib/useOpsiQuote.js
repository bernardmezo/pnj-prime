import { useEffect, useState } from 'react';

/** Resolve the quote endpoint, tolerating a missing Ziggy route in tests. */
function hitungUrl() {
    try {
        return route('customer.pengajuan.hitung');
    } catch {
        return '/pengajuan/hitung';
    }
}

function csrfToken() {
    if (typeof document === 'undefined') return '';
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

/**
 * Debounced, server-authoritative quote for a draft selection.
 *
 * The client never computes money: it posts the product, its quantity context
 * and the picked option ids/qty, then renders whatever the server returns.
 * Requests are aborted when the selection changes again.
 *
 * @param {object} params
 * @param {number|string|null} params.productId
 * @param {'jasa'|'ruangan'|'produk'} params.tipe
 * @param {object} [params.selection]   { jumlah, peserta, jam_mulai, jam_selesai }
 * @param {Array<{id:number, qty:number}>} [params.opsi]
 * @param {boolean} [params.enabled]
 * @param {number} [params.debounceMs]
 * @returns {{ quote: object|null, loading: boolean, error: string|null }}
 */
export function useOpsiQuote({
    productId = null,
    tipe = 'jasa',
    selection = {},
    opsi = [],
    enabled = true,
    debounceMs = 400,
}) {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const selectionKey = JSON.stringify(selection ?? {});
    const opsiKey = JSON.stringify(opsi ?? []);

    useEffect(() => {
        if (!enabled || !productId) {
            setQuote(null);
            setError(null);
            setLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        setLoading(true);
        setError(null);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(hitungUrl(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ tipe, product_id: productId, ...(selection ?? {}), opsi }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.message ?? `Gagal menghitung (${res.status}).`);
                }
                setQuote(await res.json());
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    setError(err?.message ?? 'Gagal menghitung pratinjau.');
                }
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, tipe, selectionKey, opsiKey, enabled, debounceMs]);

    return { quote, loading, error };
}

export default useOpsiQuote;
