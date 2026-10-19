import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ConfirmModal, EmptyState, FadeIn, PageHeader, PrimaryButton, StatusBadge, Table, Td } from '@/Components/ui';
import TextInput from '@/Components/ui/TextInput';
import Textarea from '@/Components/ui/Textarea';
import NumberStepper from '@/Components/ui/NumberStepper';
import CheckboxGroup from '@/Components/ui/CheckboxGroup';
import Switch from '@/Components/ui/Switch';

const AKSI = ['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

const EMPTY = { name: '', key: '', desc: '', active: true, grup: 'Lainnya', urutan: 0, aksi_tersedia: AKSI };

/** Fallback for responses that predate the `locked` flag. */
const PROTECTED_FITUR = ['pengguna', 'hak-akses', 'fitur'];

const isLocked = (f) => Boolean(f?.locked) || PROTECTED_FITUR.includes(f?.key);

const actionsOf = (f) =>
    Array.isArray(f?.aksi_tersedia) && f.aksi_tersedia.length ? f.aksi_tersedia : AKSI;

export default function FiturIndex({ auth, fitur = [] }) {
    const rows = fitur;
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm(EMPTY);

    const openAdd = () => {
        setEditing('new');
        reset();
        setData(EMPTY);
    };
    const openEdit = (f) => {
        setEditing(f.key);
        setData({
            name: f.name,
            key: f.key,
            desc: f.desc ?? '',
            active: f.active,
            grup: f.grup ?? 'Lainnya',
            urutan: Number(f.urutan ?? 0),
            aksi_tersedia: actionsOf(f),
        });
    };
    const save = () => {
        if (editing === 'new') {
            post(route('superadmin.fitur.store'), { onSuccess: () => setEditing(null) });
        } else {
            patch(route('superadmin.fitur.update', editing), { onSuccess: () => setEditing(null) });
        }
    };

    const lockedEditing = editing !== 'new' && PROTECTED_FITUR.includes(data.key);

    return (
        <DashboardLayout title="Kelola Fitur" breadcrumb="Super Admin / Kelola Fitur" activeKey="fitur">
            <Head title="Kelola Fitur · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Kelola Fitur"
                    desc="Modul dan menu yang menjadi baris pada matriks Hak Akses. Atur grup, urutan tampil, dan aksi yang tersedia."
                    actions={
                        <>
                            <Link
                                href={route('superadmin.hakakses')}
                                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
                            >
                                <KeyRound className="h-4 w-4" />
                                Atur akses →
                            </Link>
                            <PrimaryButton onClick={openAdd}>+ Tambah Fitur</PrimaryButton>
                        </>
                    }
                />
                {rows.length === 0 ? (
                    <EmptyState title="Belum ada fitur" desc="Tambahkan fitur pertama." />
                ) : (
                    <Table columns={['Nama Fitur', 'Grup', 'Aksi tersedia', 'Urutan', 'Status', '']}>
                        <tbody>
                            {rows.map((f) => (
                                <tr key={f.key} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>
                                        <span className="flex items-center gap-2">
                                            {f.name}
                                            {isLocked(f) && <Lock className="h-3.5 w-3.5" style={{ color: 'var(--color-muted)' }} />}
                                        </span>
                                        <span className="mt-0.5 block font-mono text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                            {f.key}
                                        </span>
                                    </Td>
                                    <Td>
                                        <StatusBadge label={f.grup ?? 'Lainnya'} tone="neutral" />
                                    </Td>
                                    <Td>
                                        <span className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
                                            {actionsOf(f).join(', ')}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="font-mono text-[12px]" style={{ color: 'var(--color-muted)' }}>
                                            {f.urutan ?? 0}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="flex flex-wrap items-center gap-2">
                                            <StatusBadge label={f.active ? 'Aktif' : 'Nonaktif'} tone={f.active ? 'teal' : 'muted'} />
                                            {isLocked(f) && (
                                                <StatusBadge label="Terkunci" tone="neutral" />
                                            )}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="flex flex-wrap gap-3">
                                            <button type="button" onClick={() => openEdit(f)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Ubah
                                            </button>
                                            {isLocked(f) ? (
                                                <span className="text-sm" style={{ color: 'var(--color-muted)' }} title="Fitur dilindungi agar tidak terkunci">
                                                    Dilindungi
                                                </span>
                                            ) : (
                                                <button type="button" onClick={() => setDel(f)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                    Hapus
                                                </button>
                                            )}
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <ConfirmModal
                    open={editing !== null}
                    title={editing === 'new' ? 'Tambah Fitur' : 'Ubah Fitur'}
                    onConfirm={save}
                    onClose={() => setEditing(null)}
                    confirmLabel="Simpan"
                    processing={processing}
                >
                    <div className="space-y-3">
                        <TextInput
                            label="Nama fitur"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        {editing === 'new' && (
                            <TextInput
                                label="Kunci"
                                value={data.key}
                                onChange={(e) => setData('key', e.target.value)}
                                placeholder="mis. katalog"
                                hint="Huruf kecil, angka, dan tanda hubung."
                                error={errors.key}
                            />
                        )}
                        <Textarea
                            label="Deskripsi"
                            rows={2}
                            value={data.desc}
                            onChange={(e) => setData('desc', e.target.value)}
                            error={errors.desc}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <TextInput
                                label="Grup"
                                value={data.grup}
                                onChange={(e) => setData('grup', e.target.value)}
                                hint="Mengelompokkan baris pada matriks."
                                error={errors.grup}
                            />
                            <NumberStepper
                                label="Urutan tampil"
                                min={0}
                                value={data.urutan}
                                onChange={(v) => setData('urutan', v)}
                                error={errors.urutan}
                            />
                        </div>
                        <CheckboxGroup
                            label="Aksi tersedia"
                            value={data.aksi_tersedia}
                            onChange={(v) => setData('aksi_tersedia', v)}
                            options={AKSI.map((a) => ({ value: a, label: a }))}
                            orientation="horizontal"
                            selectAll
                            hint="Aksi di luar daftar ini tidak dapat diberikan di matriks Hak Akses."
                            error={errors.aksi_tersedia}
                        />
                        <div
                            className="rounded-xl border px-3 py-3"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        >
                            <Switch
                                checked={data.active}
                                onChange={(v) => setData('active', v)}
                                disabled={lockedEditing}
                                label="Aktif"
                                description={
                                    lockedEditing
                                        ? 'Fitur ini dilindungi agar tidak mengunci akses Super Admin.'
                                        : 'Nonaktifkan untuk menyembunyikan fitur dari menu.'
                                }
                            />
                        </div>
                        {lockedEditing && (
                            <p className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--color-muted)' }}>
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                Fitur Pengguna, Hak Akses, dan Kelola Fitur selalu aktif demi mencegah terkunci dari sistem.
                            </p>
                        )}
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    open={del !== null}
                    title={`Hapus "${del?.name}"?`}
                    desc="Izin yang memakai fitur ini ikut terhapus. Tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Ya, hapus"
                    danger
                    onConfirm={() => {
                        router.delete(route('superadmin.fitur.destroy', del.key), {
                            onFinish: () => setDel(null),
                        });
                    }}
                    onClose={() => setDel(null)}
                />
            </FadeIn>
        </DashboardLayout>
    );
}
