import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import Field, { useField } from './Field';
import { filterOptions } from './Combobox';

/**
 * MultiSelect — pick many values, shown as removable chips.
 *
 * @example
 * <MultiSelect label="Tipe" value={data.tipe} onChange={(v) => setData('tipe', v)}
 *   options={tipeOptions} max={3} />
 */
export default function MultiSelect({
    label,
    name,
    value = [],
    onChange,
    options = [],
    placeholder = 'Cari…',
    hint,
    error,
    disabled = false,
    required = false,
    size = 'md',
    max,
    emptyLabel = 'Tidak ditemukan',
    id,
    className,
}) {
    const reduce = useReducedMotion();
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;
    const [query, setQuery] = useState('');

    const selectedOptions = options.filter((o) => value.includes(o.value));
    const available = filterOptions(options, query).filter(
        (o) => !value.includes(o.value) && (!max || value.length < max),
    );

    const remove = (v) => onChange?.(value.filter((x) => x !== v));

    const control = (
        <div className={clsx('relative', className)}>
            <Combobox
                multiple
                value={value}
                onChange={(v) => {
                    if (max && v.length > max) return;
                    onChange?.(v);
                }}
                disabled={disabled}
                immediate
            >
                {({ open }) => (
                    <>
                        {selectedOptions.length > 0 && (
                            <ul className="mb-2 flex flex-wrap gap-1.5">
                                {selectedOptions.map((o) => (
                                    <li
                                        key={String(o.value)}
                                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                                        style={{
                                            borderColor: 'var(--color-border)',
                                            background: 'var(--color-accent-tint)',
                                            color: 'var(--color-accent-hover)',
                                        }}
                                    >
                                        {o.label}
                                        {!disabled && (
                                            <button
                                                type="button"
                                                aria-label={`Hapus ${o.label}`}
                                                onClick={() => remove(o.value)}
                                                className="rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <ComboboxInput
                            id={controlId}
                            aria-invalid={shownError ? true : undefined}
                            aria-describedby={describedBy}
                            aria-required={required || undefined}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className={clsx(
                                'w-full rounded-xl border pr-10 outline-none transition',
                                size === 'sm' ? 'pl-3 py-1.5 text-[13px]' : 'pl-4 py-2.5 text-sm',
                                disabled && 'cursor-not-allowed',
                            )}
                            style={{
                                borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                                color: 'var(--color-ink)',
                                background: disabled ? 'var(--color-surface)' : 'var(--color-bg)',
                            }}
                        />
                        <ComboboxButton
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                            aria-label="Buka pilihan"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} />
                        </ComboboxButton>

                        <ComboboxOptions
                            anchor="bottom start"
                            transition
                            className={clsx(
                                'z-[90] mt-1 max-h-64 w-[var(--input-width)] overflow-auto rounded-xl border bg-white py-1 text-sm shadow-card focus:outline-none',
                                !reduce && 'transition duration-100 ease-out data-[closed]:opacity-0 data-[closed]:scale-95',
                            )}
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            {available.length === 0 && (
                                <div className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    {emptyLabel}
                                </div>
                            )}
                            {available.map((opt) => (
                                <ComboboxOption
                                    key={String(opt.value)}
                                    value={opt.value}
                                    disabled={opt.disabled}
                                    className={({ focus }) =>
                                        clsx(
                                            'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5',
                                            focus && 'bg-[color:var(--color-accent-tint)]',
                                        )
                                    }
                                >
                                    {({ selected: sel }) => (
                                        <>
                                            <span className="truncate" style={{ color: 'var(--color-ink)' }}>
                                                {opt.label}
                                            </span>
                                            {sel && (
                                                <Check
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ color: 'var(--color-accent)' }}
                                                />
                                            )}
                                        </>
                                    )}
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    </>
                )}
            </Combobox>
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
            {name && value.map((v) => <input key={String(v)} type="hidden" name={`${name}[]`} value={v} />)}
            {wrapped}
        </>
    );
}
