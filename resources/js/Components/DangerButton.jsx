export default function DangerButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition duration-150 ` +
                `hover:bg-[var(--color-danger-hover)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
            }
            style={{ background: 'var(--color-danger)' }}
        >
            {children}
        </button>
    );
}
