import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

/**
 * Accordion (Disclosure) — collapsible section. Use one per fitur on the
 * mobile Hak Akses screen.
 *
 * @example
 * <Accordion title="Riwayat & Pemantauan" defaultOpen>{rows}</Accordion>
 */
export default function Accordion({ title, description, children, defaultOpen = false, className, panelClassName }) {
    return (
        <Disclosure defaultOpen={defaultOpen} as="div" className={clsx('rounded-2xl border', className)} style={{ borderColor: 'var(--color-border)' }}>
            {({ open }) => (
                <>
                    <DisclosureButton
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        style={{ background: 'var(--color-surface)' }}
                    >
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                {title}
                            </span>
                            {description && (
                                <span className="block text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    {description}
                                </span>
                            )}
                        </span>
                        <ChevronDown
                            className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
                            style={{ color: 'var(--color-muted)' }}
                        />
                    </DisclosureButton>
                    <DisclosurePanel className={clsx('px-4 py-3', panelClassName)}>
                        {children}
                    </DisclosurePanel>
                </>
            )}
        </Disclosure>
    );
}
