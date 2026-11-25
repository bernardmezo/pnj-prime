import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Pembayaran from '../Pages/Rtpu/Verifikasi/Pembayaran';

vi.mock('@inertiajs/react', () => ({ Head: () => null, Link: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>, router: {} }));
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../Components/ReviewPanel', () => ({ default: () => <div>Panel peninjau</div> }));
vi.mock('../Components/ui', () => ({ Card: ({ children }) => <section>{children}</section>, EmptyState: () => null, FadeIn: ({ children }) => <div>{children}</div>, PageHeader: () => null, StatusBadge: () => null }));
globalThis.route = (name, params) => name === 'rtpu.verify.bayar' ? `/pembayaran${params?.id ? `?id=${params.id}` : ''}` : '/action';

const row = { id: '42', db_id: 42, code: 'ORD-42', status: 'Menunggu Verifikasi Pembayaran', amount: 100000, customer: 'Pembeli', method: 'Transfer', can_verify: true, proof: '/proof' };

describe('halaman verifikasi pembayaran RTPU', () => {
    it('menautkan antrean ke detail tanpa membuka dialog', () => {
        const html = renderToStaticMarkup(<Pembayaran antrean={[row]} />);
        expect(html).toContain('href="/pembayaran?id=42"');
        expect(html).not.toContain('aria-haspopup="dialog"');
        expect(html).not.toContain('Panel peninjau');
    });
    it('menampilkan detail manual dan tautan kembali pada halaman terpilih', () => {
        const html = renderToStaticMarkup(<Pembayaran antrean={[row]} selected={row} />);
        expect(html).toContain('Panel peninjau');
        expect(html).toContain('href="/proof"');
        expect(html).toContain('Kembali ke antrean');
        expect(html).not.toContain('Antrean Pembayaran (1)');
    });
    it('menampilkan informasi Midtrans tanpa tindakan verifikasi manual', () => {
        const html = renderToStaticMarkup(<Pembayaran selected={{ ...row, is_midtrans: true, raw_status: 'pending' }} />);
        expect(html).toContain('Menunggu konfirmasi pembayaran dari Midtrans');
        expect(html).not.toContain('Panel peninjau');
    });
});
