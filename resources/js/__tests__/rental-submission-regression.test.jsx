import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Create from '../Pages/Customer/Pengajuan/Create';

const mocks = vi.hoisted(() => ({ post: vi.fn(), errors: {} }));
vi.mock('@inertiajs/react', () => ({
    Head: () => null, Link: ({ children }) => <span>{children}</span>,
    router: { post: mocks.post, visit: vi.fn() }, usePage: () => ({ props: { errors: mocks.errors } }),
    useForm: (initial) => {
        const [data, update] = useState(initial);
        return { data, setData: (key, value) => update((prev) => typeof key === 'function' ? key(prev) : { ...prev, [key]: value }), processing: false, errors: {}, reset: vi.fn() };
    },
}));
vi.mock('../Layouts/PublicLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../lib/useOpsiQuote', () => ({ useOpsiQuote: () => ({ quote: null }) }));
vi.mock('../lib/usePengajuanDraft', () => ({ usePengajuanDraft: () => ({ restoreDraft: () => null, clearDraft: vi.fn() }) }));
globalThis.route = (name) => `/test/${name}`;
beforeEach(() => { mocks.errors = {}; vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ conflict: false }) }))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const selected = { product_id: 1, tipe: 'ruangan', name: 'Aula', satuan: 'per_jam' };
it('shows server validation including nested renter errors and keeps entered data', () => {
    mocks.errors = { 'renter_data.ktp_number': 'NIK harus 16 karakter.', rental_start: 'Waktu mulai wajib diisi.' };
    render(<Create auth={{}} selected={selected} />);
    fireEvent.change(screen.getByLabelText('Nama Instansi / Perorangan'), { target: { value: 'Test' } });
    expect(screen.getByText('NIK harus 16 karakter.')).toBeTruthy();
    expect(screen.getByText(/Waktu mulai wajib diisi/)).toBeTruthy();
    expect(screen.getByLabelText('Nama Instansi / Perorangan').value).toBe('Test');
});
it('submits the hourly rental schedule and renter data', () => {
    render(<Create auth={{}} selected={selected} />);
    fireEvent.change(screen.getByLabelText('Tanggal Pemakaian'), { target: { value: '2030-01-07' } });
    fireEvent.change(screen.getByLabelText('Jam Mulai'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Durasi sewa (jam)'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Nama Instansi / Perorangan'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Pengajuan' }));
    expect(mocks.post).toHaveBeenCalledWith('/test/customer.pengajuan.store', expect.objectContaining({ rental_start: '2030-01-07T09:00', rental_end: '2030-01-07T11:00', renter_data: expect.objectContaining({ company_name: 'Test' }) }), expect.any(Object));
});
