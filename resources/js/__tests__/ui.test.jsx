import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: { visit: vi.fn(), get: vi.fn(), post: vi.fn() },
        usePage: () => ({ props: {} }),
        useForm: () => ({ data: {}, setData: vi.fn(), errors: {}, processing: false }),
    };
});

import Field from '@/Components/ui/Field';
import Select from '@/Components/ui/Select';
import Combobox from '@/Components/ui/Combobox';
import MultiSelect from '@/Components/ui/MultiSelect';
import Checkbox from '@/Components/ui/Checkbox';
import CheckboxGroup from '@/Components/ui/CheckboxGroup';
import RadioGroup from '@/Components/ui/RadioGroup';
import Switch from '@/Components/ui/Switch';
import Menu from '@/Components/ui/Menu';
import Modal from '@/Components/ui/Modal';
import Tabs from '@/Components/ui/Tabs';
import Accordion from '@/Components/ui/Disclosure';
import MoneyInput from '@/Components/ui/MoneyInput';
import NumberStepper from '@/Components/ui/NumberStepper';
import TextInput from '@/Components/ui/TextInput';
import Textarea from '@/Components/ui/Textarea';

const opts = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
];

function ControlledSelect() {
    const [v, setV] = useState(null);
    return <Select label="Pilih" value={v} onChange={setV} options={opts} name="huruf" />;
}

describe('Field', () => {
    it('renders label, required marker, hint, and error with role=alert', () => {
        render(
            <Field label="Nama" required hint="Bantuan" error="Wajib diisi">
                <TextInput />
            </Field>,
        );
        expect(screen.getByText('Nama')).toBeInTheDocument();
        expect(screen.getByText('*')).toBeInTheDocument();
        expect(screen.getByText('Bantuan')).toBeInTheDocument();
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Wajib diisi');
        expect(screen.getByLabelText(/Nama/)).toHaveAttribute('aria-invalid', 'true');
    });
});

describe('Select', () => {
    it('opens the listbox, selects an option and exposes a hidden input', async () => {
        const user = userEvent.setup();
        const { container } = render(<ControlledSelect />);
        expect(screen.getByRole('button', { name: /pilih/i })).toBeInTheDocument();
        expect(container.querySelector('input[name="huruf"]')).toHaveValue('');
        await user.click(screen.getByRole('button', { name: /pilih/i }));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await user.click(screen.getByRole('option', { name: 'Beta' }));
        expect(container.querySelector('input[name="huruf"]')).toHaveValue('b');
        expect(screen.getByRole('button', { name: /pilih/i })).toHaveTextContent('Beta');
    });

    it('shows the empty state when there are no options', async () => {
        const user = userEvent.setup();
        render(<Select label="Kosong" value={null} onChange={() => {}} options={[]} />);
        await user.click(screen.getByRole('button', { name: /kosong/i }));
        expect(screen.getByText('Tidak ada pilihan')).toBeInTheDocument();
    });

    it('is not interactive when disabled', () => {
        render(<Select label="Off" value={null} onChange={() => {}} options={opts} disabled />);
        expect(screen.getByRole('button')).toHaveAttribute('data-disabled');
    });
});

describe('Combobox', () => {
    it('filters options accent/case-insensitively and selects', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Combobox label="Cari" value={null} onChange={onChange} options={opts} />);
        const input = screen.getByRole('combobox');
        await user.type(input, 'be');
        expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Gamma' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('option', { name: 'Beta' }));
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('shows the not-found empty state', async () => {
        const user = userEvent.setup();
        render(<Combobox value={null} onChange={() => {}} options={opts} />);
        await user.type(screen.getByRole('combobox'), 'zzz');
        expect(screen.getByText('Tidak ditemukan')).toBeInTheDocument();
    });
});

describe('MultiSelect', () => {
    it('adds chips, removes them, and honors max', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container, rerender } = render(
            <MultiSelect label="Banyak" value={['a']} onChange={onChange} options={opts} max={2} />,
        );
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: 'Beta' }));
        expect(onChange).toHaveBeenCalledWith(['a', 'b']);
        await user.keyboard('{Escape}');
        rerender(<MultiSelect label="Banyak" value={['a']} onChange={onChange} options={opts} max={2} />);
        const remove = container.querySelector('button[aria-label="Hapus Alpha"]');
        expect(remove).toBeTruthy();
        fireEvent.click(remove);
        expect(onChange).toHaveBeenLastCalledWith([]);
    });
});

describe('Checkbox + CheckboxGroup', () => {
    it('toggles and renders a checkbox role', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Checkbox checked={false} onChange={onChange} label="Aktif" />);
        await user.click(screen.getByRole('checkbox', { name: 'Aktif' }));
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('renders an indeterminate checkbox', () => {
        render(<Checkbox checked={false} indeterminate onChange={() => {}} label="Campur" />);
        expect(screen.getByRole('checkbox', { name: 'Campur' })).toHaveAttribute('aria-checked', 'mixed');
    });

    it('CheckboxGroup selects all applicable values', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <CheckboxGroup
                label="Aksi"
                value={['Lihat']}
                onChange={onChange}
                options={[{ value: 'Lihat', label: 'Lihat' }, { value: 'Tambah', label: 'Tambah' }]}
                selectAll
            />,
        );
        await user.click(screen.getByRole('checkbox', { name: 'Pilih semua' }));
        expect(onChange).toHaveBeenCalledWith(['Lihat', 'Tambah']);
    });
});

describe('RadioGroup', () => {
    it('renders radiogroup + radio roles and selects', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<RadioGroup label="Tipe" value="a" onChange={onChange} options={opts} />);
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        await user.click(screen.getByRole('radio', { name: 'Gamma' }));
        expect(onChange).toHaveBeenCalledWith('c');
    });

    it('supports the cards variant', () => {
        render(<RadioGroup value="a" onChange={() => {}} options={[{ value: 'a', label: 'Jasa', description: 'Layanan' }]} variant="cards" />);
        expect(screen.getByText('Jasa')).toBeInTheDocument();
        expect(screen.getByText('Layanan')).toBeInTheDocument();
    });
});

describe('Switch', () => {
    it('renders a switch role and toggles', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} label="Aktif" name="aktif" />);
        await user.click(screen.getByRole('switch'));
        expect(onChange).toHaveBeenCalledWith(true);
    });
});

describe('Menu', () => {
    it('opens and fires item handlers, incl. destructive', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Menu
                button="Aksi"
                items={[{ key: 'e', label: 'Ubah', onClick }, { type: 'divider' }, { key: 'd', label: 'Hapus', destructive: true, onClick }]}
            />,
        );
        await user.click(screen.getByRole('button', { name: 'Aksi' }));
        await user.click(screen.getByRole('menuitem', { name: 'Hapus' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('Modal', () => {
    it('renders a dialog with title/description/footer and closes on ESC', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <Modal open onClose={onClose} title="Judul" description="Deskripsi" footer={<button>Kirim</button>}>
                <p>Isi</p>
            </Modal>,
        );
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Judul')).toBeInTheDocument();
        expect(within(dialog).getByText('Deskripsi')).toBeInTheDocument();
        expect(within(dialog).getByText('Kirim')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });

    it('does not close via ESC when not dismissible', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <Modal open onClose={onClose} dismissible={false} title="Mengirim…">
                <p>Isi</p>
            </Modal>,
        );
        await user.keyboard('{Escape}');
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('Tabs + Accordion', () => {
    it('switches tab panels', async () => {
        const user = userEvent.setup();
        render(
            <Tabs tabs={[{ key: 'a', label: 'Satu' }, { key: 'b', label: 'Dua' }]}>
                <div>Panel satu</div>
                <div>Panel dua</div>
            </Tabs>,
        );
        expect(screen.getByText('Panel satu')).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Dua' }));
        expect(screen.getByText('Panel dua')).toBeInTheDocument();
    });

    it('toggles an accordion panel', async () => {
        const user = userEvent.setup();
        render(<Accordion title="Grup">Isi grup</Accordion>);
        expect(screen.queryByText('Isi grup')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Grup' }));
        expect(screen.getByText('Isi grup')).toBeInTheDocument();
    });
});

describe('MoneyInput', () => {
    it('formats with thousand separators and emits integer rupiah', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<MoneyInput label="Harga" value={1250000} onChange={onChange} />);
        const input = screen.getByLabelText('Harga');
        expect(input).toHaveValue('1.250.000');
        await user.clear(input);
        await user.type(input, '2500000');
        expect(onChange).toHaveBeenLastCalledWith(2500000);
        expect(input).toHaveValue('2.500.000');
    });
});

describe('NumberStepper', () => {
    it('increments/decrements and respects min/max', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<NumberStepper label="Jumlah" value={5} min={4} max={6} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Tambah' }));
        expect(onChange).toHaveBeenLastCalledWith(6);
        await user.click(screen.getByRole('button', { name: 'Kurangi' }));
        expect(onChange).toHaveBeenLastCalledWith(4);
    });
});

describe('TextInput + Textarea', () => {
    it('renders an error alert inside the field', () => {
        render(<Textarea label="Catatan" error="Terlalu panjang" />);
        expect(screen.getByRole('alert')).toHaveTextContent('Terlalu panjang');
    });
});
