import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: {
            visit: vi.fn(),
            get: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            reload: vi.fn(),
        },
        usePage: () => ({ props: {} }),
        useForm: (initial = {}) => ({
            data: initial,
            setData: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
            errors: {},
            processing: false,
            reset: vi.fn(),
        }),
    };
});

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HakAkses from '@/Pages/SuperAdmin/HakAkses.jsx';
import { router } from '@inertiajs/react';

const auth = { user: { id: 1, name: 'Root', email: 'root@test.id', role: 'super_admin' } };

const fitur = [
    { key: 'katalog', name: 'Katalog Layanan', grup: 'Layanan', urutan: 1, aksi_tersedia: ['Lihat', 'Tambah', 'Ubah'], active: true, locked: false },
    { key: 'verifikasi', name: 'Verifikasi Pengajuan', grup: 'Layanan', urutan: 2, aksi_tersedia: ['Lihat', 'Verifikasi'], active: true, locked: false },
    { key: 'pengguna', name: 'Manajemen Pengguna', grup: 'Administrasi', urutan: 3, aksi_tersedia: ['Lihat', 'Tambah'], active: true, locked: true },
];

const roleCounts = { customer: 3, admin_rtpu: 2, admin_p3m: 0, pimpinan_rtpu: 0, direktur: 0, super_admin: 1 };

const bawaan = {
    admin_rtpu: {
        katalog: { Lihat: true, Tambah: false, Ubah: false },
        verifikasi: { Lihat: true, Verifikasi: false },
        pengguna: { Lihat: false, Tambah: false },
    },
};

const defaultMatrix = () => ({
    admin_rtpu: {
        katalog: { Lihat: true, Tambah: false, Ubah: false },
        verifikasi: { Lihat: true, Verifikasi: false },
        pengguna: { Lihat: false, Tambah: false },
    },
    customer: {},
});

let routeSpy;

beforeEach(() => {
    routeSpy = vi.fn((name) => `/${name}`);
    routeSpy.current = () => false;
    routeSpy.has = () => true;
    vi.stubGlobal('route', routeSpy);
    router.post.mockClear();
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const renderPage = (overrides = {}) =>
    render(
        <HakAkses
            auth={auth}
            fitur={fitur}
            matriks={defaultMatrix()}
            roleCounts={roleCounts}
            bawaan={bawaan}
            {...overrides}
        />,
    );

const lihat = (roleLabel = 'Admin RTPU') => screen.getByRole('checkbox', { name: `Katalog Layanan: Lihat untuk ${roleLabel}` });
const toggler = (roleLabel = 'Admin RTPU') => screen.getByRole('checkbox', { name: `Katalog Layanan: Ubah untuk ${roleLabel}` });

describe('Hak Akses matrix', () => {
    it('renders role list with user counts and a live menu preview', () => {
        renderPage();

        expect(screen.getAllByText('Hak Akses').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('2 pengguna')).toBeInTheDocument();

        const preview = screen.getByTestId('menu-preview');
        expect(within(preview).getByText('Kelola Layanan')).toBeInTheDocument();
        expect(within(preview).getByText('Verifikasi Pengajuan')).toBeInTheDocument();
        // A fitur with no Lihat permission never yields a menu item.
        expect(within(preview).queryByText('Kelola User')).not.toBeInTheDocument();
    });

    it('renders an em dash for actions a fitur does not expose', () => {
        renderPage();
        const row = screen.getByRole('checkbox', { name: 'Katalog Layanan: Tambah untuk Admin RTPU' }).closest('tr');
        // Katalog exposes Lihat/Tambah/Ubah only — Hapus & Verifikasi are "—".
        expect(within(row).getByTitle(/Aksi Hapus tidak tersedia/i)).toBeInTheDocument();
        expect(within(row).getByTitle(/Aksi Verifikasi tidak tersedia/i)).toBeInTheDocument();
    });

    it('auto-enables Lihat when a dependent action is switched on', async () => {
        const user = userEvent.setup();
        renderPage({ matriks: { admin_rtpu: { katalog: { Lihat: false, Tambah: false, Ubah: false } } } });

        expect(lihat()).not.toBeChecked();
        await user.click(toggler());

        expect(toggler()).toBeChecked();
        expect(lihat()).toBeChecked();
        expect(screen.getByText(/otomatis diaktifkan/i)).toBeInTheDocument();
    });

    it('unticks dependent actions when Lihat is switched off', async () => {
        const user = userEvent.setup();
        renderPage({
            matriks: { admin_rtpu: { katalog: { Lihat: true, Tambah: true, Ubah: true } } },
        });

        await user.click(lihat());

        expect(screen.getByRole('checkbox', { name: 'Katalog Layanan: Tambah untuk Admin RTPU' })).not.toBeChecked();
        expect(screen.getByText(/otomatis dinonaktifkan/i)).toBeInTheDocument();
    });

    it('shows indeterminate state on row, column and group toggles', () => {
        renderPage();

        expect(screen.getByRole('checkbox', { name: 'Pilih semua aksi Katalog Layanan' }))
            .toHaveAttribute('aria-checked', 'mixed');
        expect(screen.getByRole('checkbox', { name: 'Pilih semua aksi Lihat untuk Admin RTPU' }))
            .toHaveAttribute('aria-checked', 'mixed');
        expect(screen.getByRole('checkbox', { name: 'Pilih semua pada grup Layanan' }))
            .toHaveAttribute('aria-checked', 'mixed');
    });

    it('applies a preset only after the confirmation dialog', async () => {
        const user = userEvent.setup();
        renderPage();

        expect(toggler()).not.toBeChecked();
        await user.click(screen.getByRole('button', { name: 'Aktifkan semua' }));

        expect(screen.getByRole('button', { name: 'Terapkan' })).toBeInTheDocument();
        // The dialog is modal, so the underlying cells are aria-hidden; read the
        // raw label to prove nothing has been applied yet.
        expect(screen.getByLabelText('Katalog Layanan: Ubah untuk Admin RTPU')).not.toBeChecked();

        await user.click(screen.getByRole('button', { name: 'Terapkan' }));
        expect(screen.getByRole('checkbox', { name: 'Katalog Layanan: Tambah untuk Admin RTPU' })).toBeChecked();
        expect(toggler()).toBeChecked();
    });

    it('updates the live menu preview from unsaved matrix state', async () => {
        const user = userEvent.setup();
        renderPage({
            matriks: {
                admin_rtpu: {
                    katalog: { Lihat: true, Tambah: false, Ubah: false },
                    verifikasi: { Lihat: false, Verifikasi: false },
                },
            },
        });

        expect(within(screen.getByTestId('menu-preview')).queryByText('Verifikasi Pengajuan')).not.toBeInTheDocument();

        await user.click(screen.getByRole('checkbox', { name: 'Verifikasi Pengajuan: Lihat untuk Admin RTPU' }));

        expect(within(screen.getByTestId('menu-preview')).getByText('Verifikasi Pengajuan')).toBeInTheDocument();
    });

    it('shows a sticky unsaved bar and reverts on Batalkan', async () => {
        const user = userEvent.setup();
        renderPage();

        expect(screen.queryByTestId('unsaved-bar')).not.toBeInTheDocument();

        await user.click(toggler());
        expect(screen.getByTestId('unsaved-bar')).toHaveTextContent(/perubahan belum disimpan/i);

        await user.click(screen.getByRole('button', { name: 'Batalkan' }));
        expect(screen.queryByTestId('unsaved-bar')).not.toBeInTheDocument();
        expect(toggler()).not.toBeChecked();
    });

    it('opens a review modal and posts only the changed cells', async () => {
        const user = userEvent.setup();
        renderPage({ matriks: { admin_rtpu: { katalog: { Lihat: false, Tambah: false, Ubah: false } } } });

        await user.click(toggler());
        await user.click(screen.getByRole('button', { name: 'Simpan' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/Tinjau perubahan hak akses/i)).toBeInTheDocument();

        await user.click(within(dialog).getByRole('button', { name: 'Simpan perubahan' }));

        expect(router.post).toHaveBeenCalledTimes(1);
        const [url, payload] = router.post.mock.calls[0];
        expect(url).toBe('/superadmin.hakakses.save');
        // Only changed cells are sent, filtered to aksi_tersedia, super_admin excluded.
        expect(payload.matriks.admin_rtpu.katalog).toEqual({ Lihat: true, Ubah: true });
        expect(payload.matriks.super_admin).toBeUndefined();
        expect(payload.matriks.admin_rtpu.verifikasi).toBeUndefined();
    });

    it('locks Super Admin: cells show full access, are disabled, and presets are hidden', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('radio', { name: /Super Admin/ }));

        const cell = screen.getByRole('checkbox', { name: 'Katalog Layanan: Lihat untuk Super Admin' });
        expect(cell).toBeChecked();
        expect(cell).toHaveAttribute('data-disabled');

        expect(screen.queryByRole('button', { name: 'Aktifkan semua' })).not.toBeInTheDocument();

        const preview = screen.getByTestId('menu-preview');
        expect(within(preview).getByText('Kelola User')).toBeInTheDocument();
        expect(within(preview).getByText('Hak Akses')).toBeInTheDocument();
    });

    it('drives the same matrix from the mobile per-fitur switches', async () => {
        const user = userEvent.setup();
        renderPage({ matriks: { admin_rtpu: { katalog: { Lihat: false, Tambah: false, Ubah: false } } } });

        await user.click(screen.getByRole('button', { name: 'Katalog Layanan' }));
        const sw = screen.getByRole('switch', { name: 'Katalog Layanan: Ubah' });
        await user.click(sw);

        expect(sw).toBeChecked();
        expect(lihat()).toBeChecked();
    });
});
