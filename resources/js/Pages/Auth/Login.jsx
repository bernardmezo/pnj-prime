import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SsoButton from '@/Components/SsoButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
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

export function LoginForm({ status, canResetPassword }) {
    // Existing Laravel login contract: email, password, remember.
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            {/* 1 — SSO for civitas PNJ */}
            <SsoButton />

            {/* 2 — divider */}
            <div className="my-6 flex items-center gap-3" aria-hidden={false}>
                <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                    atau masuk sebagai pengguna eksternal
                </span>
                <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* 3 — external login form */}
            {status && (
                <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                    {status}
                </div>
            )}
            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Kata sandi" />
                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full pr-11"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                        <span className="ms-2 text-sm" style={{ color: 'var(--color-muted)' }}>Ingat saya</span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-medium underline underline-offset-2"
                            style={{ color: 'var(--color-accent-hover)' }}
                        >
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Memproses…' : 'Masuk'}
                </PrimaryButton>

                {/* 4 — helper line */}
                <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    Pengguna eksternal perlu mendaftar terlebih dahulu.{' '}
                    <Link href={route('register')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                        Daftar di sini
                    </Link>
                </p>
            </form>
        </>
    );
}

export default function Login({ status, canResetPassword }) {
    return (
        <AuthLayout title="Selamat datang kembali" subtitle="Civitas PNJ masuk dengan SSO; pengguna eksternal masuk dengan email dan kata sandi.">
            <Head title="Masuk" />
            <AuthTabs active="login" />
            <LoginForm status={status} canResetPassword={canResetPassword} />
        </AuthLayout>
    );
}
