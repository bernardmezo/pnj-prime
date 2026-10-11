import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, ConfirmModal, EmptyState, FadeIn, Field, PageHeader, PrimaryButton, StatusBadge, Table, Td, inputClass, inputStyleProps } from '@/Components/ui';
import { mockMetode } from '@/mocks/data';

// TODO(backend): no payment-method routes yet. Add/edit/delete are local
// state only, with a neutral notice; nothing is sent.
let nextId = 100;

export default function MetodeIndex({ auth, metode }) {
    const [rows, setRows] = useState(metode ?? mockMetode);
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'Transfer Bank', account: '', holder: '', instructions: '', active: true });
    const [notice, setNotice] = useState(null);

    const openAdd = () => {
        setEditing('new');
        setForm({ name: '', type: 'Transfer Bank', account: '', holder: '', instructions: '', active: true });
    };
    const openEdit = (m) => {
        setEditing(m.id);
        setForm({ name: m.name, type: m.type, account: m.account, holder: m.holder, instructions: m.instructions, active: m.active });
    };
    const save = () => {
        if (editing === 'new') {
            setRows((r) => [...r, { ...form, id: nextId++ }]);
        } else {
            setRows((r) => r.map((x) => (x.id === editing ? { ...x, ...form } : x)));
        }
        setEditing(null);
        setNotice('Perubahan tersimpan lokal (pratinjau). Backend perlu menyediakan endpoint kelola metode pembayaran.');
    };

    return (
        <DashboardLayout title="Metode Pembayaran" breadcrumb="Admin RTPU / Metode Pembayaran" activeKey="metode">
            <Head title="Metode Pembayaran · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Kelola Metode Pembayaran"
                    desc="Daftar metode yang bisa dipilih Customer saat membayar."
                    actions={<PrimaryButton onClick={openAdd}>+ Tambah Metode</PrimaryButton>}
                />
                {notice && (
                    <p className="mb-4 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                        {notice}
                    </p>
                )}
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada metode pembayaran" desc="Tambahkan metode pertama." />
                ) : (
                    <Table columns={['Nama Metode', 'Tipe', 'Nomor / VA', 'Status', '']}>
                        <tbody>
                            {rows.map((m) => (
                                <tr key={m.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{m.name}</Td>
                                    <Td>{m.type}</Td>
                                    <Td className="font-mono">{m.account}</Td>
                                    <Td><StatusBadge label={m.active ? 'Aktif' : 'Nonaktif'} tone={m.active ? 'teal' : 'muted'} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <button type="button" onClick={() => openEdit(m)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </button>
                                            <button type="button" onClick={() => setDel(m)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                Hapus
                                            </button>
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <ConfirmModal
                    open={editing !== null}
                    title={editing === 'new' ? 'Tambah Metode' : 'Ubah Metode'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                >
                    <div className="space-y-3">
                        <Field label="Nama metode">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Transfer Bank BNI" className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Tipe">
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass} {...inputStyleProps()}>
                                {['Transfer Bank', 'Virtual Account', 'Tunai', 'Lainnya'].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Field label="Nomor rekening / VA">
                            <input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Atas nama">
                            <input value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <Field label="Instruksi">
                            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className={inputClass} {...inputStyleProps()} />
                        </Field>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-accent)' }} />
                            Aktif (bisa dipilih Customer)
                        </label>
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Penghapusan belum tersedia. Backend perlu menyediakan endpoint hapus metode pembayaran."
                    confirmLabel="Mengerti"
                    onConfirm={() => setDel(null)}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
