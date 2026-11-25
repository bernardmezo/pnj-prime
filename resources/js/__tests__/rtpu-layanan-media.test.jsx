// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Form from '../Pages/Rtpu/Layanan/Form';

const submitted = vi.hoisted(() => ({ payload: null }));
vi.mock('@inertiajs/react', async () => {
    const React = await import('react');
    return { Head: () => null, useForm: (initial) => {
        const [data, set] = React.useState(initial);
        let transform = (v) => v;
        return { data, setData: (key, value) => set((old) => ({ ...old, [key]: value })), transform: (fn) => { transform = fn; }, post: () => { submitted.payload = transform(data); }, processing: false, errors: {} };
    } };
});
vi.mock('../Layouts/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('../Components/OpsiEditor', () => ({ default: ({ onChange }) => <button type="button" onClick={() => onChange([{ _key: 'a', jenis: 'addon', nama: 'Addon', satuan: 'flat', foto_file: new File(['a'], 'addon.jpg', { type: 'image/jpeg' }) }, { _key: 'b', jenis: 'termasuk', nama: 'Termasuk', satuan: 'flat' }])}>Isi opsi</button> }));
globalThis.route = (name) => name;

describe('media form RTPU', () => {
    it('maps option files after serialization ordering', () => {
        render(<Form tipe="jasa" auth={{ user: { role: 'admin_rtpu' } }} />);
        fireEvent.click(screen.getByText('Isi opsi'));
        fireEvent.click(screen.getByText('Tambah Layanan'));
        expect(submitted.payload.opsi.map((row) => row.nama)).toEqual(['Termasuk', 'Addon']);
        expect(submitted.payload.opsi[0].foto).toBeUndefined();
        expect(submitted.payload.opsi[1].foto.name).toBe('addon.jpg');
        expect(screen.getByLabelText('Foto galeri')).toBeTruthy();
        expect(screen.getByLabelText('File video')).toBeTruthy();
    });
});
