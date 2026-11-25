import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Create from '../Pages/Customer/Pengajuan/Create';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@inertiajs/react', () => ({
    Head: () => null, Link: ({ children }) => <span>{children}</span>,
    router: { post: mocks.post, visit: vi.fn() }, usePage: () => ({ props: { errors: {} } }),
    useForm: (initial) => {
        const [data, update] = useState(initial);
        const [errors, setError] = useState({});
        return { data, setData: (key, value) => update((prev) => typeof key === 'function' ? key(prev) : { ...prev, [key]: value }), errors, setError: (value) => setError(value), clearErrors: () => setError({}), processing: false, reset: vi.fn() };
    },
}));
vi.mock('../Layouts/PublicLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../lib/useOpsiQuote', () => ({ useOpsiQuote: () => ({ quote: null }) }));
vi.mock('../lib/usePengajuanDraft', () => ({ usePengajuanDraft: () => ({ restoreDraft: () => null, clearDraft: vi.fn() }) }));

beforeEach(() => { globalThis.route = (name) => `/test/${name}`; vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ conflict: false }) }))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('shows server validation errors returned after submitting a rental', async () => {
    render(<Create auth={{}} selected={{ product_id: 1, tipe: 'ruangan', name: 'Ruang', satuan: 'per_jam', operational_days: [1], operational_start: '08:00', operational_end: '17:00' }} />);
    fireEvent.change(screen.getByLabelText('Tanggal Pemakaian'), { target: { value: '2030-01-07' } });
    fireEvent.change(screen.getByLabelText('Jam Mulai'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Durasi sewa (jam)'), { target: { value: '2' } });
    await waitFor(() => expect(screen.getByText('Jadwal tersedia')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Pengajuan' }));
    expect(mocks.post).toHaveBeenCalledWith('/test/customer.pengajuan.store', expect.objectContaining({ tipe: 'ruangan', rental_start: '2030-01-07T09:00', rental_end: '2030-01-07T11:00' }), expect.objectContaining({ onError: expect.any(Function) }));
    const options = mocks.post.mock.calls[0][2];
    act(() => options.onError({ 'renter_data.ktp_number': 'Nomor KTP harus 16 karakter.' }));
    expect(await screen.findByText('Nomor KTP harus 16 karakter.')).toBeInTheDocument();
});
