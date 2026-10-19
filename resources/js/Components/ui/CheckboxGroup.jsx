import { useId } from 'react';
import clsx from 'clsx';
import Checkbox from './Checkbox';

/**
 * CheckboxGroup — fieldset of related checkboxes with an optional "Pilih semua".
 *
 * @example
 * <CheckboxGroup label="Aksi tersedia" value={data.aksi} onChange={(v) => setData('aksi', v)}
 *   options={[{ value: 'Lihat', label: 'Lihat' }, { value: 'Tambah', label: 'Tambah' }]} selectAll />
 */
export default function CheckboxGroup({
    label,
    legend,
    options = [],
    value = [],
    onChange,
    orientation = 'vertical',
    selectAll = false,
    hint,
    error,
    disabled = false,
    id,
    className,
}) {
    const autoId = useId();
    const groupId = id ?? autoId;
    const enabled = options.filter((o) => !o.disabled);
    const allChecked = enabled.length > 0 && enabled.every((o) => value.includes(o.value));
    const someChecked = enabled.some((o) => value.includes(o.value));

    const toggle = (v, on) => {
        const next = on ? [...new Set([...value, v])] : value.filter((x) => x !== v);
        onChange?.(next);
    };

    return (
        <fieldset
            id={groupId}
            className={clsx('w-full', className)}
            aria-invalid={error ? true : undefined}
        >
            {(label || legend) && (
                <legend className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    {legend ?? label}
                </legend>
            )}
            {selectAll && (
                <div className="mb-2 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
                    <Checkbox
                        checked={allChecked}
                        indeterminate={!allChecked && someChecked}
                        onChange={(on) => onChange?.(on ? enabled.map((o) => o.value) : [])}
                        label="Pilih semua"
                        disabled={disabled}
                    />
                </div>
            )}
            <div
                className={clsx(
                    orientation === 'horizontal' ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2',
                )}
            >
                {options.map((o) => (
                    <Checkbox
                        key={String(o.value)}
                        checked={value.includes(o.value)}
                        onChange={(on) => toggle(o.value, on)}
                        label={o.label}
                        description={o.description}
                        disabled={disabled || o.disabled}
                    />
                ))}
            </div>
            {hint && (
                <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    {hint}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-1.5 text-[13px]" style={{ color: 'var(--color-danger)' }}>
                    {error}
                </p>
            )}
        </fieldset>
    );
}
