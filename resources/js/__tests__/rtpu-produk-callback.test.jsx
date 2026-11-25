import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VerifikasiProduk from '../Pages/Rtpu/Verifikasi/Produk';

const { patch } = vi.hoisted(() => ({ patch: vi.fn() }));
vi.mock('@inertiajs/react', () => ({ Head: () => null, router: { patch } }));
vi.mock('@/Layouts/DashboardLayout', () => ({ default: ({ children }) => <>{children}</> }));

const product = { id: 7, name: 'Produk uji', status: 'submitted', documents: [] };

beforeEach(() => {
    patch.mockReset();
    globalThis.route = (name, id) => `${name}/${id}`;
});
afterEach(cleanup);

function approve() { fireEvent.click(screen.getByRole('button', { name: 'Setujui' })); }
function reject() {
    fireEvent.click(screen.getAllByRole('button', { name: 'Tolak' })[0]);
    fireEvent.change(screen.getByLabelText('Catatan penolakan (wajib)'), { target: { value: 'Perlu perbaikan' } });
    const buttons = screen.getAllByRole('button', { name: 'Tolak' });
    fireEvent.click(buttons[buttons.length - 1]);
}

describe.each([
    ['approve', approve, 'rtpu.verify.produk.verify/7', {}],
    ['reject', reject, 'rtpu.verify.produk.reject/7', { catatan: 'Perlu perbaikan' }],
])('verifikasi produk: %s', (_action, submit, url, data) => {
    it.each(['success', 'error'])('mengembalikan aksi setelah %s dan finish', (outcome) => {
        render(<VerifikasiProduk products={[product]} />);
        submit();
        expect(patch).toHaveBeenCalledTimes(1);
        const [actualUrl, actualData, options] = patch.mock.calls[0];
        expect(actualUrl).toBe(url);
        expect(actualData).toEqual(data);
        expect(options).toBeDefined();
        submit();
        expect(patch).toHaveBeenCalledTimes(1);
        act(() => {
            options[outcome === 'success' ? 'onSuccess' : 'onError']?.({});
            options.onFinish();
        });
        submit();
        expect(patch).toHaveBeenCalledTimes(2);
    });
});
