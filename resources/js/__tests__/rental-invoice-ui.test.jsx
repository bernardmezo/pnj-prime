import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import VerifikasiLayanan from '../Pages/Rtpu/Verifikasi/Layanan';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ children }) => <span>{children}</span>, router: {}, useForm: (data) => ({ data, errors: {}, setData: () => {} }) }));
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../Components/ReviewPanel', () => ({ default: () => null }));
vi.mock('../Components/ui', () => ({ Card: ({ children }) => <div>{children}</div>, EmptyState: () => null, FadeIn: ({ children }) => <div>{children}</div>, PageHeader: () => null, StatusBadge: () => null }));
globalThis.route = () => '/test';

describe('invoice sewa RTPU', () => {
    it('menampilkan snapshot pengajuan dan input pajak tanpa kontrol tarif manual', () => {
        const html = renderToStaticMarkup(<VerifikasiLayanan selected={{ id: 1, is_rental: true, type: 'ruangan', status: 'Menunggu Invoice', layanan: 'Aula', total: 2500000, qty: 2, rental_options: [{ id: 1, nama: 'Kursi', qty: 2, harga: 50000, satuan: 'per_unit', subtotal: 100000 }], product_detail: {} }} bluBanks={[{ id: 1, nama: 'BLU' }]} />);
        expect(html).toContain('Kursi');
        expect(html).toContain('2.500.000');
        expect(html).toContain('Pajak sewa (%)');
        expect(html).not.toContain('Harga barang per unit');
        expect(html).not.toContain('Tarif per satuan');
        expect(html).not.toContain('Pajak barang (%)');
    });
});
