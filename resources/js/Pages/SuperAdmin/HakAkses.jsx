import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Eye,
    Info,
    KeyRound,
    LayoutList,
    Lock,
    RotateCcw,
    Save,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PrimaryButton, SecondaryButton, StatusBadge } from '@/Components/ui';
import Checkbox from '@/Components/ui/Checkbox';
import Switch from '@/Components/ui/Switch';
import Modal from '@/Components/ui/Modal';
import Accordion from '@/Components/ui/Disclosure';
import { ROLE_KEYS, previewMenuForRole, roleLabel } from '@/lib/roles';

/** The full action vocabulary. Per-fitur subsets come from `aksi_tersedia`. */
const AKSI = ['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

/** Actions that are meaningless unless the role can also see the fitur. */
const DEPENDENT = ['Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

/** Fallback for responses (or tests) that omit `locked`. */
const PROTECTED = ['pengguna', 'hak-akses', 'fitur'];

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

/** Actions a fitur exposes; missing/empty falls back to the full set. */
const actionsOf = (f) =>
    Array.isArray(f?.aksi_tersedia) && f.aksi_tersedia.length ? f.aksi_tersedia : AKSI;

const isLocked = (f) => Boolean(f?.locked) || PROTECTED.includes(f?.key);

const PRESETS = [
    {
        key: 'all',
        label: 'Aktifkan semua',
        desc: 'Memberi seluruh aksi yang tersedia pada setiap fitur untuk peran ini.',
    },
    {
        key: 'view',
        label: 'Hanya lihat',
        desc: 'Menyisakan aksi "Lihat" saja; aksi mengubah data dimatikan.',
    },
    {
        key: 'none',
        label: 'Kosongkan',
        desc: 'Menonaktifkan semua aksi untuk peran ini.',
    },
    {
        key: 'default',
        label: 'Kembalikan ke bawaan',
        desc: 'Mengembalikan izin peran ini ke susunan bawaan sistem.',
    },
];

export default function HakAkses({ auth, fitur = [], matriks = {}, roleCounts = {}, bawaan = {} }) {
    const original = useRef(clone(matriks)).current;
    const fiturByKey = useMemo(() => Object.fromEntries(fitur.map((f) => [f.key, f])), [fitur]);

    const [role, setRole] = useState(() => (ROLE_KEYS.includes('admin_rtpu') ? 'admin_rtpu' : ROLE_KEYS[0]));
    const [matrix, setMatrix] = useState(() => clone(matriks));
    const [search, setSearch] = useState('');
    const [closedGroups, setClosedGroups] = useState(() => new Set());
    const [notice, setNotice] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [review, setReview] = useState(false);
    const [preset, setPreset] = useState(null);

    const isSuper = role === 'super_admin';

    /* ---------------- derived data ---------------- */

    const cell = (fkey, aksi) => {
        // Super Admin is always full on the actions a fitur exposes. The server
        // sends this too; deriving it keeps the UI honest for partial fixtures.
        if (isSuper) return actionsOf(fiturByKey[fkey]).includes(aksi);
        return Boolean(matrix?.[role]?.[fkey]?.[aksi]);
    };

    const groups = useMemo(() => {
        const q = search.trim().toLowerCase();
        const map = new Map();
        for (const f of fitur) {
            if (q && !`${f.name} ${f.key}`.toLowerCase().includes(q)) continue;
            const g = f.grup ?? 'Lainnya';
            if (!map.has(g)) map.set(g, []);
            map.get(g).push(f);
        }
        return [...map.entries()].map(([name, items], i) => ({ name, items, index: i }));
    }, [fitur, search]);

    const visibleRows = useMemo(() => groups.flatMap((g) => g.items), [groups]);

    /** role|fitur|aksi -> { before, after } for every unsaved difference. */
    const changes = useMemo(() => {
        const cells = new Map();
        const roles = new Set([...Object.keys(original), ...Object.keys(matrix)]);
        for (const r of roles) {
            const keys = new Set([...Object.keys(original[r] ?? {}), ...Object.keys(matrix[r] ?? {})]);
            for (const k of keys) {
                const aksis = new Set([
                    ...Object.keys(original[r]?.[k] ?? {}),
                    ...Object.keys(matrix[r]?.[k] ?? {}),
                ]);
                for (const a of aksis) {
                    const before = Boolean(original[r]?.[k]?.[a]);
                    const after = Boolean(matrix[r]?.[k]?.[a]);
                    if (before !== after) cells.set(`${r}|${k}|${a}`, { before, after });
                }
            }
        }
        return cells;
    }, [original, matrix]);

    const dirty = changes.size > 0;
    const changedRoles = useMemo(() => {
        const map = new Map();
        for (const [key, v] of changes) {
            const r = key.split('|')[0];
            map.set(r, (map.get(r) ?? 0) + 1);
        }
        return map;
    }, [changes]);

    const preview = useMemo(() => previewMenuForRole(role, matrix, fitur), [role, matrix, fitur]);

    /* ---------------- mutations ---------------- */

    const setCells = (updates) => {
        if (isSuper) return;
        setMatrix((prev) => {
            const next = { ...prev, [role]: { ...(prev[role] ?? {}) } };
            for (const { fkey, aksi, value } of updates) {
                next[role][fkey] = { ...(next[role][fkey] ?? {}), [aksi]: value };
            }
            return next;
        });
    };

    const toggleCell = (f, aksi, value) => {
        if (isSuper) return;
        const acts = actionsOf(f);
        const seen = acts.filter((a) => cell(f.key, a));
        const updates = [{ fkey: f.key, aksi, value }];
        let message = null;

        if (value && DEPENDENT.includes(aksi) && acts.includes('Lihat') && !cell(f.key, 'Lihat')) {
            updates.push({ fkey: f.key, aksi: 'Lihat', value: true });
            message = `"Lihat" otomatis diaktifkan untuk ${f.name} karena aksi ${aksi} membutuhkannya.`;
        }
        if (!value && aksi === 'Lihat') {
            const dropped = DEPENDENT.filter((d) => acts.includes(d) && cell(f.key, d));
            for (const d of dropped) updates.push({ fkey: f.key, aksi: d, value: false });
            if (dropped.length) {
                message = `Aksi ${dropped.join(', ')} pada ${f.name} otomatis dinonaktifkan karena "Lihat" dimatikan.`;
            }
        }

        // Avoid a redundant no-op write.
        if (updates.length === 1 && seen.includes(aksi) === value) return;
        setCells(updates);
        setNotice(message);
    };

    const setRow = (f, value) => {
        if (isSuper) return;
        setCells(actionsOf(f).map((a) => ({ fkey: f.key, aksi: a, value })));
        setNotice(null);
    };

    const setColumn = (aksi, value) => {
        if (isSuper) return;
        const updates = [];
        for (const f of visibleRows) {
            const acts = actionsOf(f);
            if (!acts.includes(aksi)) continue;
            updates.push({ fkey: f.key, aksi, value });
            if (value && DEPENDENT.includes(aksi) && acts.includes('Lihat')) {
                updates.push({ fkey: f.key, aksi: 'Lihat', value: true });
            }
            if (!value && aksi === 'Lihat') {
                for (const d of DEPENDENT) {
                    if (acts.includes(d)) updates.push({ fkey: f.key, aksi: d, value: false });
                }
            }
        }
        setCells(updates);
        setNotice(null);
    };

    const setGroup = (items, value) => {
        if (isSuper) return;
        const updates = [];
        for (const f of items) {
            for (const a of actionsOf(f)) updates.push({ fkey: f.key, aksi: a, value });
        }
        setCells(updates);
        setNotice(null);
    };

    const applyPreset = (key) => {
        if (isSuper) return;
        setMatrix((prev) => {
            const next = { ...prev, [role]: { ...(prev[role] ?? {}) } };
            for (const f of fitur) {
                const row = {};
                for (const a of actionsOf(f)) {
                    if (key === 'all') row[a] = true;
                    else if (key === 'view') row[a] = a === 'Lihat';
                    else if (key === 'none') row[a] = false;
                    else row[a] = Boolean(bawaan?.[role]?.[f.key]?.[a]);
                }
                next[role][f.key] = row;
            }
            return next;
        });
        setNotice(null);
        setPreset(null);
    };

    const cancel = () => {
        setMatrix(clone(original));
        setNotice(null);
    };

    const buildPayload = () => {
        const payload = {};
        for (const [key, v] of changes) {
            const [r, fkey, aksi] = key.split('|');
            if (r === 'super_admin') continue;
            if (!actionsOf(fiturByKey[fkey]).includes(aksi)) continue;
            payload[r] ??= {};
            payload[r][fkey] ??= {};
            payload[r][fkey][aksi] = v.after;
        }
        return payload;
    };

    const save = () => {
        const payload = buildPayload();
        if (Object.keys(payload).length === 0) {
            setReview(false);
            return;
        }
        setProcessing(true);
        router.post(route('superadmin.hakakses.save'), { matriks: payload }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setReview(false);
                setNotice(null);
            },
        });
    };

    const toggleGroup = (name) =>
        setClosedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });

    /* ---------------- aggregate states ---------------- */

    const aggregate = (rows, aksi) => {
        const applicable = rows.filter((f) => actionsOf(f).includes(aksi));
        const on = applicable.filter((f) => cell(f.key, aksi)).length;
        return {
            total: applicable.length,
            checked: applicable.length > 0 && on === applicable.length,
            indeterminate: on > 0 && on < applicable.length,
        };
    };

    const rowState = (f) => {
        const acts = actionsOf(f);
        const on = acts.filter((a) => cell(f.key, a)).length;
        return { checked: acts.length > 0 && on === acts.length, indeterminate: on > 0 && on < acts.length };
    };

    const aksiLabel = (a) => a;

    return (
        <DashboardLayout title="Hak Akses" breadcrumb="Super Admin / Hak Akses" activeKey="hak">
            <Head title="Hak Akses · PNJ Prime" />
            <FadeIn>
                <div className="pb-24">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-2xl">
                            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                                Super Admin
                            </p>
                            <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                                Hak Akses
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                Atur izin setiap peran per fitur. Baris berasal dari daftar Kelola Fitur; perubahan
                                disimpan bersama saat kamu menekan Simpan.
                            </p>
                        </div>
                        <Link
                            href={route('superadmin.fitur')}
                            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
                        >
                            <LayoutList className="h-4 w-4" />
                            Kelola Fitur
                        </Link>
                    </div>

                    <Accordion
                        title="Cara kerja hak akses"
                        description="Model peran × fitur × aksi dan aturan ketergantungan."
                        defaultOpen={false}
                        className="mb-6 bg-white"
                    >
                        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                <span>
                                    Izin berbentuk <strong style={{ color: 'var(--color-ink)' }}>peran × fitur × aksi</strong>.
                                    Aksi: Lihat, Tambah, Ubah, Hapus, Verifikasi.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                <span>
                                    Aksi Tambah/Ubah/Hapus/Verifikasi <strong style={{ color: 'var(--color-ink)' }}>membutuhkan Lihat</strong>.
                                    Mengaktifkannya akan otomatis mengaktifkan Lihat; mematikan Lihat mematikan aksi tersebut.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                <span>
                                    Sel bertanda <strong style={{ color: 'var(--color-ink)' }}>—</strong> berarti fitur tidak menyediakan aksi itu
                                    (atur di Kelola Fitur).
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                <span>
                                    <strong style={{ color: 'var(--color-ink)' }}>Super Admin selalu penuh</strong> dan tidak bisa diubah.
                                    Fitur Pengguna, Hak Akses, dan Kelola Fitur dilindungi agar tidak mengunci akses.
                                </span>
                            </li>
                        </ul>
                    </Accordion>

                    <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <Card className="p-5">
                            <div className="mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                    Pilih peran
                                </h2>
                            </div>
                            <div role="radiogroup" aria-label="Pilih peran" className="grid gap-2 sm:grid-cols-2">
                                {ROLE_KEYS.map((k) => {
                                    const on = role === k;
                                    const lockedRole = k === 'super_admin';
                                    return (
                                        <button
                                            key={k}
                                            type="button"
                                            role="radio"
                                            aria-checked={on}
                                            onClick={() => {
                                                setRole(k);
                                                setNotice(null);
                                            }}
                                            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition"
                                            style={{
                                                borderColor: on ? 'var(--color-accent)' : 'var(--color-border)',
                                                background: on ? 'var(--color-accent-tint)' : 'var(--color-bg)',
                                            }}
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <KeyRound
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ color: on ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                                        {roleLabel(k)}
                                                    </span>
                                                    <span className="block text-[12px]" style={{ color: 'var(--color-muted)' }}>
                                                        {(roleCounts?.[k] ?? 0)} pengguna
                                                    </span>
                                                </span>
                                            </span>
                                            {lockedRole && (
                                                <span
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                                                    style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
                                                >
                                                    <Lock className="h-3 w-3" />
                                                    Terkunci
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="p-5">
                            <div className="mb-3 flex items-center gap-2">
                                <Eye className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                                    Pratinjau menu · {roleLabel(role)}
                                </h2>
                            </div>
                            <p className="mb-3 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                Menu sidebar yang terlihat berdasarkan izin "Lihat" (perubahan belum disimpan ikut
                                dipratinjau).
                            </p>
                            <div data-testid="menu-preview">
                                {preview.length === 0 ? (
                                    <p className="rounded-xl border border-dashed px-3 py-4 text-center text-[13px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                                        Belum ada menu yang terlihat untuk peran ini.
                                    </p>
                                ) : (
                                    <ul className="flex flex-wrap gap-2">
                                        {preview.map((item) => (
                                            <li
                                                key={item.key}
                                                className="rounded-full px-3 py-1 text-[12px] font-medium"
                                                style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                                            >
                                                {item.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </Card>
                    </div>

                    {isSuper ? (
                        <div
                            className="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        >
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                            <p style={{ color: 'var(--color-muted)' }}>
                                <strong style={{ color: 'var(--color-ink)' }}>Super Admin selalu memiliki akses penuh.</strong>{' '}
                                Izin di sini hanya ditampilkan dan tidak dapat diubah. Gunakan Kelola Fitur untuk
                                menentukan aksi yang tersedia pada tiap fitur.
                            </p>
                        </div>
                    ) : (
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-[13px] font-medium" style={{ color: 'var(--color-muted)' }}>
                                Terapkan cepat:
                            </span>
                            {PRESETS.map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => setPreset(p)}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
                                >
                                    {p.key === 'default' && <RotateCcw className="h-3.5 w-3.5" />}
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {notice && (
                        <div
                            role="status"
                            className="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
                            style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)', color: 'var(--color-ink)' }}
                        >
                            <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent-hover)' }} />
                            <p className="min-w-0 flex-1">{notice}</p>
                            <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan" className="text-[12px] font-semibold" style={{ color: 'var(--color-accent-hover)' }}>
                                Tutup
                            </button>
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="relative block w-full max-w-xs">
                            <span className="sr-only">Cari fitur</span>
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                style={{ color: 'var(--color-muted)' }}
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari fitur…"
                                className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            />
                        </label>
                        <div className="flex flex-wrap items-center gap-3 text-[12px]" style={{ color: 'var(--color-muted)' }}>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} /> Diizinkan
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="font-mono">—</span> Tidak tersedia
                            </span>
                        </div>
                    </div>

                    {/* Desktop matrix */}
                    <Card className="hidden overflow-hidden md:block">
                        <div className="max-h-[70vh] overflow-auto">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                                <thead className="sticky top-0 z-20">
                                    <tr>
                                        <th
                                            className="sticky left-0 z-30 border-b px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
                                        >
                                            Fitur
                                        </th>
                                        {AKSI.map((a) => {
                                            const col = aggregate(visibleRows, a);
                                            return (
                                                <th
                                                    key={a}
                                                    className="border-b px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
                                                >
                                                    <span className="mb-1 block">{aksiLabel(a)}</span>
                                                    <span className="flex justify-center">
                                                        <Checkbox
                                                            checked={col.checked}
                                                            indeterminate={col.indeterminate}
                                                            disabled={isSuper || col.total === 0}
                                                            onChange={(v) => setColumn(a, v)}
                                                            aria-label={`Pilih semua aksi ${a} untuk ${roleLabel(role)}`}
                                                        />
                                                    </span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.length === 0 && (
                                        <tr>
                                            <td colSpan={AKSI.length + 1} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                                Tidak ada fitur yang cocok dengan pencarian.
                                            </td>
                                        </tr>
                                    )}
                                    {groups.map((g) => (
                                        <GroupBlock
                                            key={g.name}
                                            group={g}
                                            role={role}
                                            isSuper={isSuper}
                                            closed={closedGroups.has(g.name)}
                                            onToggleOpen={() => toggleGroup(g.name)}
                                            onToggleGroup={(v) => setGroup(g.items, v)}
                                            cell={cell}
                                            rowState={rowState}
                                            changes={changes}
                                            onCell={toggleCell}
                                            onRow={setRow}
                                            fiturByKey={fiturByKey}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile per-fitur disclosure */}
                    <div className="space-y-3 md:hidden">
                        {groups.length === 0 && (
                            <Card className="p-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                Tidak ada fitur yang cocok dengan pencarian.
                            </Card>
                        )}
                        {groups.map((g) => (
                            <div key={g.name} className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                                        {g.name}
                                    </h3>
                                    {(() => {
                                        const gs = aggregateGroup(g.items, cell);
                                        return (
                                            <Checkbox
                                                checked={gs.checked}
                                                indeterminate={gs.indeterminate}
                                                disabled={isSuper}
                                                onChange={(v) => setGroup(g.items, v)}
                                                aria-label={`Pilih semua pada grup ${g.name} (seluler)`}
                                            />
                                        );
                                    })()}
                                </div>
                                {g.items.map((f) => (
                                    <Accordion
                                        key={f.key}
                                        title={f.name}
                                        description={isLocked(f) ? 'Fitur terkunci' : undefined}
                                        className="bg-white"
                                    >
                                        <div className="space-y-3">
                                            {actionsOf(f).map((a) => (
                                                <div key={a} className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                                                        {aksiLabel(a)}
                                                    </span>
                                                    <Switch
                                                        checked={cell(f.key, a)}
                                                        onChange={(v) => toggleCell(f, a, v)}
                                                        disabled={isSuper}
                                                        label={`${f.name}: ${a}`}
                                                    />
                                                </div>
                                            ))}
                                            {!isSuper && actionsOf(f).includes('Lihat') && (
                                                <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
                                                    Aksi mengubah data membutuhkan "Lihat".
                                                </p>
                                            )}
                                        </div>
                                    </Accordion>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>

            {/* Sticky unsaved bar */}
            {dirty && (
                <div
                    data-testid="unsaved-bar"
                    className="fixed inset-x-0 bottom-0 z-[70] border-t px-4 py-3 backdrop-blur sm:px-6"
                    style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)' }}
                >
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
                            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-gold-deep)' }} />
                            <span>
                                <strong>{changes.size}</strong> perubahan belum disimpan
                                {changedRoles.size > 1 ? ` di ${changedRoles.size} peran` : ''}.
                            </span>
                        </p>
                        <div className="flex items-center gap-2">
                            <SecondaryButton type="button" onClick={cancel} disabled={processing}>
                                Batalkan
                            </SecondaryButton>
                            <PrimaryButton type="button" onClick={() => setReview(true)} disabled={processing}>
                                <Save className="h-4 w-4" />
                                Simpan
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Preset confirmation */}
            <Modal
                open={preset !== null}
                onClose={() => setPreset(null)}
                size="sm"
                title={preset?.label}
                description={preset?.desc}
                footer={
                    <>
                        <SecondaryButton type="button" onClick={() => setPreset(null)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={() => applyPreset(preset?.key)}>
                            Terapkan
                        </PrimaryButton>
                    </>
                }
            >
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Perubahan ini mengganti seluruh izin <strong style={{ color: 'var(--color-ink)' }}>{roleLabel(role)}</strong>{' '}
                    pada matriks (belum tersimpan sampai kamu menekan Simpan).
                </p>
            </Modal>

            {/* Review before save */}
            <Modal
                open={review}
                onClose={() => setReview(false)}
                size="lg"
                title="Tinjau perubahan hak akses"
                description="Periksa perubahan sebelum menyimpan."
                dismissible={!processing}
                footer={
                    <>
                        <SecondaryButton type="button" onClick={() => setReview(false)} disabled={processing}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={save} disabled={processing}>
                            {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                        </PrimaryButton>
                    </>
                }
            >
                <ChangeSummary changes={changes} fiturByKey={fiturByKey} />
            </Modal>
        </DashboardLayout>
    );
}

/* ---------------- helpers ---------------- */

function GroupBlock({ group, role, isSuper, closed, onToggleOpen, onToggleGroup, cell, rowState, changes, onCell, onRow, fiturByKey }) {
    const headerState = aggregateGroup(group.items, cell);

    return (
        <>
            <tr>
                <th
                    colSpan={AKSI.length + 1}
                    className="sticky left-0 border-b px-5 py-2 text-left"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggleOpen}
                            aria-expanded={!closed}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${closed ? '-rotate-90' : ''}`} />
                            {group.name}
                            <span className="font-normal normal-case">({group.items.length})</span>
                        </button>
                        <Checkbox
                            checked={headerState.checked}
                            indeterminate={headerState.indeterminate}
                            disabled={isSuper}
                            onChange={onToggleGroup}
                            aria-label={`Pilih semua pada grup ${group.name}`}
                        />
                    </div>
                </th>
            </tr>
            {!closed &&
                group.items.map((f) => {
                    const st = rowState(f);
                    const acts = actionsOf(f);
                    const rowChanged = Boolean(changesRowKey(changes, role, f.key));
                    return (
                        <tr key={f.key} className="group transition-colors hover:bg-[var(--color-surface)]">
                            <td
                                className="sticky left-0 border-b px-5 py-3"
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={st.checked}
                                        indeterminate={st.indeterminate}
                                        disabled={isSuper}
                                        onChange={(v) => onRow(f, v)}
                                        aria-label={`Pilih semua aksi ${f.name}`}
                                    />
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                                            {f.name}
                                            {rowChanged && <span aria-label="Ada perubahan" style={{ color: 'var(--color-accent)' }}>•</span>}
                                            {isLocked(f) && <Lock className="h-3.5 w-3.5" style={{ color: 'var(--color-muted)' }} />}
                                        </span>
                                        <span className="block font-mono text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                            {f.key}
                                        </span>
                                    </span>
                                </div>
                            </td>
                            {AKSI.map((a) => {
                                const available = acts.includes(a);
                                const changed = changes.has(`${role}|${f.key}|${a}`);
                                return (
                                    <td
                                        key={a}
                                        className="border-b px-3 py-3 text-center"
                                        style={{
                                            borderColor: 'var(--color-border)',
                                            background: changed ? 'var(--color-accent-tint)' : undefined,
                                        }}
                                    >
                                        {available ? (
                                            <span className="flex justify-center">
                                                <Checkbox
                                                    checked={cell(f.key, a)}
                                                    disabled={isSuper}
                                                    onChange={(v) => onCell(f, a, v)}
                                                    aria-label={`${f.name}: ${a} untuk ${roleLabel(role)}`}
                                                />
                                            </span>
                                        ) : (
                                            <span title={`Aksi ${a} tidak tersedia untuk fitur ini`} style={{ color: 'var(--color-muted)' }}>
                                                —
                                            </span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
        </>
    );
}

function aggregateGroup(items, cell) {
    const all = items.flatMap((f) => actionsOf(f).map((a) => cell(f.key, a)));
    const on = all.filter(Boolean).length;
    return { checked: all.length > 0 && on === all.length, indeterminate: on > 0 && on < all.length };
}

function changesRowKey(changes, role, fkey) {
    const prefix = `${role}|${fkey}|`;
    for (const key of changes.keys()) {
        if (key.startsWith(prefix)) return true;
    }
    return false;
}

function ChangeSummary({ changes, fiturByKey }) {
    if (changes.size === 0) {
        return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Tidak ada perubahan.</p>;
    }
    const byRole = new Map();
    for (const [key, v] of changes) {
        const [r, fkey, aksi] = key.split('|');
        if (!byRole.has(r)) byRole.set(r, []);
        byRole.get(r).push({ fkey, aksi, ...v });
    }
    return (
        <div className="space-y-4">
            {[...byRole.entries()].map(([r, items]) => (
                <div key={r}>
                    <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {roleLabel(r)} <span style={{ color: 'var(--color-muted)' }}>· {items.length} perubahan</span>
                    </p>
                    <ul className="space-y-1.5">
                        {items.map((it) => (
                            <li
                                key={`${it.fkey}-${it.aksi}`}
                                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px]"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <span style={{ color: 'var(--color-ink)' }}>
                                    {fiturByKey[it.fkey]?.name ?? it.fkey} · {it.aksi}
                                </span>
                                <StatusBadge
                                    label={it.after ? 'Diizinkan' : 'Dicabut'}
                                    tone={it.after ? 'teal' : 'neutral'}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
