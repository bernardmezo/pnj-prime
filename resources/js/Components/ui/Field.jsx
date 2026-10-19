import { createContext, useContext, useId } from 'react';
import clsx from 'clsx';

/**
 * Field — the single label/required/hint/error wrapper for every form
 * control. It wires aria-describedby + aria-invalid into any descendant that
 * consumes `useField()`, and renders the error with role="alert".
 *
 * @example
 * <Field label="Nama layanan" required hint="Muncul di katalog" error={errors.name}>
 *   <TextInput value={data.name} onChange={(e) => setData('name', e.target.value)} />
 * </Field>
 */
const FieldContext = createContext(null);

/** Descendant controls call this to inherit id / described-by / invalid / error. */
export function useField() {
    return useContext(FieldContext);
}

export default function Field({
    label,
    htmlFor,
    id,
    required = false,
    hint,
    error,
    children,
    className,
}) {
    const autoId = useId();
    const fieldId = htmlFor ?? id ?? autoId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={clsx('w-full', className)}>
            {label && (
                <label
                    htmlFor={fieldId}
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                >
                    {label}
                    {required && (
                        <span aria-hidden="true" className="ml-0.5" style={{ color: 'var(--color-danger)' }}>
                            *
                        </span>
                    )}
                </label>
            )}

            <FieldContext.Provider
                value={{ id: fieldId, describedBy, invalid: Boolean(error), error }}
            >
                {children}
            </FieldContext.Provider>

            {hint && (
                <p id={hintId} className="mt-1.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    {hint}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1.5 text-[13px]"
                    style={{ color: 'var(--color-danger)' }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}
