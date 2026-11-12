import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';

const TONE = {
    success: {
        icon: CheckCircle2,
        border: 'var(--color-success)',
        iconColor: 'var(--color-success)',
    },
    error: {
        icon: XCircle,
        border: 'var(--color-danger)',
        iconColor: 'var(--color-danger)',
    },
};

/**
 * FlashToast — notifikasi premium dengan sudut membulat, bayangan berlapis,
 * dan focus ring pada tombol tutup.
 */
export default function FlashToast() {
    const { props } = usePage();
    const [visible, setVisible] = useState(false);

    const message = props.flash?.success || props.flash?.error;
    const type = props.flash?.success ? 'success' : props.flash?.error ? 'error' : null;

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!visible || !type) return null;

    const Icon = TONE[type].icon;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-l-4 p-4 shadow-[var(--shadow-layered)]"
                style={{
                    borderColor: 'var(--color-border)',
                    borderLeftColor: TONE[type].border,
                    background: 'var(--color-bg)',
                }}
            >
                <span className="mt-0.5 shrink-0" style={{ color: TONE[type].iconColor }}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    {message}
                </div>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="rounded-full p-1 text-[var(--color-muted)] transition duration-150 hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                    aria-label="Tutup notifikasi"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
