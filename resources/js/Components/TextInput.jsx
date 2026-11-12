import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
            onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-tint)';
            }}
            onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            className={
                'rounded-xl border px-4 py-2.5 text-sm shadow-none outline-none transition duration-150 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ' +
                'disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-muted)] disabled:border-[var(--color-border)] ' +
                className
            }
            ref={localRef}
        />
    );
});
