import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

/**
 * AlertBanner — komponen alert inline untuk form dan halaman.
 *
 * Usage:
 *   <AlertBanner type="error" message="Harga tidak boleh negatif." />
 *   <AlertBanner type="success" title="Tersimpan" message="Data berhasil disimpan." onDismiss={() => setShow(false)} />
 *
 * Props:
 *   type        'success' | 'error' | 'warning' | 'info'  (default: 'info')
 *   title       string (opsional)
 *   message     string | ReactNode
 *   onDismiss   () => void  — jika diisi, tampilkan tombol ×
 *   className   string tambahan untuk div terluar
 */

const VARIANTS = {
    success: {
        icon: CheckCircle2,
        color: 'var(--color-success)',
        tint: 'var(--color-success-tint)',
        border: 'var(--color-success)',
    },
    error: {
        icon: XCircle,
        color: 'var(--color-danger)',
        tint: 'var(--color-danger-tint)',
        border: 'var(--color-danger)',
    },
    warning: {
        icon: AlertTriangle,
        color: 'var(--color-warning)',
        tint: 'var(--color-warning-tint)',
        border: 'var(--color-warning)',
    },
    info: {
        icon: Info,
        color: 'var(--color-info)',
        tint: 'var(--color-info-tint)',
        border: 'var(--color-info)',
    },
};

export default function AlertBanner({ type = 'info', title, message, onDismiss, className = '' }) {
    const v = VARIANTS[type] ?? VARIANTS.info;
    const Icon = v.icon;

    if (!message) return null;

    return (
        <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border p-3.5 ${className}`}
            style={{
                background: v.tint,
                borderColor: v.border,
                borderLeftWidth: '4px',
            }}
        >
            <span className="mt-0.5 shrink-0" style={{ color: v.color }}>
                <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0 text-sm">
                {title && (
                    <p className="font-semibold mb-0.5" style={{ color: v.color }}>
                        {title}
                    </p>
                )}
                <p style={{ color: 'var(--color-ink)' }}>
                    {message}
                </p>
            </div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Tutup pesan"
                    className="shrink-0 rounded-full p-0.5 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
                    style={{ color: v.color }}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
