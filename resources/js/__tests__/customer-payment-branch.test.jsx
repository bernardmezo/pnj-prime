import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Pembayaran from '../Pages/Customer/Pembayaran';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ children }) => <span>{children}</span>, router: {}, useForm: (data) => ({ data, errors: {}, setData: () => {}, post: () => {} }) }));
vi.mock('../Layouts/PublicLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
globalThis.route = () => '/test';

const render = (props) => renderToStaticMarkup(<Pembayaran item={{ id: 1, code: 'P1', status: 'Menunggu Pembayaran', ...props.item }} {...props} />);

describe('kanal pembayaran customer', () => {
    it('tidak menawarkan Midtrans untuk jasa meskipun prop manual backend belum tersedia', () => {
        const html = render({ item: { id: 1, code: 'P1', type: 'jasa', status: 'Menunggu Pembayaran' } });
        expect(html).not.toContain('Bayar sekarang');
        expect(html).toContain('Invoice resmi belum diterbitkan');
    });
    it('menampilkan bukti manual sewa sesuai tipe aktual', () => {
        const html = render({ item: { id: 1, code: 'P1', type: 'ruangan', status: 'Menunggu Pembayaran' }, manualPreorder: true, manualInvoice: { status: 'issued', due_at: '2026-12-01', total: 1000, bank_snapshot: { id: 1, name: 'BLU', account: '123', holder: 'PNJ' } } });
        expect(html).toContain('Pembayaran sewa');
        expect(html).toContain('Kirim bukti transfer sewa');
        expect(html).not.toContain('Bayar sekarang');
    });
    it('tidak menawarkan pembayaran ulang pada status Lunas', () => {
        const html = render({ item: { id: 1, code: 'P1', type: 'produk', status: 'Lunas' } });
        expect(html).toContain('Lunas');
        expect(html).not.toContain('Bayar sekarang');
    });
});
