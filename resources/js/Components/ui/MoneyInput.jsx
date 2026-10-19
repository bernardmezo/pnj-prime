import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import Field, { useField } from './Field';
import { formatNumber, parseRupiah } from '@/lib/money';

/**
 * MoneyInput — rupiah input. Shows "Rp 1.250.000" while storing integer
 * rupiah (no decimals, no floats).
 *
 * @example
 * <MoneyInput label="Harga" value={data.harga} onChange={(v) => setData('harga', v)} />
 */
export default function MoneyInput({
    value = 0,
    onChange,
    label,
    hint,
    error,
    required = false,
    disabled = false,
    name,
    id,
    className,
}) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;
    const [focused, setFocused] = useState(false);
    const [text, setText] = useState(formatNumber(value));

    useEffect(() => {
        if (!focused) setText(formatNumber(value));
    }, [value, focused]);

    const control = (
        <div
            className={clsx(
                'flex items-center overflow-hidden rounded-xl border bg-white',
                className,
            )}
            style={{
                borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                background: disabled ? 'var(--color-surface)' : 'var(--color-bg)',
            }}
        >
            <span className="pl-4 pr-1 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                Rp
            </span>
            <input
                id={controlId}
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                required={required}
                aria-invalid={shownError ? true : undefined}
                aria-describedby={describedBy}
                value={text}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    setText(formatNumber(value));
                }}
                onChange={(e) => {
                    const next = parseRupiah(e.target.value);
                    setText(e.target.value === '' ? '' : formatNumber(next));
                    onChange?.(next);
                }}
                className="w-full rounded-xl bg-transparent px-2 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset disabled:cursor-not-allowed"
                style={{ color: 'var(--color-ink)' }}
            />
            {name && <input type="hidden" name={name} value={value ?? 0} />}
        </div>
    );

    return label != null || hint != null || error != null ? (
        <Field label={label} hint={hint} error={error} required={required} htmlFor={controlId} id={controlId}>
            {control}
        </Field>
    ) : (
        control
    );
}
