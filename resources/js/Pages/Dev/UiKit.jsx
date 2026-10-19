import { useState } from 'react';
import { FileText, Plus, Settings, Trash2, User } from 'lucide-react';
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

/**
 * DEV-ONLY playground. Renders every UI-kit component in every state so
 * regressions are visible at a glance. Reachable in `vite dev` at
 * /dev/ui-kit; excluded from production bundles (see resources/js/app.jsx).
 */
const OPTIONS = [
    { value: 'flat', label: 'Flat' },
    { value: 'per_hari', label: 'Per hari' },
    { value: 'per_jam', label: 'Per jam' },
];

const LONG_OPTIONS = Array.from({ length: 40 }, (_, i) => ({
    value: `opt-${i}`,
    label: `Pilihan ${i + 1}`,
    description: `Deskripsi singkat untuk pilihan ${i + 1}`,
}));

const MANY = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k) => ({
    value: k,
    label: `Tag ${k.toUpperCase()}`,
}));

function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 font-display text-xl font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

function Grid({ children }) {
    return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Cell({ label, children }) {
    return (
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</p>
            {children}
        </div>
    );
}

export default function UiKit() {
    const [select, setSelect] = useState(null);
    const [combo, setCombo] = useState(null);
    const [multi, setMulti] = useState(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const [check, setCheck] = useState(false);
    const [checks, setChecks] = useState(['Lihat']);
    const [radio, setRadio] = useState('jasa');
    const [sw, setSw] = useState(true);
    const [money, setMoney] = useState(1250000);
    const [stepper, setStepper] = useState(3);
    const [text, setText] = useState('');
    const [note, setNote] = useState('');
    const [tab, setTab] = useState('jasa');
    const [modal, setModal] = useState(false);
    const [modalSelect, setModalSelect] = useState(null);
    const [modalCombo, setModalCombo] = useState(null);

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <h1 className="mb-2 font-display text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
                UI Kit · Dev Playground
            </h1>
            <p className="mb-10 text-sm" style={{ color: 'var(--color-muted)' }}>
                Setiap komponen dalam berbagai state. Halaman ini hanya tersedia di mode pengembangan.
            </p>

            <Section title="TextInput">
                <Grid>
                    <Cell label="Default">
                        <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis sesuatu…" />
                    </Cell>
                    <Cell label="With label + hint">
                        <TextInput label="Nama" hint="Muncul di katalog" value={text} onChange={(e) => setText(e.target.value)} />
                    </Cell>
                    <Cell label="Error">
                        <TextInput label="Email" error="Email tidak valid" value="salah" onChange={() => {}} />
                    </Cell>
                    <Cell label="Required + disabled">
                        <TextInput label="Kode" required disabled value="PNJ-001" onChange={() => {}} />
                    </Cell>
                    <Cell label="Inside Field (context error)">
                        <Field label="Nama layanan" required hint="Wajib diisi" error="Nama layanan wajib diisi">
                            <TextInput />
                        </Field>
                    </Cell>
                </Grid>
            </Section>

            <Section title="Textarea">
                <Grid>
                    <Cell label="Default">
                        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan…" />
                    </Cell>
                    <Cell label="Label + error">
                        <Textarea label="Catatan peninjau" error="Terlalu panjang" rows={3} />
                    </Cell>
                    <Cell label="Disabled">
                        <Textarea label="Terkunci" disabled value="Tidak dapat diubah" rows={3} />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Select">
                <Grid>
                    <Cell label="Default">
                        <Select value={select} onChange={setSelect} options={OPTIONS} placeholder="Pilih satuan…" />
                    </Cell>
                    <Cell label="Label + error">
                        <Select label="Satuan" value={null} onChange={() => {}} options={OPTIONS} error="Satuan wajib dipilih" required />
                    </Cell>
                    <Cell label="Disabled">
                        <Select label="Terkunci" value="flat" onChange={() => {}} options={OPTIONS} disabled />
                    </Cell>
                    <Cell label="Clearable">
                        <Select label="Dapat dibersihkan" value="per_hari" onChange={() => {}} options={OPTIONS} clearable />
                    </Cell>
                    <Cell label="Long list (40)">
                        <Select label="Pilihan panjang" value={null} onChange={() => {}} options={LONG_OPTIONS} />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Combobox">
                <Grid>
                    <Cell label="Default">
                        <Combobox value={combo} onChange={setCombo} options={LONG_OPTIONS} />
                    </Cell>
                    <Cell label="Label + error">
                        <Combobox label="Layanan" value={null} onChange={() => {}} options={OPTIONS} error="Layanan wajib dipilih" />
                    </Cell>
                    <Cell label="Disabled">
                        <Combobox label="Terkunci" value={null} onChange={() => {}} options={OPTIONS} disabled />
                    </Cell>
                    <Cell label="Loading">
                        <Combobox label="Memuat" value={null} onChange={() => {}} options={[]} loading />
                    </Cell>
                </Grid>
            </Section>

            <Section title="MultiSelect">
                <Grid>
                    <Cell label="Default">
                        <MultiSelect value={multi} onChange={setMulti} options={MANY} />
                    </Cell>
                    <Cell label="Many chips (8 selected)">
                        <MultiSelect label="Tag" value={multi} onChange={setMulti} options={MANY} />
                    </Cell>
                    <Cell label="Max 2">
                        <MultiSelect label="Maks. 2" value={['a', 'b']} onChange={() => {}} options={MANY} max={2} />
                    </Cell>
                    <Cell label="Disabled">
                        <MultiSelect label="Terkunci" value={['a']} onChange={() => {}} options={MANY} disabled />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Checkbox">
                <Grid>
                    <Cell label="Default">
                        <Checkbox checked={check} onChange={setCheck} label="Aktif" description="Dapat dipilih customer" />
                    </Cell>
                    <Cell label="Indeterminate">
                        <Checkbox checked={false} indeterminate onChange={() => {}} label="Sebagian" />
                    </Cell>
                    <Cell label="Error">
                        <Checkbox checked={false} onChange={() => {}} label="Setuju" />
                        <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-danger)' }}>Wajib disetujui</p>
                    </Cell>
                    <Cell label="Disabled">
                        <Checkbox checked disabled onChange={() => {}} label="Tidak dapat diubah" />
                    </Cell>
                </Grid>
            </Section>

            <Section title="CheckboxGroup">
                <Grid>
                    <Cell label="Vertical + select all">
                        <CheckboxGroup
                            label="Aksi tersedia"
                            value={checks}
                            onChange={setChecks}
                            options={[
                                { value: 'Lihat', label: 'Lihat' },
                                { value: 'Tambah', label: 'Tambah' },
                                { value: 'Ubah', label: 'Ubah' },
                            ]}
                            selectAll
                        />
                    </Cell>
                    <Cell label="Horizontal">
                        <CheckboxGroup
                            label="Hari"
                            orientation="horizontal"
                            value={['sen']}
                            onChange={() => {}}
                            options={[
                                { value: 'sen', label: 'Sen' },
                                { value: 'sel', label: 'Sel' },
                                { value: 'rab', label: 'Rab' },
                            ]}
                        />
                    </Cell>
                    <Cell label="Disabled + error">
                        <CheckboxGroup
                            label="Terkunci"
                            disabled
                            error="Tidak dapat diubah"
                            value={[]}
                            onChange={() => {}}
                            options={[{ value: 'a', label: 'Opsi A' }]}
                        />
                    </Cell>
                </Grid>
            </Section>

            <Section title="RadioGroup">
                <Grid>
                    <Cell label="List">
                        <RadioGroup label="Tipe" value={radio} onChange={setRadio} options={OPTIONS} />
                    </Cell>
                    <Cell label="Cards">
                        <RadioGroup
                            label="Jenis layanan"
                            variant="cards"
                            value={radio}
                            onChange={setRadio}
                            options={[
                                { value: 'jasa', label: 'Jasa', description: 'Layanan profesional', icon: <FileText className="h-5 w-5" /> },
                                { value: 'ruangan', label: 'Ruangan', description: 'Sewa fasilitas', icon: <Settings className="h-5 w-5" /> },
                                { value: 'produk', label: 'Produk', description: 'Produk unggulan', icon: <FileText className="h-5 w-5" /> },
                            ]}
                        />
                    </Cell>
                    <Cell label="Disabled">
                        <RadioGroup label="Terkunci" value="a" onChange={() => {}} options={OPTIONS} disabled />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Switch">
                <Grid>
                    <Cell label="Default">
                        <Switch checked={sw} onChange={setSw} label="Aktif" description="Hidupkan layanan" />
                    </Cell>
                    <Cell label="Off">
                        <Switch checked={false} onChange={() => {}} label="Nonaktif" />
                    </Cell>
                    <Cell label="Disabled">
                        <Switch checked disabled onChange={() => {}} label="Terkunci" name="locked" />
                    </Cell>
                </Grid>
            </Section>

            <Section title="MoneyInput">
                <Grid>
                    <Cell label="Default">
                        <MoneyInput value={money} onChange={setMoney} label="Harga" />
                    </Cell>
                    <Cell label="Error">
                        <MoneyInput value={0} onChange={() => {}} label="Harga" error="Harga wajib diisi" required />
                    </Cell>
                    <Cell label="Disabled">
                        <MoneyInput value={2000000} onChange={() => {}} label="Terkunci" disabled name="harga" />
                    </Cell>
                </Grid>
            </Section>

            <Section title="NumberStepper">
                <Grid>
                    <Cell label="Default">
                        <NumberStepper value={stepper} onChange={setStepper} min={1} max={10} label="Jumlah" />
                    </Cell>
                    <Cell label="Error">
                        <NumberStepper value={0} onChange={() => {}} min={0} max={5} label="Jumlah" error="Melebihi batas" />
                    </Cell>
                    <Cell label="Disabled">
                        <NumberStepper value={5} onChange={() => {}} label="Terkunci" disabled />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Menu">
                <Grid>
                    <Cell label="Default (align end)">
                        <Menu
                            button="Aksi"
                            items={[
                                { key: 'view', label: 'Lihat', icon: FileText, onClick: () => {} },
                                { key: 'edit', label: 'Ubah', icon: Settings, onClick: () => {} },
                                { type: 'divider' },
                                { key: 'del', label: 'Hapus', icon: Trash2, destructive: true, onClick: () => {} },
                            ]}
                        />
                    </Cell>
                    <Cell label="Align start + link + disabled">
                        <Menu
                            align="start"
                            button="Opsi"
                            items={[
                                { key: 'link', label: 'Tautan', icon: User, href: '#' },
                                { key: 'disabled', label: 'Nonaktif', disabled: true, onClick: () => {} },
                            ]}
                        />
                    </Cell>
                </Grid>
            </Section>

            <Section title="Tabs + Accordion">
                <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'jasa', label: 'Jasa' },
                        { key: 'produk', label: 'Produk' },
                    ]}
                >
                    <div className="text-sm" style={{ color: 'var(--color-ink)' }}>Panel Jasa</div>
                    <div className="text-sm" style={{ color: 'var(--color-ink)' }}>Panel Produk</div>
                </Tabs>

                <div className="mt-6 space-y-3">
                    <Accordion title="Riwayat & Pemantauan" description="Tertutup secara default">
                        Isi panel riwayat.
                    </Accordion>
                    <Accordion title="Terbuka secara default" defaultOpen>
                        Isi panel yang terbuka.
                    </Accordion>
                </div>
            </Section>

            <Section title="Inside a table cell">
                <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="w-full min-w-[640px] text-sm">
                        <thead style={{ background: 'var(--color-surface)' }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Pilih</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2].map((i) => (
                                <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    <td className="px-4 py-3">
                                        <Checkbox checked={false} onChange={() => {}} aria-label={`Pilih baris ${i}`} />
                                    </td>
                                    <td className="px-4 py-3" style={{ color: 'var(--color-ink)' }}>Baris {i}</td>
                                    <td className="px-4 py-3">
                                        <Switch checked={i === 1} onChange={() => {}} aria-label={`Status baris ${i}`} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Menu
                                            button="⋯"
                                            items={[
                                                { key: 'edit', label: 'Ubah', icon: Settings, onClick: () => {} },
                                                { key: 'del', label: 'Hapus', icon: Trash2, destructive: true, onClick: () => {} },
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section title="Inside a Modal (layering check)">
                <button
                    type="button"
                    onClick={() => setModal(true)}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-accent)' }}
                >
                    <Plus className="h-4 w-4" /> Buka modal
                </button>

                <Modal
                    open={modal}
                    onClose={() => setModal(false)}
                    title="Modal dengan kontrol"
                    description="Buka Select/Combobox untuk memastikan popover muncul di atas modal."
                    size="lg"
                    footer={
                        <>
                            <button type="button" onClick={() => setModal(false)} className="rounded-full border px-5 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}>
                                Batal
                            </button>
                            <button type="button" onClick={() => setModal(false)} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: 'var(--color-accent)' }}>
                                Simpan
                            </button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <Select label="Status" value={modalSelect} onChange={setModalSelect} options={OPTIONS} />
                        <Combobox label="Layanan" value={modalCombo} onChange={setModalCombo} options={LONG_OPTIONS} />
                        <Checkbox checked={check} onChange={setCheck} label="Aktif" />
                    </div>
                </Modal>
            </Section>
        </div>
    );
}
