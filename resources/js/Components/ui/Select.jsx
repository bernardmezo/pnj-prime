import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useId } from 'react';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import Field, { useField } from './Field';

const SIZES = {
    sm: 'px-3 py-1.5 text-[13px]',
    md: 'px-4 py-2.5 text-sm',
};

/**
 * Select — accessible single-choice dropdown built on Headless UI Listbox.
 *
 * @example
 * <Select
 *   label="Satuan"
 *   value={data.satuan}
 *   onChange={(v) => setData('satuan', v)}
 *   options={[{ value: 'flat', label: 'Flat' }, { value: 'per_hari', label: 'Per hari' }]}
 *   error={errors.satuan}
 * />
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.name]       renders a hidden input for native posts
 * @param {*} props.value
 * @param {(v: *) => void} props.onChange
 * @param {Array<{value:*, label:string, description?:string, disabled?:boolean, icon?:import('react').ReactNode}>} props.options
 */
export default function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Pilih…',
    hint,
    error,
    disabled = false,
    required = false,
    size = 'md',
    clearable = false,
    id,
    className,
}) {
    const reduce = useReducedMotion();
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;
    const selected = options.find((o) => o.value === value) ?? null;

    const control = (
        <div className={clsx('relative', className)}>
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                {({ open }) => (
                    <>
                        <ListboxButton
                            id={controlId}
                            aria-label={
                                label != null
                                    ? `${label}: ${selected ? selected.label : placeholder}`
                                    : undefined
                            }
                            aria-invalid={shownError ? true : undefined}
                            aria-describedby={describedBy}
                            aria-required={required || undefined}
                            className={clsx(
                                'flex w-full items-center justify-between gap-2 rounded-xl border text-left outline-none transition',
                                SIZES[size],
                                disabled && 'cursor-not-allowed',
                            )}
                            style={{
                                borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                                color: selected ? 'var(--color-ink)' : 'var(--color-muted)',
                                background: disabled ? 'var(--color-surface)' : 'var(--color-bg)',
                            }}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                {selected?.icon}
                                <span className="truncate">{selected ? selected.label : placeholder}</span>
                            </span>
                            <ChevronDown
                                className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
                                style={{ color: 'var(--color-muted)' }}
                            />
                        </ListboxButton>

                        <ListboxOptions
                            anchor="bottom start"
                            transition
                            className={clsx(
                                'z-[90] mt-1 max-h-64 w-[var(--button-width)] overflow-auto rounded-xl border bg-white py-1 text-sm shadow-card focus:outline-none',
                                !reduce && 'transition duration-100 ease-out data-[closed]:opacity-0 data-[closed]:scale-95',
                            )}
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            {options.length === 0 && (
                                <div className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    Tidak ada pilihan
                                </div>
                            )}
                            {options.map((opt) => (
                                <ListboxOption
                                    key={String(opt.value)}
                                    value={opt.value}
                                    disabled={opt.disabled}
                                    className={({ focus, disabled: dis }) =>
                                        clsx(
                                            'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5',
                                            focus && 'bg-[color:var(--color-accent-tint)]',
                                            dis && 'cursor-not-allowed opacity-50',
                                        )
                                    }
                                >
                                    {({ selected: sel }) => (
                                        <>
                                            <span className="flex min-w-0 items-center gap-2">
                                                {opt.icon}
                                                <span className="min-w-0">
                                                    <span
                                                        className={clsx('block truncate', sel && 'font-semibold')}
                                                        style={{ color: 'var(--color-ink)' }}
                                                    >
                                                        {opt.label}
                                                    </span>
                                                    {opt.description && (
                                                        <span
                                                            className="block truncate text-xs"
                                                            style={{ color: 'var(--color-muted)' }}
                                                        >
                                                            {opt.description}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            {sel && (
                                                <Check
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ color: 'var(--color-accent)' }}
                                                />
                                            )}
                                        </>
                                    )}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </>
                )}
            </Listbox>

            {clearable && selected && !disabled && (
                <button
                    type="button"
                    aria-label="Bersihkan pilihan"
                    onClick={() => onChange?.(null)}
                    className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded p-0.5"
                    style={{ color: 'var(--color-muted)' }}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );

    const wrapped =
        label != null || hint != null || error != null ? (
            <Field label={label} hint={hint} error={error} required={required} htmlFor={controlId} id={controlId}>
                {control}
            </Field>
        ) : (
            control
        );

    return (
        <>
            {name && <input type="hidden" name={name} value={value ?? ''} />}
            {wrapped}
        </>
    );
}
