import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CalendarMaster from '../Pages/Calendar/Master';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    router: {},
    useForm: () => ({ data: {}, errors: {} }),
}));
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

describe('kalender pengelola', () => {
    it('menampilkan jadwal pada setiap hari yang tercakup, termasuk saat mulai bulan sebelumnya', () => {
        const html = renderToStaticMarkup(<CalendarMaster month="2030-01-01" bookings={[
            { id: 1, code: 'RANGE-1', product: 'Aula', start: '2029-12-31 09:00', end: '2030-01-02 15:00', status: 'Diproses' },
        ]} />);
        expect(html.match(/Aula · RANGE-1/g)).toHaveLength(2);
    });

    it('tidak menampilkan jadwal pada hari berakhir tepat tengah malam', () => {
        const html = renderToStaticMarkup(<CalendarMaster month="2030-01-01" bookings={[
            { id: 1, code: 'RANGE-2', product: 'Aula', start: '2030-01-01 09:00', end: '2030-01-02 00:00', status: 'Diproses' },
        ]} />);
        expect(html.match(/Aula · RANGE-2/g)).toHaveLength(1);
    });
});
