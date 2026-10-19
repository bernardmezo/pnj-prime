import { forwardRef, useId } from 'react';
import clsx from 'clsx';
import Field, { useField } from './Field';

const base =
    'block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)]';

/**
 * TextInput — native input wrapped in Field semantics.
 *
 * @example
 * <TextInput label="Nama" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
 */
const TextInput = forwardRef(function TextInput(
    { label, hint, error, required = false, id, className, ...props },
    ref,
) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;

    const control = (
        <input
            ref={ref}
            id={controlId}
            required={required}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={describedBy}
            className={clsx(
                base,
                shownError
                    ? 'border-[var(--color-danger)]'
                    : 'border-[var(--color-border)]',
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

export default TextInput;
