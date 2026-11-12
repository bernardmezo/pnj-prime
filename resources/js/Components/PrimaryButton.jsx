export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition duration-150 ` +
                `hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
            }
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
        >
            {children}
        </button>
    );
}
