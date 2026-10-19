import { Switch as HeadlessSwitch } from '@headlessui/react';
import { useId } from 'react';
import clsx from 'clsx';
import { useField } from './Field';

/**
 * Switch — on/off toggle for aktif/nonaktif.
 *
 * @example
 * <Switch checked={data.aktif} onChange={(v) => setData('aktif', v)} label="Aktif" />
 */
export default function Switch({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    error,
    name,
    id,
    className,
}) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;

    return (
        <div className={clsx('flex items-start gap-3', className)}>
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                id={controlId}
                aria-label={label}
                aria-invalid={shownError ? true : undefined}
                className={clsx(
                    'group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition',
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                )}
                style={{
                    borderColor: checked ? 'var(--color-accent)' : 'var(--color-border)',
                    background: checked ? 'var(--color-accent)' : 'var(--color-surface)',
                }}
            >
                <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition group-data-[checked]:translate-x-[22px] translate-x-0.5"
                />
            </HeadlessSwitch>
            {name && <input type="hidden" name={name} value={checked ? '1' : '0'} />}
            {(label || description) && (
                <span className="min-w-0">
                    {label && (
                        <span className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="block text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            {description}
                        </span>
                    )}
                </span>
            )}
            {shownError && (
                <span className="text-[13px]" style={{ color: 'var(--color-danger)' }}>
                    {shownError}
                </span>
            )}
        </div>
    );
}
