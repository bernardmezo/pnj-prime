import clsx from 'clsx';
import { useState } from 'react';

/**
 * Tabs — pill tabs dengan tab aktif yang menggunakan skew tipis pada wadah,
 * sedangkan teks di dalamnya diberi skew kebalikan agar tetap tegak dan terbaca.
 *
 * Props:
 *   tabs         Array of { label, content } atau array label sederhana.
 *   defaultIndex Indeks tab awal.
 *   onChange     Callback saat tab berubah (index).
 *   children     Opsional. Bisa array node per tab atau function(index) => node.
 */
export default function Tabs({ tabs = [], defaultIndex = 0, onChange, children }) {
    const [active, setActive] = useState(defaultIndex);

    const handle = (i) => {
        setActive(i);
        if (onChange) onChange(i);
    };

    const renderPanel = () => {
        if (typeof children === 'function') return children(active);
        if (Array.isArray(children)) return children[active] ?? null;
        return children ?? tabs[active]?.content ?? null;
    };

    return (
        <div className="w-full">
            <div
                className="flex gap-1 rounded-full border p-1"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
                {tabs.map((t, i) => {
                    const isActive = i === active;
                    const label = typeof t === 'string' ? t : t.label;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handle(i)}
                            className={clsx(
                                'relative flex-1 px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
                                isActive
                                    ? 'skew-x-[-6deg] rounded-xl text-white'
                                    : 'rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]',
                            )}
                            style={isActive ? { background: 'var(--color-accent)' } : undefined}
                        >
                            <span className={clsx('block', isActive && 'skew-x-[6deg]')}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
            {renderPanel() && (
                <div className="mt-4">{renderPanel()}</div>
            )}
        </div>
    );
}
