import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
};

/**
 * Modal premium dengan garis dekoratif gradasi gold → teal di bagian atas,
 * bayangan berlapis, dan focus ring yang jelas pada tombol tutup.
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={dismissible ? onClose : () => {}}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={clsx(
                                    'relative w-full transform overflow-hidden rounded-2xl border bg-white text-left align-middle shadow-[var(--shadow-layered)] transition-all',
                                    SIZES[size],
                                )}
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <div
                                    className="absolute left-0 right-0 top-0 h-1 w-full bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]"
                                    aria-hidden="true"
                                />
                                <div className="p-6 pt-7">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="text-left">
                                            {title && (
                                                <Dialog.Title
                                                    className="font-display text-lg font-bold leading-6"
                                                    style={{ color: 'var(--color-ink)' }}
                                                >
                                                    {title}
                                                </Dialog.Title>
                                            )}
                                            {description && (
                                                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                                    {description}
                                                </p>
                                            )}
                                        </div>
                                        {dismissible && (
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="rounded-full p-1.5 text-[var(--color-muted)] transition duration-150 hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                                                aria-label="Tutup"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-4">{children}</div>
                                    {footer && (
                                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                            {footer}
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
