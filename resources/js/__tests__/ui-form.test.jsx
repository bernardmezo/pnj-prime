import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stateful useForm mock so controlled components can be wired end-to-end.
vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: { visit: vi.fn(), get: vi.fn(), post: vi.fn() },
        usePage: () => ({ props: {} }),
        useForm: (initial = {}) => {
            const [data, setData] = React.useState(initial);
            return {
                data,
                setData: (key, value) => setData((prev) => ({ ...prev, [key]: value })),
                errors: {},
                processing: false,
                post: vi.fn(),
                reset: vi.fn(),
            };
        },
    };
});

import Select from '@/Components/ui/Select';
import Checkbox from '@/Components/ui/Checkbox';
import Switch from '@/Components/ui/Switch';
import TextInput from '@/Components/ui/TextInput';
import { useForm } from '@inertiajs/react';

function DemoForm() {
    const { data, setData, errors } = useForm({ nama: '', satuan: '', setuju: false, aktif: false });
    return (
        <form>
            <TextInput label="Nama" value={data.nama} onChange={(e) => setData('nama', e.target.value)} error={errors.nama} />
            <Select
                label="Satuan"
                name="satuan"
                value={data.satuan}
                onChange={(v) => setData('satuan', v)}
                options={[{ value: 'flat', label: 'Flat' }, { value: 'per_hari', label: 'Per hari' }]}
                error={errors.satuan}
            />
            <Checkbox checked={data.setuju} onChange={(v) => setData('setuju', v)} label="Setuju" />
            <Switch checked={data.aktif} onChange={(v) => setData('aktif', v)} label="Aktif" />
            <output data-testid="dump">{JSON.stringify(data)}</output>
        </form>
    );
}

describe('UI kit wired to Inertia useForm', () => {
    it('updates form data through Select + Checkbox + Switch + TextInput', async () => {
        const user = userEvent.setup();
        render(<DemoForm />);

        await user.type(screen.getByLabelText('Nama'), 'Alat');
        expect(screen.getByTestId('dump')).toHaveTextContent('"nama":"Alat"');

        await user.click(screen.getByRole('button', { name: /flat|pilih/i }));
        await user.click(screen.getByRole('option', { name: 'Per hari' }));
        expect(screen.getByTestId('dump')).toHaveTextContent('"satuan":"per_hari"');

        await user.click(screen.getByRole('checkbox', { name: 'Setuju' }));
        expect(screen.getByTestId('dump')).toHaveTextContent('"setuju":true');

        await user.click(screen.getByRole('switch', { name: 'Aktif' }));
        expect(screen.getByTestId('dump')).toHaveTextContent('"aktif":true');
    });
});
