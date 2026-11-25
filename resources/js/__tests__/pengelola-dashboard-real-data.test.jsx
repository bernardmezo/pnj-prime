import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../Pages/Pengelola/Dashboard';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ children }) => <span>{children}</span> }));
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
globalThis.route = (name) => name;

describe('dashboard pengelola', () => {
    it('menampilkan jumlah draft dan ditolak serta tidak mengarang status akun', () => {
        const html = renderToStaticMarkup(<Dashboard auth={{ user: { name: 'A', jurusan: null } }} stats={{ total: 7, draft: 2, rejected: 3 }} recentProducts={[]} />);
        expect(html).toContain('Draft');
        expect(html).toContain('Ditolak');
        expect(html).toContain('>2<');
        expect(html).toContain('>3<');
        expect(html).not.toContain('Aktif &amp; Terverifikasi');
        expect(html).not.toContain('Pengelola PNJ');
    });

    it('tidak menyebut status kurasi yang tidak dikenal sebagai draft', () => {
        const html = renderToStaticMarkup(<Dashboard auth={{ user: {} }} stats={{}} recentProducts={[{ id: 1, name: 'Produk', curation_status: 'negotiation', base_price: 0 }]} />);
        expect(html).toContain('negotiation');
    });
});
