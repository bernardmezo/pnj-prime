import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Index from '../Pages/Pengelola/Produk/Index';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ href, children }) => <a href={href}>{children}</a>, router: {} }));
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../Components/ConfirmDialog', () => ({ useConfirm: () => ({ ConfirmUI: null }) }));
vi.mock('../Components/ui', () => ({
    Card: ({ children }) => <article>{children}</article>, EmptyState: () => null,
    FadeIn: ({ children }) => <>{children}</>, PageHeader: () => null,
    StatusBadge: ({ label }) => <span>{label}</span>, PrimaryButton: () => null,
}));

globalThis.route = (name, id) => `${name}/${id}`;

describe('edit produk berdasarkan status kurasi', () => {
    it('menampilkan Ubah untuk draft, ditolak, dan disetujui', () => {
        const statuses = ['draft', 'rejected', 'pending', 'verified', 'perlu_revisi_harga', 'counter_offer', 'approved', 'unknown'];
        const html = renderToStaticMarkup(<Index products={statuses.map((status, id) => ({ id, name: status, curation_status: status }))} />);
        expect(html).toContain('pengelola.produk.edit/0');
        expect(html).toContain('pengelola.produk.edit/1');
        expect(html).toContain('pengelola.produk.edit/6');
        for (const id of [2, 3, 4, 5, 7]) expect(html).not.toContain(`pengelola.produk.edit/${id}`);
    });
});
