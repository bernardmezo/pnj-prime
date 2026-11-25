import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Show from '../Pages/Customer/Pengajuan/Show';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ children }) => <span>{children}</span>, router: {} }));
vi.mock('../Layouts/PublicLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
globalThis.route = () => '/test';

describe('pemilih jadwal pengganti', () => {
    it('menampilkan nilai jadwal lama dengan gaya input bersama', () => {
        const html = renderToStaticMarkup(<Show auth={{}} item={{ id: 1, code: 'P-1', type: 'ruangan', status: 'Lunas', layanan: 'Aula', reschedule_required: true, rental_start: '2030-01-07T09:00', rental_end: '2030-01-07T15:00' }} />);
        expect(html).toContain('value="2030-01-07T09:00"');
        expect(html).toContain('value="2030-01-07T15:00"');
        expect(html).toContain('focus:ring-[var(--color-accent)]');
    });
});
