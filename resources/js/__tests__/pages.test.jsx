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

const pengajuan = {
    id: 1, code: 'PNJ-2026-0001', type: 'jasa', layanan: 'Uji Kuat Tekan Beton',
    customer: 'Siti Rahma', date: '2026-09-28', status: 'Diajukan',
    qty: '3 sampel', need: 'Syarat tender', total: null, note: null,
    history: [{ from: null, status: 'Diajukan', at: '2026-09-28 09:12', note: null, by: null }],
};

const produk = {
    id: 31, code: 'PNJ-PU-0031', name: 'Kompor Biomassa', desc: 'Hemat energi',
    researcher: 'Dr. Andi', team: 'Mesin', category: 'Energi', price: 1850000,
    date: '2026-09-26', status: 'Diajukan', note: null,
    documents: [{ name: 'proposal.pdf', size: '1 MB', url: '/berkas/x' }],
    history: [],
};

describe('pages render with realistic controller props', () => {
    it('Customer/Pengajuan/Index shows heading + rows', async () => {
        const { default: Page } = await import('@/Pages/Customer/Pengajuan/Index.jsx');
        render(<Page auth={auth} pengajuan={[pengajuan]} />);
        expect(screen.getAllByText('Pengajuan Saya').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Uji Kuat Tekan Beton')).toBeInTheDocument();
    });

    it('Customer/Pengajuan/Show shows timeline + actions', async () => {
        const { default: Page } = await import('@/Pages/Customer/Pengajuan/Show.jsx');
        render(<Page auth={auth} item={pengajuan} />);
        expect(screen.getByText('Uji Kuat Tekan Beton')).toBeInTheDocument();
        expect(screen.getByText('Ubah')).toBeInTheDocument();
        expect(screen.getByText('Batalkan')).toBeInTheDocument();
    });

    it('Customer/Pembayaran shows bill + methods', async () => {
        const { default: Page } = await import('@/Pages/Customer/Pembayaran.jsx');
        render(
            <Page
                auth={auth}
                item={{ ...pengajuan, status: 'Menunggu Pembayaran', total: 2220000 }}
                tagihan={{ subtotal: 2000000, ppn: 220000, total: 2220000 }}
                metode={[{ id: 1, name: 'Mandiri BLU PNJ', type: 'Transfer Bank', account: '8899', holder: 'PNJ', instructions: 'Transfer.' }]}
            />,
        );
        expect(screen.getByText('Cara membayar')).toBeInTheDocument();
        expect(screen.getByText('Mandiri BLU PNJ')).toBeInTheDocument();
    });

    it('Customer/Riwayat shows closed items', async () => {
        const { default: Page } = await import('@/Pages/Customer/Riwayat.jsx');
        render(<Page auth={auth} riwayat={[{ ...pengajuan, status: 'Selesai' }]} />);
        expect(screen.getByText('Riwayat Transaksi Layanan')).toBeInTheDocument();
    });

    it('Rtpu/Verifikasi/Layanan shows queue + review panel', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/Verifikasi/Layanan.jsx');
        render(<Page auth={authRtpU} antrean={[pengajuan]} selected={pengajuan} />);
        expect(screen.getByText('Verifikasi Pengajuan Layanan')).toBeInTheDocument();
        expect(screen.getByText('Panel peninjau')).toBeInTheDocument();
    });

    it('Rtpu/StatusLayanan shows list + stepper area', async () => {
        const { default: Page } = await import('@/Pages/Rtpu/StatusLayanan.jsx');
        render(<Page auth={authRtpU} daftar={[{ ...pengajuan, status: 'Diproses' }]} />);
        expect(screen.getByText('Perbarui Status Layanan')).toBeInTheDocument();
    });

    it('P3M index + show render', async () => {
        const Index = (await import('@/Pages/P3M/ProdukUnggulan/Index.jsx')).default;
        const { unmount } = render(<Index auth={auth} daftar={[produk]} />);
        expect(screen.getAllByText('Pemantauan Produk Unggulan').length).toBeGreaterThanOrEqual(1);
        unmount();
        const Show = (await import('@/Pages/P3M/ProdukUnggulan/Show.jsx')).default;
        render(<Show auth={auth} item={produk} />);
        expect(screen.getByText('Kompor Biomassa')).toBeInTheDocument();
    });

    it('Pimpinan/Verifikasi shows queue + documents', async () => {
        const { default: Page } = await import('@/Pages/Pimpinan/Verifikasi.jsx');
        render(<Page auth={auth} antrean={[produk]} selected={produk} />);
        expect(screen.getAllByText('Verifikasi Produk Unggulan').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('proposal.pdf')).toBeInTheDocument();
    });

    it('Direktur/Pemantauan shows tabs', async () => {
        const { default: Page } = await import('@/Pages/Direktur/Pemantauan.jsx');
        render(<Page auth={auth} produk={[produk]} layanan={[pengajuan]} />);
        expect(screen.getByText('Produk Unggulan')).toBeInTheDocument();
        expect(screen.getByText('Layanan')).toBeInTheDocument();
    });

    it('SuperAdmin Users + HakAkses + Fitur render', async () => {
        const Users = (await import('@/Pages/SuperAdmin/Users/Index.jsx')).default;
        const { unmount } = render(
            <Users auth={auth} users={[{ id: 1, name: 'Siti', email: 'c@t.id', role: 'customer', status: 'Aktif' }]} />,
        );
        expect(screen.getAllByText('Kelola User').length).toBeGreaterThanOrEqual(1);
        unmount();
        const Hak = (await import('@/Pages/SuperAdmin/HakAkses.jsx')).default;
        const { unmount: unmount2 } = render(
            <Hak auth={auth} fitur={[{ key: 'katalog', name: 'Katalog Layanan' }]} matriks={{ customer: { katalog: { Lihat: true } } }} />,
        );
        expect(screen.getAllByText('Hak Akses').length).toBeGreaterThanOrEqual(1);
        unmount2();
        const Fitur = (await import('@/Pages/SuperAdmin/Fitur/Index.jsx')).default;
        render(<Fitur auth={auth} fitur={[{ key: 'katalog', name: 'Katalog Layanan', desc: 'x', active: true }]} />);
        expect(screen.getAllByText('Kelola Fitur').length).toBeGreaterThanOrEqual(1);
    });

    it('Auth/Login renders tabs + SSO + form', async () => {
        const { default: Page } = await import('@/Pages/Auth/Login.jsx');
        render(<Page status={null} canResetPassword={false} />);
        expect(screen.getByText('Masuk dengan SSO PNJ')).toBeInTheDocument();
        expect(screen.getByLabelText('Alamat email')).toBeInTheDocument();
    });

    it('Catalog/Browse renders header + filters', async () => {
        const { default: Page } = await import('@/Pages/Catalog/Browse.jsx');
        render(
            <Page
                auth={auth}
                products={{ data: [], total: 0 }}
                categories={[{ id: 1, name: 'Jasa / Layanan', slug: 'jasa-layanan' }]}
                filters={{}}
            />,
        );
        expect(screen.getByText('Jelajahi seluruh katalog')).toBeInTheDocument();
    });
});
