import { Radio, RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import { useId } from 'react';
import clsx from 'clsx';
import Field, { useField } from './Field';

/**
 * RadioGroup — single choice with two looks: `list` (compact rows) and
 * `cards` (large selectable tiles with icon + title + description).
 *
 * @example
 * <RadioGroup variant="cards" value={data.tipe} onChange={(v) => setData('tipe', v)}
 *   options={[{ value: 'jasa', label: 'Jasa', description: 'Layanan profesional', icon: <Wrench /> }]} />
 */
export default function RadioGroup({
    label,
    name,
    value,
    onChange,
    options = [],
    variant = 'list',
    hint,
    error,
    disabled = false,
    id,
    className,
}) {
    const ctx = useField();
    const autoId = useId();
    const controlId = id ?? ctx?.id ?? autoId;
    const shownError = error ?? ctx?.error;
    const describedBy = ctx?.describedBy;
    const cards = variant === 'cards';

    const control = (
        <HeadlessRadioGroup
            id={controlId}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={describedBy}
            className={clsx(cards ? 'grid gap-3 sm:grid-cols-3' : 'flex flex-col gap-2', className)}
        >
            {options.map((opt) => (
                <Radio
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={({ focus, disabled: dis }) =>
                        clsx(
                            'group relative flex cursor-pointer border outline-none transition',
                            'border-[var(--color-border)] bg-[var(--color-bg)]',
                            'data-[checked]:border-[var(--color-accent)] data-[checked]:bg-[var(--color-accent-tint)]',
                            cards
                                ? 'flex-col items-start gap-2 rounded-2xl p-4'
                                : 'items-center gap-3 rounded-xl px-4 py-2.5',
                            focus && 'ring-2 ring-[var(--color-accent)] ring-offset-1',
                            dis && 'cursor-not-allowed opacity-60',
                        )
                    }
                >
                    {cards ? (
                        <>
                            {opt.icon && (
                                <span
                                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-accent-hover)' }}
                                >
                                    {opt.icon}
                                </span>
                            )}
                            <span className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                                {opt.label}
                            </span>
                            {opt.description && (
                                <span className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    {opt.description}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <span
                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <span
                                    className="hidden h-2 w-2 rounded-full group-data-[checked]:block"
                                    style={{ background: 'var(--color-accent)' }}
                                />
                            </span>
                            <span className="text-sm" style={{ color: 'var(--color-ink)' }}>
                                {opt.label}
                            </span>
                        </>
                    )}
                </Radio>
            ))}
        </HeadlessRadioGroup>
    );

    const wrapped =
        label != null || hint != null || error != null ? (
            <Field label={label} hint={hint} error={error} htmlFor={controlId} id={controlId}>
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
