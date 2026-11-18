import { useEffect, useReducer, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { toast, toastBus } from '@/lib/toast';

/* ------------------------------------------------------------------ */
/* Config per varian                                                    */
/* ------------------------------------------------------------------ */
const VARIANTS = {
    success: {
        icon: CheckCircle2,
        color: 'var(--color-success)',
        tint: 'var(--color-success-tint)',
        label: 'Berhasil',
    },
    error: {
        icon: XCircle,
        color: 'var(--color-danger)',
        tint: 'var(--color-danger-tint)',
        label: 'Kesalahan',
    },
    warning: {
        icon: AlertTriangle,
        color: 'var(--color-warning)',
        tint: 'var(--color-warning-tint)',
        label: 'Peringatan',
    },
    info: {
        icon: Info,
        color: 'var(--color-info)',
        tint: 'var(--color-info-tint)',
        label: 'Informasi',
    },
};

/* ------------------------------------------------------------------ */
/* Reducer                                                              */
/* ------------------------------------------------------------------ */
function reducer(state, action) {
    switch (action.type) {
        case 'ADD':
            // Maks 5 toast ditumpuk; buang yang terlama jika lebih
            return [...state.slice(-4), action.toast];
        case 'REMOVE':
            return state.filter(t => t.id !== action.id);
        default:
            return state;
    }
}

/* ------------------------------------------------------------------ */
/* Single toast item                                                    */
/* ------------------------------------------------------------------ */
function ToastItem({ item, onDismiss }) {
    const v = VARIANTS[item.type] ?? VARIANTS.info;
    const Icon = v.icon;
    const timerRef = useRef(null);

    useEffect(() => {
        if (item.duration > 0) {
            timerRef.current = setTimeout(() => onDismiss(item.id), item.duration);
        }
        return () => clearTimeout(timerRef.current);
    }, [item.id, item.duration]);

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm"
            style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                borderLeftWidth: '4px',
                borderLeftColor: v.color,
                animation: 'toast-in 0.2s ease-out',
            }}
        >
            <span className="mt-0.5 shrink-0" style={{ color: v.color }}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {v.label}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                    {item.message}
                </p>
            </div>
            <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 rounded-full p-1 transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                style={{ color: 'var(--color-muted)' }}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Container — pasang di layout utama                                   */
/* ------------------------------------------------------------------ */
export default function ToastContainer() {
    const [items, dispatch] = useReducer(reducer, []);
    const { props } = usePage();

    // Koneksikan ke event bus
    useEffect(() => {
        return toastBus.subscribe((event) => dispatch(event));
    }, []);

    // Koneksikan ke flash Inertia (from('success'), with('error'), dll.)
    const flash = props.flash ?? {};
    const prevFlash = useRef({});

    useEffect(() => {
        const prev = prevFlash.current;

        if (flash.success && flash.success !== prev.success) {
            toast.success(flash.success);
        }
        if (flash.error && flash.error !== prev.error) {
            toast.error(flash.error);
        }
        if (flash.warning && flash.warning !== prev.warning) {
            toast.warning(flash.warning);
        }
        if (flash.info && flash.info !== prev.info) {
            toast.info(flash.info);
        }

        prevFlash.current = flash;
    }, [flash.success, flash.error, flash.warning, flash.info]);

    if (items.length === 0) return null;

    return (
        <div
            className="fixed right-4 top-4 z-[9999] flex flex-col gap-2.5 sm:right-6 sm:top-6"
            style={{ maxWidth: '24rem' }}
            aria-label="Notifikasi"
        >
            {items.map(item => (
                <ToastItem
                    key={item.id}
                    item={item}
                    onDismiss={(id) => dispatch({ type: 'REMOVE', id })}
                />
            ))}
        </div>
    );
}
