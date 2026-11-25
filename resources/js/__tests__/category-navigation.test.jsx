import { afterEach, expect, it, vi } from 'vitest';
import { href } from '../lib/nav';
import { menuForRole } from '../lib/roles';

afterEach(() => vi.unstubAllGlobals());

it('resolves the super admin category menu to its registered route', () => {
    const route = vi.fn((name) => name ? '/superadmin/kategori' : { has: (key) => key === 'superadmin.kategori.index' });
    vi.stubGlobal('route', route);
    const item = menuForRole('super_admin').find((entry) => entry.key === 'kategori');

    expect(item).toBeDefined();
    expect(href(item.page)).toBe('/superadmin/kategori');
    expect(route).toHaveBeenCalledWith('superadmin.kategori.index', {});
});
