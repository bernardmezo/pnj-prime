import { Head, router } from '@inertiajs/react';
import { ChevronRight, Plus, Tag } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { useConfirm } from '@/Components/ConfirmDialog';
import AlertBanner from '@/Components/AlertBanner';

export default function KategoriIndex({ auth, parents = [] }) {
    const { confirm, ConfirmUI } = useConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', parent_id: '', sort_order: 50, is_active: true });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.parent_id) {
            setError('Nama dan kategori tipe wajib diisi.');
            return;
        }
        setError('');
        if (editing) {
            router.patch(route('superadmin.kategori.update', editing), form, {
                preserveScroll: true,
                onSuccess: () => { setShowForm(false); setEditing(null); setForm({ name: '', parent_id: '', sort_order: 50, is_active: true }); },
            });
        } else {
            router.post(route('superadmin.kategori.store'), form, {
                preserveScroll: true,
                onSuccess: () => { setShowForm(false); setForm({ name: '', parent_id: '', sort_order: 50, is_active: true }); },
            });
        }
    };

    const handleToggle = async (id, name, isActive) => {
        const ok = await confirm({
            title: isActive ? 'Nonaktifkan sub-kategori?' : 'Aktifkan sub-kategori?',
            message: isActive ? `"${name}" akan disembunyikan dari form produk baru.` : `"${name}" akan tersedia lagi di form produk.`,
            confirmLabel: isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
            danger: isActive,
        });
        if (ok) router.patch(route('superadmin.kategori.toggle', id), {}, { preserveScroll: true });
    };

    const startEdit = (cat) => {
        setEditing(cat.id);
        setForm({ name: cat.name, parent_id: cat.parent_id ?? '', sort_order: cat.sort_order ?? 50, is_active: cat.is_active });
        setShowForm(true);
    };

    return (
        <DashboardLayout title="Kelola Kategori" activeKey="kategori">
            <Head title="Kelola Kategori Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Super Admin"
                    title="Kelola Kategori Produk"
                    desc="Tambah, ubah, dan aktifkan/nonaktifkan sub-kategori yang dipakai di form produk."
                />

                {/* Tambah / Edit Form */}
                <Card className="p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                            {editing ? 'Ubah Sub-kategori' : 'Tambah Sub-kategori Baru'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => { setShowForm(!showForm); if (editing) { setEditing(null); setForm({ name: '', parent_id: '', sort_order: 50, is_active: true }); } }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition"
                            style={{ background: 'var(--color-accent)' }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {showForm ? 'Tutup' : 'Tambah'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Nama Sub-kategori *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="mis. Alat Ukur Tekanan"
                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-sm bg-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Tipe (Parent) *</label>
                                <select
                                    value={form.parent_id}
                                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-sm bg-white"
                                    required
                                >
                                    <option value="" disabled>Pilih tipe</option>
                                    {parents.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">Urutan</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                                    className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-sm bg-white"
                                />
                            </div>
                            {editing && (
                                <div className="flex items-center gap-2 sm:col-span-3">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                            className="rounded"
                                        />
                                        Aktif
                                    </label>
                                </div>
                            )}
                            {error && <div className="sm:col-span-3"><AlertBanner type="error" message={error} /></div>}
                            <div className="sm:col-span-3">
                                <button type="submit" className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition" style={{ background: 'var(--color-accent)' }}>
                                    {editing ? 'Simpan Perubahan' : 'Tambah Sub-kategori'}
                                </button>
                            </div>
                        </form>
                    )}
                </Card>

                {/* List kategori per parent */}
                <div className="space-y-6">
                    {parents.length === 0 ? (
                        <EmptyState icon={Tag} title="Belum ada kategori" desc="Kategori tipe akan muncul di sini." />
                    ) : (
                        parents.map((parent) => (
                            <Card key={parent.id} className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <ChevronRight className="h-4 w-4 text-[var(--color-accent)]" />
                                    <h3 className="text-sm font-bold text-[var(--color-ink)]">{parent.name}</h3>
                                    <StatusBadge status={parent.is_active ? 'aktif' : 'nonaktif'} />
                                </div>
                                {parent.children.length === 0 ? (
                                    <p className="text-xs text-[var(--color-muted)] italic">Belum ada sub-kategori.</p>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {parent.children.map((child) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center justify-between rounded-xl border p-3 text-sm"
                                                style={{
                                                    borderColor: 'var(--color-border)',
                                                    background: child.is_active ? 'var(--color-bg)' : 'var(--color-surface)',
                                                    opacity: child.is_active ? 1 : 0.6,
                                                }}
                                            >
                                                <div>
                                                    <p className="font-semibold text-[var(--color-ink)]">{child.name}</p>
                                                    <p className="text-xs text-[var(--color-muted)]">
                                                        {child.products_count ?? 0} produk · urutan {child.sort_order}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(child)}
                                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] transition"
                                                    >
                                                        Ubah
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle(child.id, child.name, child.is_active)}
                                                        className="rounded-lg px-2 py-1 text-xs font-semibold transition"
                                                        style={{ color: child.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}
                                                    >
                                                        {child.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </FadeIn>
            {ConfirmUI}
        </DashboardLayout>
    );
}
