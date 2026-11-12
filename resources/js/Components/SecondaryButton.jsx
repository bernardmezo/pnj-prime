export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            type={type}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition duration-150 ` +
                `hover:bg-[var(--color-accent-tint)] hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
            }
        >
            {children}
        </button>
    );
}
