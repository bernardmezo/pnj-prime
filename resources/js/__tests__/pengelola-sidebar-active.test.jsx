import { afterEach, describe, expect, it, vi } from 'vitest';
import { isItemActive } from '../Layouts/DashboardLayout';
import { menuForRole } from '../lib/roles';
import productIndex from '../Pages/Pengelola/Produk/Index.jsx?raw';
import productForm from '../Pages/Pengelola/Produk/Form.jsx?raw';

afterEach(() => vi.unstubAllGlobals());

describe.each(['admin_pengelola', 'admin_jurusan'])('%s sidebar', (role) => {
    const menu = menuForRole(role);
    const active = (key, url) => menu.filter((item) => isItemActive(item, key, url)).map((item) => item.key);

    it('highlights only Kelola Produk on the product list and forms', () => {
        vi.stubGlobal('route', () => ({ has: () => true, current: (pattern) => pattern === 'pengelola.*' }));
        for (const url of ['/pengelola/produk', '/pengelola/produk/create', '/pengelola/produk/42/edit?tab=detail']) {
            expect(active('produk', url)).toEqual(['produk']);
        }
    });

    it('highlights only Pesanan on its page', () => {
        vi.stubGlobal('route', () => ({ has: () => true, current: (pattern) => pattern === 'pengelola.*' }));
        expect(active('pesanan', '/pengelola/pesanan')).toEqual(['pesanan']);
    });
});

it('assigns product pages to the product menu', () => {
    expect(productIndex).toContain('activeKey="produk"');
    expect(productForm).toContain('activeKey="produk"');
});
