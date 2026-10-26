import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FlashToast() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(null);

    useEffect(() => {
        if (flash?.success) {
            setVisible({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setVisible({ type: 'error', message: flash.error });
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => setVisible(null), 4000);
        return () => clearTimeout(timer);
    }, [visible]);

    if (!visible) return null;

    const isSuccess = visible.type === 'success';

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[9999] flex max-w-sm items-start gap-3 rounded-xl border px-5 py-4 shadow-lg"
            style={{
                background: isSuccess ? 'var(--color-surface, #f0fdf4)' : '#fef2f2',
                borderColor: isSuccess ? '#bbf7d0' : '#fecaca',
                color: isSuccess ? '#166534' : '#991b1b',
            }}
        >
            {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
            )}
            <span className="text-sm font-medium leading-snug">{visible.message}</span>
            <button
                type="button"
                onClick={() => setVisible(null)}
                className="ml-auto -mr-1 -mt-1 rounded p-1 opacity-60 transition hover:opacity-100"
                aria-label="Tutup"
            >
                ×
            </button>
        </div>
    );
}
