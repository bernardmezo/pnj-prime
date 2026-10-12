export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={`h-4 w-4 rounded ${className}`}
            style={{ borderColor: 'var(--color-border)', accentColor: 'var(--color-accent)' }}
        />
    );
}
