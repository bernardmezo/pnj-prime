import { toneForStatus } from '@/lib/statuses';

const DOT = {
    teal: 'var(--color-accent)',
    gold: 'var(--color-gold)',
    danger: 'var(--color-danger)',
    muted: 'var(--color-muted)',
};

/**
 * Vertical timeline rail: dot + connecting line.
 * Teal line/dots for done steps, --color-border for pending.
 * history: [{ status, at, note, by }]. doneThrough: index in flow, or -1.
 */
export default function StatusTimeline({ flow = [], history = [], current }) {
    const idx = flow.indexOf(current);
    return (
        <ol className="relative ml-2 border-l pl-6" style={{ borderColor: 'var(--color-border)' }}>
            {flow.map((s, i) => {
                const done = idx >= 0 ? i <= idx : false;
                const h = history.find((x) => x.status === s);
                return (
                    <li key={s} className="relative pb-6 last:pb-0">
                        <span
                            aria-hidden
                            className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2"
                            style={{
                                borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
                                background: done ? 'var(--color-accent)' : 'var(--color-bg)',
                            }}
                        />
                        <p className="text-sm font-semibold" style={{ color: done ? 'var(--color-ink)' : 'var(--color-muted)' }}>
                            {s}
                        </p>
                        {h && (
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                                {h.at}{h.by ? ` · ${h.by}` : ''}
                            </p>
                        )}
                        {h?.note && (
                            <p className="mt-1 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                {h.note}
                            </p>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

export function statusDotStyle(status) {
    return { background: DOT[toneForStatus(status)] ?? DOT.muted };
}
