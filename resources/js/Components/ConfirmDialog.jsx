import { useEffect, useReducer, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '@/Components/ui/Modal';

/**
 * ConfirmDialog — pengganti window.confirm() untuk aksi berbahaya.
 *
 * Ada dua cara pakai:
 *
 * 1. Pakai hook useConfirm() (direkomendasikan):
 *    const { confirm, ConfirmUI } = useConfirm();
 *    ...
 *    const ok = await confirm({ title: 'Hapus produk?', message: '...', danger: true });
 *    if (ok) { ... }
 *    ...
 *    return <>{ConfirmUI}</>;
 *
 * 2. Pakai komponen langsung (controlled):
 *    <ConfirmDialog
 *      open={open}
 *      title="Tolak produk?"
 *      message="Tindakan ini tidak bisa dibatalkan."
 *      danger
 *      confirmLabel="Ya, Tolak"
 *      onConfirm={() => { doReject(); setOpen(false); }}
 *      onCancel={() => setOpen(false)}
 *    />
 */

/* ------------------------------------------------------------------ */
/* Komponen dasar                                                       */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({
    open = false,
    title = 'Konfirmasi',
    message,
    danger = false,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    onConfirm,
    onCancel,
}) {
    const confirmBtnRef = useRef(null);

    // Fokus ke tombol konfirmasi saat dialog terbuka
    useEffect(() => {
        if (open) {
            setTimeout(() => confirmBtnRef.current?.focus(), 50);
        }
    }, [open]);

    if (!open) return null;

    return (
        <Modal open={open} onClose={onCancel} title="" size="sm">
            <div className="text-center space-y-4">
                {/* Ikon */}
                <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                        background: danger ? 'var(--color-danger-tint)' : 'var(--color-warning-tint)',
                    }}
                >
                    {danger
                        ? <Trash2 className="h-6 w-6" style={{ color: 'var(--color-danger)' }} />
                        : <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-warning)' }} />
                    }
                </div>

                {/* Judul */}
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    {title}
                </h2>

                {/* Pesan */}
                {message && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {message}
                    </p>
                )}

                {/* Tombol */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                            background: danger ? 'var(--color-danger)' : 'var(--color-accent)',
                            '--tw-ring-color': danger ? 'var(--color-danger)' : 'var(--color-accent)',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ------------------------------------------------------------------ */
/* Hook useConfirm — resolve/reject via Promise                        */
/* ------------------------------------------------------------------ */
export function useConfirm() {
    const [state, dispatch] = useReducer((s, a) => ({ ...s, ...a }), {
        open: false,
        title: 'Konfirmasi',
        message: '',
        danger: false,
        confirmLabel: 'Konfirmasi',
        cancelLabel: 'Batal',
        resolve: null,
    });

    const confirm = (opts = {}) => new Promise((resolve) => {
        dispatch({
            open: true,
            title: opts.title ?? 'Konfirmasi',
            message: opts.message ?? '',
            danger: opts.danger ?? false,
            confirmLabel: opts.confirmLabel ?? (opts.danger ? 'Ya, Lanjutkan' : 'Konfirmasi'),
            cancelLabel: opts.cancelLabel ?? 'Batal',
            resolve,
        });
    });

    const handleConfirm = () => {
        state.resolve?.(true);
        dispatch({ open: false, resolve: null });
    };

    const handleCancel = () => {
        state.resolve?.(false);
        dispatch({ open: false, resolve: null });
    };

    const ConfirmUI = (
        <ConfirmDialog
            open={state.open}
            title={state.title}
            message={state.message}
            danger={state.danger}
            confirmLabel={state.confirmLabel}
            cancelLabel={state.cancelLabel}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, ConfirmUI };
}
