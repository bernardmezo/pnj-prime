export default function InputError({ message, className = '' }) {
    if (!message) return null;
    return (
        <p className={`text-[13px] ${className}`} style={{ color: 'var(--color-danger)' }}>
            {message}
        </p>
    );
}
