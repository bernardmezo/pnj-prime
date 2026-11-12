import { useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    FileText,
    Info,
    Package,
    Plus,
    Search,
    Settings,
    ShoppingCart,
    Trash2,
    Truck,
    User,
    X,
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import SpeedLines from '@/Components/SpeedLines';
import SwooshLine from '@/Components/SwooshLine';
import FlashToast from '@/Components/FlashToast';
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
import UiTextInput from '@/Components/ui/TextInput';
import Textarea from '@/Components/ui/Textarea';
import {
    Card,
    EmptyState,
    FilterTabs,
    PageHeader,
    Pagination,
    RoleBadge,
    StatCard,
    StatusBadge,
    Stepper,
    Table,
    Td,
} from '@/Components/ui';

/**
 * DEV-ONLY playground. Menampilkan fondasi desain sistem PRIME dan semua
 * komponen UI dalam berbagai state: default, hover, focus, disabled,
 * loading, error, dan empty; termasuk contoh di latar terang dan gelap.
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

function Section({ title, children, dark = false }) {
    return (
        <section className={`mb-10 rounded-3xl p-6 ${dark ? 'bg-[var(--color-dark-bg)]' : ''}`}>
            <h2
                className="mb-4 border-b pb-2 font-display text-xl font-bold"
                style={{ borderColor: dark ? 'var(--color-dark-border)' : 'var(--color-border)', color: dark ? 'var(--color-dark-text)' : 'var(--color-ink)' }}
            >
                {title}
            </h2>
            {children}
        </section>
    );
}

function Grid({ children, cols = 3 }) {
    return <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-${cols}`}>{children}</div>;
}

function Cell({ label, children, dark = false }) {
    return (
        <div
            className={`rounded-2xl border p-4 ${dark ? 'border-[var(--color-dark-border)] bg-[var(--color-deep)]' : 'bg-white'}`}
            style={{ borderColor: dark ? 'var(--color-dark-border)' : 'var(--color-border)' }}
        >
            <p className="mb-3 text-[13px] font-semibold" style={{ color: dark ? 'var(--color-dark-muted)' : 'var(--color-muted)' }}>
                {label}
            </p>
            {children}
        </div>
    );
}

function DemoRow({ label, children }) {
    return (
        <div className="flex flex-wrap items-center gap-4">
            <span className="w-28 shrink-0 text-[13px] font-medium" style={{ color: 'var(--color-muted)' }}>{label}</span>
            {children}
        </div>
    );
}

const SAMPLE_LINKS = [
    { label: '1', url: '#', active: false },
    { label: '2', url: '#', active: true },
    { label: '3', url: '#', active: false },
    { label: '4', url: '#', active: false },
    { label: '›', url: '#', active: false },
];

const FILTER_TABS = [
    { value: 'semua', label: 'Semua' },
    { value: 'aktif', label: 'Aktif' },
    { value: 'pending', label: 'Pending' },
    { value: 'arsip', label: 'Arsip' },
];

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
    const [tab, setTab] = useState(0);
    const [modal, setModal] = useState(false);
    const [modalSelect, setModalSelect] = useState(null);
    const [modalCombo, setModalCombo] = useState(null);
    const [filter, setFilter] = useState('semua');

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <PageHeader
                eyebrow="Fase 1 — Design System"
                title="UI Kit PRIME"
                desc="Galeri komponen dasar dan motif khas PRIME. Periksa tampilan default, hover, focus, disabled, loading, error, dan empty di latar terang maupun gelap."
            />

            {/* ---------- Motif khas ---------- */}
            <Section title="Motif Khas: SpeedLines & SwooshLine">
                <Grid cols={3}>
                    <Cell label="SpeedLines sm horizontal">
                        <SpeedLines size="sm" />
                    </Cell>
                    <Cell label="SpeedLines md horizontal">
                        <SpeedLines size="md" />
                    </Cell>
                    <Cell label="SpeedLines lg horizontal">
                        <SpeedLines size="lg" />
                    </Cell>
                    <Cell label="SpeedLines vertical">
                        <SpeedLines size="md" direction="vertical" />
                    </Cell>
                    <Cell label="SwooshLine md (gold 15%)">
                        <SwooshLine size="md" />
                    </Cell>
                    <Cell label="SwooshLine lg (teal 10%)">
                        <SwooshLine size="lg" opacity={0.1} color="var(--color-accent)" />
                    </Cell>
                </Grid>
            </Section>

            {/* ---------- Buttons ---------- */}
            <Section title="Tombol">
                <div className="space-y-5">
                    <DemoRow label="Primary">
                        <PrimaryButton>Default</PrimaryButton>
                        <PrimaryButton disabled>Disabled</PrimaryButton>
                        <PrimaryButton className="ring-2 ring-[var(--color-accent)] ring-offset-2">Focus</PrimaryButton>
                        <PrimaryButton arrow>With arrow</PrimaryButton>
                    </DemoRow>
                    <DemoRow label="Secondary">
                        <SecondaryButton>Default</SecondaryButton>
                        <SecondaryButton disabled>Disabled</SecondaryButton>
                        <SecondaryButton className="ring-2 ring-[var(--color-accent)] ring-offset-2">Focus</SecondaryButton>
                    </DemoRow>
                    <DemoRow label="Danger">
                        <DangerButton>Default</DangerButton>
                        <DangerButton disabled>Disabled</DangerButton>
                        <DangerButton className="ring-2 ring-[var(--color-danger)] ring-offset-2">Focus</DangerButton>
                    </DemoRow>
                </div>
            </Section>

            {/* ---------- Inputs ---------- */}
            <Section title="TextInput">
                <Grid cols={3}>
                    <Cell label="Default">
                        <TextInput placeholder="Tulis sesuatu…" />
                    </Cell>
                    <Cell label="Disabled">
                        <TextInput disabled value="Tidak dapat diubah" />
                    </Cell>
                    <Cell label="Focus (dengan ring)">
                        <TextInput autoFocus className="border-[var(--color-accent)]" style={{ boxShadow: '0 0 0 3px var(--color-accent-tint)' }} />
                    </Cell>
                </Grid>
            </Section>

            {/* ---------- Badges ---------- */}
            <Section title="StatusBadge">
                <div className="flex flex-wrap gap-2">
                    <StatusBadge label="Aktif" tone="teal" />
                    <StatusBadge label="Pending" tone="gold" />
                    <StatusBadge label="Ditolak" tone="danger" />
                    <StatusBadge label="Netral" tone="neutral" />
                    <RoleBadge role="admin_rtpu" />
                    <RoleBadge role="customer" />
                </div>
            </Section>

            {/* ---------- Cards ---------- */}
            <Section title="Card & StatCard">
                <Grid cols={3}>
                    <Cell label="Card default">
                        <Card className="p-5">
                            <h3 className="font-display font-bold" style={{ color: 'var(--color-ink)' }}>Kartu standar</h3>
                            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Dengan bayangan berlapis saat hover.</p>
                        </Card>
                    </Cell>
                    <Cell label="StatCard teal">
                        <StatCard label="Total pesanan" value={1284} suffix="" icon={ShoppingCart} tone="teal" />
                    </Cell>
                    <Cell label="StatCard gold">
                        <StatCard label="Pendapatan" value={42} suffix="jt" icon={Package} tone="gold" />
                    </Cell>
                </Grid>
            </Section>

            {/* ---------- Table ---------- */}
            <Section title="Table">
                <Table columns={['Produk', 'Kategori', 'Status', 'Harga']}>
                    <tbody>
                        <tr>
                            <Td strong>Layanan Desain</Td>
                            <Td>Jasa</Td>
                            <Td><StatusBadge label="Aktif" tone="teal" /></Td>
                            <Td strong>Rp1.500.000</Td>
                        </tr>
                        <tr>
                            <Td strong>Studio Foto</Td>
                            <Td>Ruangan</Td>
                            <Td><StatusBadge label="Pending" tone="gold" /></Td>
                            <Td strong>Rp750.000</Td>
                        </tr>
                    </tbody>
                </Table>
            </Section>

            {/* ---------- Tabs with skew ---------- */}
            <Section title="Tabs (skew aktif, teks tetap tegak)">
                <Tabs
                    tabs={[
                        { label: 'Jasa' },
                        { label: 'Produk' },
                        { label: 'Ruangan' },
                    ]}
                    defaultIndex={tab}
                    onChange={setTab}
                >
                    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm" style={{ color: 'var(--color-ink)' }}>
                        Panel Jasa — tab aktif menggunakan skew pada wadah, teks di dalamnya diberi skew kebalikan.
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm" style={{ color: 'var(--color-ink)' }}>
                        Panel Produk.
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm" style={{ color: 'var(--color-ink)' }}>
                        Panel Ruangan.
                    </div>
                </Tabs>
            </Section>

            {/* ---------- FilterTabs & Pagination ---------- */}
            <Section title="FilterTabs & Pagination">
                <Grid cols={2}>
                    <Cell label="FilterTabs">
                        <FilterTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
                    </Cell>
                    <Cell label="Pagination">
                        <Pagination links={SAMPLE_LINKS} />
                    </Cell>
                </Grid>
            </Section>

            {/* ---------- EmptyState & Stepper ---------- */}
            <Section title="EmptyState & Stepper">
                <Grid cols={2}>
                    <Cell label="EmptyState">
                        <EmptyState
                            icon={Info}
                            title="Belum ada data"
                            desc="Data akan muncul setelah ada aktivitas pertama."
                            action={<PrimaryButton>Tambah data</PrimaryButton>}
                        />
                    </Cell>
                    <Cell label="Stepper">
                        <Stepper steps={['Diajukan', 'Diverifikasi', 'Selesai']} current={1} />
                    </Cell>
                </Grid>
            </Section>

            {/* ---------- Modal ---------- */}
            <Section title="Modal">
                <PrimaryButton onClick={() => setModal(true)}>Buka Modal</PrimaryButton>
                <Modal
                    open={modal}
                    onClose={() => setModal(false)}
                    title="Konfirmasi premium"
                    description="Modal dengan garis gradasi gold → teal di bagian atas, bayangan berlapis, dan focus ring."
                    size="md"
                    footer={
                        <>
                            <SecondaryButton onClick={() => setModal(false)}>Batal</SecondaryButton>
                            <PrimaryButton onClick={() => setModal(false)}>Simpan</PrimaryButton>
                        </>
                    }
                >
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        Isi modal. Perhatikan garis dekoratif di atas dan bayangan halus di sekeliling panel.
                    </p>
                </Modal>
            </Section>

            {/* ---------- FlashToast ---------- */}
            <Section title="FlashToast (statis)">
                <div className="space-y-3">
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-l-4 p-4 shadow-[var(--shadow-layered)]"
                        style={{ borderColor: 'var(--color-border)', borderLeftColor: 'var(--color-success)', background: 'var(--color-bg)' }}
                    >
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-success)' }} />
                        <div className="flex-1 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Pesanan berhasil diverifikasi.</div>
                        <button type="button" className="rounded-full p-1 text-[var(--color-muted)]"><X className="h-4 w-4" /></button>
                    </div>
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-l-4 p-4 shadow-[var(--shadow-layered)]"
                        style={{ borderColor: 'var(--color-border)', borderLeftColor: 'var(--color-danger)', background: 'var(--color-bg)' }}
                    >
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-danger)' }} />
                        <div className="flex-1 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Terjadi kesalahan saat menyimpan.</div>
                        <button type="button" className="rounded-full p-1 text-[var(--color-muted)]"><X className="h-4 w-4" /></button>
                    </div>
                </div>
            </Section>

            {/* ---------- Dark panel examples ---------- */}
            <Section title="Komponen di Latar Gelap (sidebar / auth panel)" dark>
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="rounded-full px-6 py-2.5 text-sm font-semibold transition duration-150 hover:bg-[var(--color-dark-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2" style={{ background: 'var(--color-gold)', color: 'var(--color-deep)' }}>
                            Gold CTA
                        </button>
                        <button className="rounded-full border px-6 py-2.5 text-sm font-semibold transition duration-150 hover:bg-[var(--color-dark-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark-text)]" style={{ borderColor: 'var(--color-dark-border)', color: 'var(--color-dark-text)' }}>
                            Outline gelap
                        </button>
                        <button className="rounded-full px-6 py-2.5 text-sm font-semibold transition duration-150 hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
                            Teal CTA
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'color-mix(in srgb, var(--color-gold) 22%, transparent)', color: 'var(--color-gold)' }}>Gold badge</span>
                        <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>Teal badge</span>
                    </div>
                    <div className="rounded-[22px] border border-[var(--color-dark-border)] bg-[var(--color-deep)] p-5" style={{ boxShadow: 'var(--shadow-layered)' }}>
                        <h3 className="font-display font-bold" style={{ color: 'var(--color-dark-text)' }}>Panel gelap</h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-dark-muted)' }}>
                            Latar teal gelap dengan teks putih dan muted kebiruan. Logo putih cocok di sini.
                        </p>
                        <div className="mt-4">
                            <SwooshLine size="sm" opacity={0.2} color="var(--color-gold)" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ---------- Existing form components (unchanged, regression check) ---------- */}
            <Section title="TextInput (ui wrapper)">
                <Grid>
                    <Cell label="Default">
                        <UiTextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis sesuatu…" />
                    </Cell>
                    <Cell label="With label + hint">
                        <UiTextInput label="Nama" hint="Muncul di katalog" value={text} onChange={(e) => setText(e.target.value)} />
                    </Cell>
                    <Cell label="Error">
                        <UiTextInput label="Email" error="Email tidak valid" value="salah" onChange={() => {}} />
                    </Cell>
                    <Cell label="Required + disabled">
                        <UiTextInput label="Kode" required disabled value="PNJ-001" onChange={() => {}} />
                    </Cell>
                    <Cell label="Inside Field (context error)">
                        <Field label="Nama layanan" required hint="Wajib diisi" error="Nama layanan wajib diisi">
                            <UiTextInput />
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
                    tabs={[
                        { label: 'Jasa' },
                        { label: 'Produk' },
                    ]}
                    defaultIndex={0}
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
                <PrimaryButton onClick={() => setModal(true)}>
                    <Plus className="h-4 w-4" /> Buka modal
                </PrimaryButton>

                <Modal
                    open={modal}
                    onClose={() => setModal(false)}
                    title="Modal dengan kontrol"
                    description="Buka Select/Combobox untuk memastikan popover muncul di atas modal."
                    size="lg"
                    footer={
                        <>
                            <SecondaryButton onClick={() => setModal(false)}>Batal</SecondaryButton>
                            <PrimaryButton onClick={() => setModal(false)}>Simpan</PrimaryButton>
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
