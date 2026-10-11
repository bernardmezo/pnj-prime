export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            type={type}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center rounded-full border bg-white px-6 py-2.5 text-sm font-semibold transition ` +
                `hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
            }
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
        >
            {children}
        </button>
    );
}
