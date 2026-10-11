import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SsoButton from '@/Components/SsoButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

function AuthTabs({ active }) {
    const tabs = [
        { key: 'login', label: 'Masuk', href: 'login' },
        { key: 'register', label: 'Daftar', href: 'register' },
    ];
    return (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }} role="tablist">
            {tabs.map((t) => {
                const on = active === t.key;
                let href = '#';
                try { href = route(t.href); } catch { href = '#'; }
                return (
                    <Link
                        key={t.key}
                        href={href}
                        role="tab"
                        aria-selected={on}
                        className="rounded-full py-2 text-center text-sm font-semibold transition"
                        style={on
                            ? { background: 'var(--color-accent)', color: 'var(--color-bg)' }
                            : { color: 'var(--color-muted)' }}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}

const USER_TYPES = [
    'Masyarakat umum',
    'Industri/Perusahaan',
    'Mitra kerja sama',
    'Perguruan tinggi/lembaga lain',
];

export default function Register() {
    const [segment, setSegment] = useState('external');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [extraOpen, setExtraOpen] = useState(false);
    const [registered, setRegistered] = useState(false);

    // Existing backend contract persists: name, email, password(+confirmed),
    // phone, institution. user_type, nik_npwp, and terms are included in the
    // payload but NOT persisted yet — see BACKEND HANDOFF in the report.
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        user_type: '',
        institution: '',
        phone: '',
        password: '',
        password_confirmation: '',
        nik_npwp: '',
        terms: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onSuccess: () => setRegistered(true),
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Buat akun PNJ Prime" subtitle="Civitas PNJ otomatis lewat SSO; pengguna eksternal mendaftar lewat formulir.">
            <Head title="Daftar" />
            <AuthTabs active="register" />

            {/* 1 — segmented control */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }} role="tablist" aria-label="Jenis pendaftar">
                {[
                    ['civitas', 'Civitas PNJ'],
                    ['external', 'Pengguna Eksternal'],
                ].map(([key, label]) => {
                    const on = segment === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setSegment(key)}
                            className="rounded-xl py-2.5 text-sm font-semibold transition"
                            style={on
                                ? { background: 'var(--color-bg)', color: 'var(--color-ink)', boxShadow: '0 1px 4px rgba(6,59,52,0.12)' }
                                : { color: 'var(--color-muted)' }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* 2 — Civitas PNJ: no form, SSO only */}
            {segment === 'civitas' && (
                <div>
                    <div className="mb-4 rounded-2xl p-5" style={{ background: 'var(--color-accent-tint)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            Akun civitas PNJ dibuat otomatis melalui SSO
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                            Cukup masuk dengan akun PNJ Anda — tidak perlu mengisi formulir pendaftaran.
                        </p>
                    </div>
                    <SsoButton />
                </div>
            )}

            {/* 3 — Pengguna Eksternal registration form */}
            {segment === 'external' && registered && (
                <div className="py-2 text-center" role="status">
                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                        <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                        Pendaftaran berhasil
                    </h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: 'var(--color-muted)' }}>
                        Silakan masuk dengan email dan kata sandi Anda.
                    </p>
                    <Link
                        href={route('login')}
                        className="mt-5 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-px"
                        style={{ background: 'var(--color-accent)' }}
                    >
                        Ke Halaman Masuk
                    </Link>
                </div>
            )}

            {segment === 'external' && !registered && (
                <form onSubmit={submit} noValidate>
                    <div>
                        <InputLabel htmlFor="name" value="Nama lengkap" />
                        <TextInput id="name" name="name" value={data.name} className="mt-1 block w-full" autoComplete="name" isFocused={true} onChange={(e) => setData('name', e.target.value)} required placeholder="Nama sesuai identitas" />
                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="email" onChange={(e) => setData('email', e.target.value)} required placeholder="nama@email.com" />
                        <InputError message={errors.email} className="mt-2" />
                        {!errors.email && <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>Gunakan email aktif — untuk masuk dan notifikasi pesanan.</p>}
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="user_type" value="Jenis pengguna" />
                        <select
                            id="user_type"
                            value={data.user_type}
                            onChange={(e) => setData('user_type', e.target.value)}
                            className="mt-1 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            required
                        >
                            <option value="">Pilih jenis pengguna…</option>
                            {USER_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <InputError message={errors.user_type} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="institution" value="Instansi/organisasi" />
                        <TextInput id="institution" name="institution" value={data.institution} className="mt-1 block w-full" autoComplete="organization" onChange={(e) => setData('institution', e.target.value)} placeholder="Nama perusahaan, komunitas, atau kampus" />
                        <InputError message={errors.institution} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="phone" value="Nomor telepon/WhatsApp" />
                        <TextInput id="phone" type="tel" name="phone" value={data.phone} className="mt-1 block w-full" autoComplete="tel" onChange={(e) => setData('phone', e.target.value)} placeholder="08…" />
                        <InputError message={errors.phone} className="mt-2" />
                        {!errors.phone && <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>Format: angka, diawali 08, 10–15 digit.</p>}
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Kata sandi" />
                        <div className="relative">
                            <TextInput id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} required />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-2" />
                        {!errors.password && <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>Minimal 8 karakter.</p>}
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi kata sandi" />
                        <div className="relative">
                            <TextInput id="password_confirmation" type={showConfirm ? 'text' : 'password'} name="password_confirmation" value={data.password_confirmation} className="mt-1 block w-full pr-11" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} required />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1" style={{ color: 'var(--color-muted)' }}>
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {/* Optional extras */}
                    <div className="mt-4 rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                        <button type="button" onClick={() => setExtraOpen((v) => !v)} aria-expanded={extraOpen} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            Data tambahan (opsional)
                            <ChevronDown className={`h-4 w-4 transition-transform ${extraOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-muted)' }} />
                        </button>
                        {extraOpen && (
                            <div className="px-4 pb-4">
                                <InputLabel htmlFor="nik_npwp" value="NIK/NPWP (opsional)" />
                                <TextInput id="nik_npwp" name="nik_npwp" value={data.nik_npwp} className="mt-1 block w-full" onChange={(e) => setData('nik_npwp', e.target.value)} placeholder="Belum wajib diisi" />
                                <InputError message={errors.nik_npwp} className="mt-2" />
                            </div>
                        )}
                    </div>

                    <label className="mt-4 flex cursor-pointer items-start gap-2.5">
                        <Checkbox name="terms" checked={data.terms} onChange={(e) => setData('terms', e.target.checked)} className="mt-0.5" />
                        <span className="text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                            Saya menyetujui Syarat &amp; Ketentuan dan Kebijakan Privasi
                        </span>
                    </label>
                    <InputError message={errors.terms} className="mt-2" />

                    <PrimaryButton className="mt-6 w-full" disabled={processing}>
                        {processing ? 'Memproses…' : 'Daftar'}
                    </PrimaryButton>
                </form>
            )}
        </AuthLayout>
    );
}
