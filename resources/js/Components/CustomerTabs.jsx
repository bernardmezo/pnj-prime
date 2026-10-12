import { href } from '@/lib/nav';

/** Small in-page tab row for Customer pages: Pengajuan Saya | Riwayat. */
export default function CustomerTabs({ active, role }) {
    const tabs = [
        { key: 'pengajuan', label: 'Pengajuan Saya', page: 'customer.pengajuan.index' },
        { key: 'riwayat', label: 'Riwayat', page: 'customer.riwayat' },
    ];
    return (
        <div className="mb-6 flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }} role="tablist">
            {tabs.map((t) => {
                const on = active === t.key;
                return (
                    <a
                        key={t.key}
                        href={href(t.page, {}, role)}
                        role="tab"
                        aria-selected={on}
                        className="relative px-4 py-2.5 text-sm font-semibold transition"
                        style={{ color: on ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                    >
                        {t.label}
                        {on && (
                            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                        )}
                    </a>
                );
            })}
        </div>
    );
}
