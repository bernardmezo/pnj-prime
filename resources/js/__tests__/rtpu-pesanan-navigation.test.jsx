import { describe, expect, it, vi } from 'vitest';
import { isItemActive } from '../Layouts/DashboardLayout';
import { menuForRole, previewMenuForRole } from '../lib/roles';
import { href } from '../lib/nav';
import page from '../Pages/Pengelola/Pesanan/Index.jsx?raw';

describe('navigasi pesanan RTPU', () => {
    it('menautkan menu hanya ketika katalog diizinkan dan menandai menu aktif', () => {
        vi.stubGlobal('route', (name) => name ? `/named/${name}` : { has: () => true, current: () => false });
        const menu = menuForRole('admin_rtpu');
        const item = menu.find((entry) => entry.key === 'pesanan');
        expect(href(item.page)).toBe('/named/rtpu.pesanan.index');
        expect(menu.filter((entry) => isItemActive(entry, 'pesanan', '/rtpu/pesanan')).map((entry) => entry.key)).toEqual(['pesanan']);
        expect(previewMenuForRole('admin_rtpu', { admin_rtpu: { katalog: { Lihat: false } } }).some((entry) => entry.key === 'pesanan')).toBe(false);
        expect(page).toContain('route(pesananRoute, selected.id)');
        vi.unstubAllGlobals();
    });
});
