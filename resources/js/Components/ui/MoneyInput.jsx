import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import Field, { useField } from './Field';
import { formatNumber, parseRupiah } from '@/lib/money';

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
                'flex items-center overflow-hidden rounded-xl border bg-white transition duration-150',
                'focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-1',
                className,
            )}
            style={{
                borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                background: disabled ? 'var(--color-surface)' : 'var(--color-bg)',
            }}
        >
            <span className="pl-4 pr-1 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
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
                className="w-full rounded-xl bg-transparent px-2 py-2.5 text-sm outline-none disabled:cursor-not-allowed"
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
