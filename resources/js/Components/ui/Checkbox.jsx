import { Checkbox as HeadlessCheckbox } from '@headlessui/react';
import { Check, Minus } from 'lucide-react';
import { useId } from 'react';
import clsx from 'clsx';
import { useField } from './Field';

/**
 * Checkbox — accessible checkbox built on Headless UI. Safe inside table cells
 * (pass `aria-label` when there is no visible label).
 *
 * @example
 * <Checkbox checked={data.aktif} onChange={(v) => setData('aktif', v)} label="Aktif" />
 * <Checkbox checked={row.selected} onChange={...} aria-label={`Pilih ${row.name}`} />
 */
export default function Checkbox({
    checked,
    onChange,
    label,
    description,
    indeterminate = false,
    disabled = false,
    error,
    name,
    value,
    id,
    className,
    'aria-label': ariaLabel,
}) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;

    return (
        <HeadlessCheckbox
            checked={checked}
            onChange={onChange}
            indeterminate={indeterminate}
            disabled={disabled}
            name={name}
            value={value}
            id={controlId}
            aria-label={ariaLabel}
            aria-invalid={shownError ? true : undefined}
            className={clsx(
                'group inline-flex items-start gap-2.5 text-sm',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                label || description ? 'w-full' : '',
                className,
            )}
        >
            <span
                className={clsx(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                    'group-data-[checked]:border-transparent group-data-[checked]:bg-[var(--color-accent)]',
                    'group-data-[indeterminate]:border-transparent group-data-[indeterminate]:bg-[var(--color-accent)]',
                )}
                style={{
                    borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                    color: 'var(--color-bg)',
                }}
            >
                <Check className="h-3 w-3 group-data-[indeterminate]:hidden" strokeWidth={3} />
                <Minus className="hidden h-3 w-3 group-data-[indeterminate]:block" strokeWidth={3} />
            </span>
            {(label || description) && (
                <span className="min-w-0">
                    {label && (
                        <span className="block font-medium leading-5" style={{ color: 'var(--color-ink)' }}>
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="block text-[13px] leading-5" style={{ color: 'var(--color-muted)' }}>
                            {description}
                        </span>
                    )}
                </span>
            )}
            {shownError && !label && (
                <span className="text-[13px]" style={{ color: 'var(--color-danger)' }}>
                    {shownError}
                </span>
            )}
        </HeadlessCheckbox>
    );
}
