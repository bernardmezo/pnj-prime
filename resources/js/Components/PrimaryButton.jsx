export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition ` +
                `hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
            }
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; }}
        >
            {children}
        </button>
    );
}
