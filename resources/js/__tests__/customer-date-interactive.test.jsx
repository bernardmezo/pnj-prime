import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Create from '../Pages/Customer/Pengajuan/Create';
import Edit from '../Pages/Customer/Pengajuan/Edit';

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock('@inertiajs/react', () => ({
    Head: () => null, Link: ({ children }) => <span>{children}</span>,
    router: { post: mocks.post, visit: vi.fn() }, usePage: () => ({ props: { errors: {} } }),
    useForm: (initial) => {
        const [data, update] = useState(initial);
        return { data, setData: (key, value) => update((prev) => typeof key === 'function' ? key(prev) : { ...prev, [key]: value }), patch: (...args) => mocks.patch(...args, data), processing: false, errors: {}, reset: vi.fn() };
    },
}));
vi.mock('../Layouts/PublicLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../Components/CustomerTabs', () => ({ default: () => null }));
vi.mock('../lib/useOpsiQuote', () => ({ useOpsiQuote: () => ({ quote: null }) }));
vi.mock('../lib/usePengajuanDraft', () => ({ usePengajuanDraft: () => ({ restoreDraft: () => null, clearDraft: vi.fn() }) }));

globalThis.route = (name) => `/test/${name}`;
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, json: async () => url.includes('check-conflict') ? { conflict: false } : { success: false } }))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const selected = (tipe, satuan) => ({ product_id: 1, tipe, name: 'Layanan', satuan, operational_days: [1], operational_start: '08:00', operational_end: '17:00' });
const create = (tipe, satuan, closedDates = []) => render(<Create auth={{}} selected={selected(tipe, satuan)} closedDates={closedDates} />);
const edit = (type) => render(<Edit auth={{}} item={{ id: 1, code: 'A', layanan: 'Layanan', type, tanggal: '2030-01-07', jam_mulai: '09:00', jam_selesai: '10:00' }} />);

describe('pemilih tanggal Customer', () => {
    it('Create jasa menyimpan dan menghapus tanggal', () => {
        create('jasa');
        const input = screen.getByLabelText('Tanggal Diharapkan');
        fireEvent.change(input, { target: { value: '2030-01-07' } });
        expect(input.value).toBe('2030-01-07');
        fireEvent.change(input, { target: { value: '' } });
        expect(input.value).toBe('');
    });
    it.each(['jasa', 'ruangan'])('Edit %s memberi label dan menyimpan tanggal pilihan', (type) => {
        edit(type);
        const input = screen.getByLabelText(type === 'jasa' ? 'Tanggal diharapkan' : 'Tanggal');
        expect(input.value).toBe('2030-01-07');
        fireEvent.change(input, { target: { value: '2030-02-08' } });
        fireEvent.submit(input.closest('form'));
        expect(mocks.patch).toHaveBeenCalledWith('/test/customer.pengajuan.update', expect.objectContaining({ tanggal: '2030-02-08' }));
    });
    it('Create ruangan per jam menghitung jadwal dan memeriksa konflik', async () => {
        create('ruangan', 'per_jam');
        fireEvent.change(screen.getByLabelText('Tanggal Pemakaian'), { target: { value: '2030-01-07' } });
        fireEvent.change(screen.getByLabelText('Jam Mulai'), { target: { value: '09:00' } });
        fireEvent.change(screen.getByLabelText('Durasi sewa (jam)'), { target: { value: '2' } });
        expect(screen.getByText(/Jam selesai: 11:00/)).toBeTruthy();
        await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/rental/check-conflict', expect.objectContaining({ body: JSON.stringify({ product_id: 1, rental_start: '2030-01-07T09:00', rental_end: '2030-01-07T11:00' }) })));
        fireEvent.change(screen.getByLabelText('Tanggal Pemakaian'), { target: { value: '' } });
        expect(screen.getByText(/Jam selesai: —/)).toBeTruthy();
    });
    it('Create ruangan non-jam mengubah kedua tanggal periode dan memeriksa konflik', async () => {
        create('ruangan', 'per_hari');
        const date = screen.getByLabelText('Tanggal Pemakaian');
        const start = screen.getByLabelText('Mulai Sewa');
        const end = screen.getByLabelText('Selesai Sewa');
        fireEvent.change(date, { target: { value: '2030-01-07' } });
        fireEvent.change(start, { target: { value: '2030-01-07T09:00' } });
        expect(end.min).toBe('2030-01-07T09:00');
        fireEvent.change(end, { target: { value: '2030-01-08T10:00' } });
        expect(end.value).toBe('2030-01-08T10:00');
        await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/rental/check-conflict', expect.objectContaining({ body: JSON.stringify({ product_id: 1, rental_start: '2030-01-07T09:00', rental_end: '2030-01-08T10:00' }) })));
        fireEvent.change(end, { target: { value: '' } });
        expect(end.value).toBe('');
    });
    it('Create memperingatkan tanggal merah dalam periode sewa', () => {
        create('ruangan', 'per_hari', [{ date: '2030-01-08', title: 'Libur' }]);
        fireEvent.change(screen.getByLabelText('Mulai Sewa'), { target: { value: '2030-01-07T09:00' } });
        fireEvent.change(screen.getByLabelText('Selesai Sewa'), { target: { value: '2030-01-09T10:00' } });
        expect(screen.getByRole('alert').textContent).toContain('2030-01-08');
    });
});
