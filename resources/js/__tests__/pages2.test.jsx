import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: { visit: vi.fn(), get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), reload: vi.fn() },
        useForm: (initial = {}) => ({
            data: initial,
            setData: vi.fn(),
            post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(),
            processing: false, errors: {}, reset: vi.fn(), recentlySuccessful: false,
        }),
        usePage: () => ({ props: { auth: { user: { id: 1, name: 'Test User', email: 't@t.id', role: 'customer' } } } }),
    };
});

import { render, screen } from '@testing-library/react';

const auth = { user: { id: 1, name: 'Siti Rahma', email: 'c@test.id', role: 'customer' } };
const authRtpU = { user: { id: 2, name: 'Budi Santoso', email: 'rtpu@test.id', role: 'admin_rtpu' } };

const product = {
    id: 5, name: 'Alat Uji Kualitas Air Portable', slug: 'alat-uji',
    final_price: 2450000, stock: 16, image: null,
    category: { name: 'Produk Fisik', slug: 'produk-fisik' },
    owner: { name: 'Dr. Andi' },
    short_description: 'Kit uji air jinjing.',
    description: 'Deskripsi lengkap alat uji.',
};

const pengajuan = {
    id: 1, code: 'PNJ-2026-0001', type: 'jasa', layanan: 'Uji Kuat Tekan Beton',
    customer: 'Siti Rahma', date: '2026-09-28', status: 'Diajukan',
    qty: '3 sampel', need: 'Syarat tender', tanggal: '2026-10-05', total: null, note: null,
    history: [{ from: null, status: 'Diajukan', at: '2026-09-28 09:12', note: null, by: null }],
};

const produk = {
    id: 31, code: 'PNJ-PU-0031', name: 'Kompor Biomassa', desc: 'Hemat energi',
    researcher: 'Dr. Andi', team: 'Mesin', category: 'Energi', price: 1850000,
    date: '2026-09-26', status: 'Diajukan', note: null,
    documents: [{ name: 'proposal.pdf', size: '1 MB', url: '/berkas/x' }],
    history: [],
};

const layanan = [
    { id: 101, code: 'PNJ-JSA-0101', type: 'jasa', name: 'Uji Kuat Tekan Beton', price: 350000, status: 'Aktif' },
];

const metode = [
    { id: 1, name: 'Mandiri BLU PNJ', type: 'Transfer Bank', account: '8899', holder: 'PNJ', instructions: 'Transfer.' },
];

function atLeast(text) {
    expect(screen.getAllByText(text).length).toBeGreaterThanOrEqual(1);
}

describe('remaining pages render with realistic controller props', () => {
    it('Catalog/Index landing renders hero + preview + about', async () => {
        const { default: Page } = await import('@/Pages/Catalog/Index.jsx');
        render(
            <Page
                auth={auth}
                categories={[{ id: 1, name: 'Jasa / Layanan', slug: 'jasa-layanan' }]}
                featured_products={[{ id: 5, name: product.name, slug: product.slug, final_price: 2450000, thumbnail: null, category: { name: 'Produk Fisik', slug: 'produk-fisik' } }]}
            />,
        );
        atLeast('Inovasi PNJ, kini siap dipakai siapa saja');
        atLeast('Katalog Pilihan');
        atLeast('Tentang RTPU PNJ');
    });

    it('Catalog/Show renders product + ajukan action', async () => {
        const { default: Page } = await import('@/Pages/Catalog/Show.jsx');
        render(<Page auth={auth} product={product} />);
        atLeast('Alat Uji Kualitas Air Portable');
        atLeast('Ajukan Layanan');
    });

    it('Auth/Register renders tabs + external form', async () => {
        const { default: Page } = await import('@/Pages/Auth/Register.jsx');
        render(<Page />);
        atLeast('Daftar');
        atLeast('Pengguna Eksternal');
    });

    it('Customer/Home renders greeting + grid + CTA', async () => {
        const { default: Page } = await import('@/Pages/Customer/Home.jsx');
        render(
            <Page
                auth={auth}
                featured_products={[{ id: 5, name: product.name, slug: product.slug, final_price: 2450000, thumbnail: null, category: { name: 'Produk Fisik', slug: 'produk-fisik' } }]}
                categories={[]}
            />,
        );
        atLeast('Mau pesan apa hari ini?');
        atLeast('Pilihan untuk Anda');
    });

    it('Customer/Pengajuan/Create renders wizard steps', async () => {
        const { default: Page } = await import('@/Pages/Customer/Pengajuan/Create.jsx');
        render(<Page auth={auth} layanan={layanan} selected={{}} />);
        atLeast('Ajukan Layanan');
    });

    it('Customer/Pengajuan/Edit renders prefilled form', async () => {
        const { default: Page } = await import('@/Pages/Customer/Pengajuan/Edit.jsx');
        render(<Page auth={auth} item={pengajuan} />);
        atLeast(/Ubah/);
    });

    it('Rtpu/Verifikasi/Pembayaran renders queue + panel', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/Verifikasi/Pembayaran.jsx');
        const row = { id: 21, code: 'PNJ-2026-0003', customer: 'Siti Rahma', layanan: 'Alat Uji', amount: 4900000, method: 'Mandiri', at: '2026-09-23', proof: '/berkas/x', status: 'Menunggu Verifikasi Pembayaran' };
        render(<Page auth={authRtpU} antrean={[row]} selected={row} />);
        atLeast('Verifikasi Pembayaran');
        atLeast('Panel peninjau');
    });

    it('Rtpu/Layanan/Index renders tabs + table', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/Layanan/Index.jsx');
        render(<Page auth={authRtpU} layanan={layanan} />);
        atLeast('Kelola Layanan');
        atLeast('Uji Kuat Tekan Beton');
    });

    it('Rtpu/Layanan/Form renders type fields', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/Layanan/Form.jsx');
        render(<Page auth={authRtpU} tipe="jasa" initial={null} />);
        atLeast(/Tambah Layanan/);
    });

    it('Rtpu/MetodePembayaran/Index renders methods', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/MetodePembayaran/Index.jsx');
        render(<Page auth={authRtpU} metode={metode} />);
        atLeast('Metode Pembayaran');
        atLeast('Mandiri BLU PNJ');
    });

    it('Rtpu/Riwayat renders table', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/Riwayat.jsx');
        render(<Page auth={authRtpU} riwayat={[pengajuan]} />);
        atLeast('Riwayat Transaksi');
    });

    it('P3M/ProdukUnggulan/Create renders form', async () => {
        const { default: Page } = await import('@/Pages/P3M/ProdukUnggulan/Create.jsx');
        render(<Page auth={auth} />);
        atLeast('Ajukan Produk Unggulan');
    });

    it('P3M/ProdukUnggulan/Edit renders prefilled form', async () => {
        const { default: Page } = await import('@/Pages/P3M/ProdukUnggulan/Edit.jsx');
        render(<Page auth={auth} item={produk} />);
        atLeast(/Ubah/);
    });

    it('P3M/Riwayat renders table', async () => {
        const { default: Page } = await import('@/Pages/P3M/Riwayat.jsx');
        render(<Page auth={auth} riwayat={[produk]} />);
        atLeast('Riwayat Produk Unggulan');
    });

    it('Pimpinan/Pemantauan renders read-only table', async () => {
        const { default: Page } = await import('@/Pages/Pimpinan/Pemantauan.jsx');
        render(<Page auth={auth} produk={[produk]} />);
        atLeast('Pemantauan');
    });

    it('Pimpinan/Riwayat renders table', async () => {
        const { default: Page } = await import('@/Pages/Pimpinan/Riwayat.jsx');
        render(<Page auth={auth} produk={[produk]} />);
        atLeast('Riwayat Produk Unggulan');
    });

    it('Direktur/Riwayat renders tabs', async () => {
        const { default: Page } = await import('@/Pages/Direktur/Riwayat.jsx');
        render(<Page auth={auth} produk={[produk]} layanan={[pengajuan]} />);
        atLeast('Produk Unggulan');
        atLeast('Transaksi Layanan');
    });

    it('Dashboard renders nothing (thin redirect)', async () => {
        const { default: Page } = await import('@/Pages/Dashboard.jsx');
        const { container } = render(<Page auth={auth} />);
        expect(container.textContent).toBe('');
    });
});
