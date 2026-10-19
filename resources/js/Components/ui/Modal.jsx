import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

const SIZES = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
};

/**
 * Modal — dialog with focus trap, ESC, scroll lock and a mobile full-height
 * sheet. Popovers (Select/Combobox/Menu) layer above it automatically because
 * they render in portals with a higher z-index.
 *
 * @example
 * <Modal open={open} onClose={close} size="xl" title="Ajukan Layanan"
 *   description="…" footer={<><SecondaryButton onClick={close}>Batal</SecondaryButton><PrimaryButton>Kirim</PrimaryButton></>}
 *   dismissible={!processing}>
 *   {body}
 * </Modal>
 */
export default function Modal({
    open,
    onClose,
    size = 'md',
    title,
    description,
    children,
    footer,
    dismissible = true,
    showClose = true,
    className,
    panelClassName,
}) {
    const reduce = useReducedMotion();

    return (
        <Dialog
            open={open}
            onClose={dismissible ? onClose : () => {}}
            className="relative z-[80]"
        >
            <DialogBackdrop
                transition={!reduce}
                className={clsx(
                    'fixed inset-0',
                    !reduce && 'transition duration-150 ease-out data-[closed]:opacity-0',
                )}
                style={{ background: 'rgba(26,29,28,0.5)' }}
            />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
                <DialogPanel
                    transition={!reduce}
                    className={clsx(
                        'relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[85vh] sm:rounded-[22px] sm:border',
                        SIZES[size] ?? SIZES.md,
                        !reduce &&
                            'transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95',
                        panelClassName,
                    )}
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {(title || showClose) && (
                        <div
                            className="flex flex-none items-start justify-between gap-4 border-b px-5 py-4 sm:px-6"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div className="min-w-0">
                                {title && (
                                    <DialogTitle
                                        className="font-display text-lg font-bold"
                                        style={{ color: 'var(--color-ink)' }}
                                    >
                                        {title}
                                    </DialogTitle>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Tutup"
                                    className="shrink-0 rounded-lg p-1"
                                    style={{ color: 'var(--color-muted)' }}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className={clsx('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', className)}>
                        {children}
                    </div>

                    {footer && (
                        <div
                            className="flex flex-none flex-wrap justify-end gap-2 border-t px-5 py-4 sm:px-6"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            {footer}
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
