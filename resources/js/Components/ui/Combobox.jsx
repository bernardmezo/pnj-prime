import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import Field, { useField } from './Field';

const SIZES = {
    sm: 'pl-3 py-1.5 text-[13px]',
    md: 'pl-4 py-2.5 text-sm',
};

/** accent- and case-insensitive filter used for the default (client) mode. */
export function filterOptions(options, query) {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
        String(o.label)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
    );
}

/**
 * Combobox — searchable single-choice select. Use it for long lists
 * (layanan picker, users, …). Pass `onSearch` for async/server search.
 *
 * @example
 * <Combobox label="Layanan" value={data.layanan} onChange={(v) => setData('layanan', v)}
 *   options={layananOptions} onSearch={(q) => fetchList(q)} loading={loading} />
 */
export default function Combobox({
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Cari…',
    hint,
    error,
    disabled = false,
    required = false,
    size = 'md',
    onSearch,
    loading = false,
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

    useEffect(() => {
        if (!onSearch) return undefined;
        const t = setTimeout(() => onSearch(query), 250);
        return () => clearTimeout(t);
    }, [query, onSearch]);

    const filtered = onSearch ? options : filterOptions(options, query);

    const control = (
        <div className={clsx('relative', className)}>
            <Combobox
                value={value}
                onChange={onChange}
                disabled={disabled}
                immediate
            >
                {({ open }) => (
                    <>
                        <ComboboxInput
                            id={controlId}
                            aria-invalid={shownError ? true : undefined}
                            aria-describedby={describedBy}
                            aria-required={required || undefined}
                            displayValue={(v) => options.find((o) => o.value === v)?.label ?? ''}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholder}
                            className={clsx(
                                'w-full rounded-xl border pr-10 outline-none transition',
                                SIZES[size],
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
                            {loading && (
                                <div className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    Memuat…
                                </div>
                            )}
                            {!loading && filtered.length === 0 && (
                                <div className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    {emptyLabel}
                                </div>
                            )}
                            {filtered.map((opt) => (
                                <ComboboxOption
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
            {name && <input type="hidden" name={name} value={value ?? ''} />}
            {wrapped}
        </>
    );
}
