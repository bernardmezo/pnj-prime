import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import Field, { useField } from './Field';

/**
 * NumberStepper — integer stepper with +/- buttons and keyboard support.
 *
 * @example
 * <NumberStepper label="Jumlah" min={1} max={10} value={data.jumlah} onChange={(v) => setData('jumlah', v)} />
 */
export default function NumberStepper({
    value = 0,
    onChange,
    min = 0,
    max,
    step = 1,
    label,
    hint,
    error,
    required = false,
    disabled = false,
    id,
    className,
}) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;

    const num = Number.isFinite(Number(value)) ? Number(value) : 0;
    const clamp = (n) => {
        let out = Math.round(n);
        if (min != null && out < min) out = min;
        if (max != null && out > max) out = max;
        return out;
    };
    const atMin = min != null && num <= min;
    const atMax = max != null && num >= max;

    const control = (
        <div
            className={clsx('inline-flex items-center rounded-xl border', className)}
            style={{
                borderColor: shownError ? 'var(--color-danger)' : 'var(--color-border)',
                background: disabled ? 'var(--color-surface)' : 'var(--color-bg)',
            }}
        >
            <button
                type="button"
                aria-label="Kurangi"
                disabled={disabled || atMin}
                onClick={() => onChange?.(clamp(num - step))}
                className="flex h-9 w-9 items-center justify-center rounded-l-xl disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                style={{ color: 'var(--color-muted)' }}
            >
                <Minus className="h-4 w-4" />
            </button>
            <input
                id={controlId}
                type="text"
                inputMode="numeric"
                disabled={disabled}
                required={required}
                aria-label={label}
                aria-invalid={shownError ? true : undefined}
                aria-describedby={describedBy}
                value={num}
                onChange={(e) => onChange?.(clamp(parseInt(e.target.value.replace(/[^0-9-]/g, ''), 10) || 0))}
                className="w-14 border-x bg-transparent py-2 text-center text-sm outline-none disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
            />
            <button
                type="button"
                aria-label="Tambah"
                disabled={disabled || atMax}
                onClick={() => onChange?.(clamp(num + step))}
                className="flex h-9 w-9 items-center justify-center rounded-r-xl disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                style={{ color: 'var(--color-muted)' }}
            >
                <Plus className="h-4 w-4" />
            </button>
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
