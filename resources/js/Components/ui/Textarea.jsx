import { forwardRef, useId } from 'react';
import clsx from 'clsx';
import Field, { useField } from './Field';

const base =
    'block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)]';

/**
 * Textarea — native textarea wrapped in Field semantics.
 *
 * @example
 * <Textarea label="Keperluan" rows={4} value={data.keperluan} onChange={(e) => setData('keperluan', e.target.value)} />
 */
const Textarea = forwardRef(function Textarea(
    { label, hint, error, required = false, id, className, rows = 4, ...props },
    ref,
) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;

    const control = (
        <textarea
            ref={ref}
            id={controlId}
            rows={rows}
            required={required}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={describedBy}
            className={clsx(
                base,
                'resize-y',
                shownError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
                className,
            )}
            style={{ color: 'var(--color-ink)' }}
            {...props}
        />
    );

    return label != null || hint != null || error != null ? (
        <Field label={label} hint={hint} error={error} required={required} htmlFor={controlId} id={controlId}>
            {control}
        </Field>
    ) : (
        control
    );
});

export default Textarea;
