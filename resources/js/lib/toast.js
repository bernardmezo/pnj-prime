/**
 * Toast system — global state via simple event bus.
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.success('Produk berhasil disimpan.');
 *   toast.error('Terjadi kesalahan.');
 *   toast.warning('Stok hampir habis.');
 *   toast.info('Data sedang diperbarui.');
 *
 * Komponen <ToastContainer /> harus dipasang di layout utama.
 */

let _listeners = [];
let _id = 0;

export const toastBus = {
    subscribe(fn) {
        _listeners.push(fn);
        return () => { _listeners = _listeners.filter(l => l !== fn); };
    },
    emit(event) {
        _listeners.forEach(fn => fn(event));
    },
};

function push(type, message, duration = 4500) {
    toastBus.emit({ type: 'ADD', toast: { id: ++_id, type, message, duration } });
}

export const toast = {
    success: (msg, duration) => push('success', msg, duration),
    error:   (msg, duration) => push('error',   msg, duration),
    warning: (msg, duration) => push('warning', msg, duration),
    info:    (msg, duration) => push('info',    msg, duration),
    dismiss: (id)            => toastBus.emit({ type: 'REMOVE', id }),
};
