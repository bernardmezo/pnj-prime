import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MENUS, ROLE_KEYS, roleLabel } from '@/lib/roles';
import { DESTINATIONS } from '@/lib/nav';
import { mockAuth, propsFor } from '@/mocks/data';

// PNJ-DEV-HARNESS: dev-only preview host. Never imported in production
// builds (vite strips this module via the strip-dev-preview plugin).

const CUSTOMER_PAGES = [
    { key: 'pengajuan', label: 'Pengajuan Saya', page: 'customer.pengajuan.index' },
    { key: 'ajukan', label: 'Ajukan Layanan', page: 'customer.pengajuan.create' },
    { key: 'detail', label: 'Detail Pengajuan', page: 'customer.pengajuan.show' },
    { key: 'ubah', label: 'Ubah Pengajuan', page: 'customer.pengajuan.edit' },
    { key: 'bayar', label: 'Pembayaran', page: 'customer.bayar' },
    { key: 'riwayat', label: 'Riwayat', page: 'customer.riwayat' },
];

const modules = import.meta.glob('../Pages/**/*.jsx');

function pagesFor(role) {
    if (role === 'customer') {
        return [
            ...CUSTOMER_PAGES,
            { key: 'landing', label: 'Beranda (butuh auth prop)', page: 'landing' },
        ];
    }
    return (MENUS[role] ?? []).map((m) => ({ key: m.key, label: m.label, page: m.page }));
}

function PreviewApp() {
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const [role, setRole] = useState(params.get('role') || 'customer');
    const [pageKey, setPageKey] = useState(params.get('preview') || pagesFor(params.get('role') || 'customer')[0]?.page || 'landing');
    const [Comp, setComp] = useState(null);

    const open = (r, p) => {
        const q = new URLSearchParams({ preview: p, role: r });
        window.location.search = q.toString();
    };

    useEffect(() => {
        const dest = DESTINATIONS[pageKey];
        const path = dest?.component ? `../Pages/${dest.component}.jsx` : null;
        const loader = path ? modules[path] : null;
        if (loader) {
            loader().then((m) => setComp(() => m.default));
        } else {
            setComp(() => () => null);
        }
    }, [pageKey]);

    const pages = pagesFor(role);
    const props = propsFor(pageKey, role);

    return (
        <div>
            <div
                className="sticky top-0 z-[100] flex flex-wrap items-center gap-2 px-4 py-2 text-xs"
                style={{ background: 'var(--color-ink)', color: '#fff' }}
            >
                <strong className="mr-1">PRATINJAU DEV</strong>
                <label>
                    Peran:{' '}
                    <select
                        value={role}
                        onChange={(e) => open(e.target.value, pagesFor(e.target.value)[0]?.page)}
                        style={{ color: '#000' }}
                    >
                        {ROLE_KEYS.map((k) => (
                            <option key={k} value={k}>{roleLabel(k)}</option>
                        ))}
                    </select>
                </label>
                <span style={{ opacity: 0.5 }}>|</span>
                {pages.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => open(role, p.page)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: p.page === pageKey ? 'var(--color-accent)' : 'transparent',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.3)',
                        }}
                    >
                        {p.label}
                    </button>
                ))}
                <span style={{ opacity: 0.6, marginLeft: 'auto' }}>{pageKey} · tanpa auth</span>
            </div>
            {Comp ? <Comp {...props} /> : <p style={{ padding: 24 }}>Memuat…</p>}
        </div>
    );
}

export function mountPreview(el) {
    createRoot(el).render(<PreviewApp />);
}
