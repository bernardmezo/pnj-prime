import Checkbox from '@/Components/ui/Checkbox';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SsoButton from '@/Components/SsoButton';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';

function AuthTabs({ active }) {
    const tabs = [
        { key: 'login', label: 'Masuk', href: 'login' },
        { key: 'register', label: 'Daftar', href: 'register' },
    ];
    return (
        <div className="mb-8 flex gap-7 border-b" style={{ borderColor: 'var(--color-border)' }} role="tablist">
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
                        className="relative pb-2.5 font-display text-lg font-bold transition"
                        style={{ color: on ? 'var(--color-ink)' : 'var(--color-muted)' }}
                    >
                        {t.label}
                        {on && (
                            <span
                                className="absolute inset-x-0 -bottom-px h-[3px] rounded-full"
                                style={{ background: 'var(--color-accent)' }}
                            />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

/**
 * State-driven floating-label field. The label floats whenever the field
 * is focused or has a value, so it can never overlap typed text.
 */
function AuthField({ id, label, error, icon: Icon, hint, trailing, onFocus, onBlur, ...props }) {
    const [focused, setFocused] = useState(false);
    const value = props.value ?? '';
    const floated = focused || String(value).length > 0;
    return (
        <div>
            <div
                className="relative rounded-xl border bg-white transition"
                style={{
                    borderColor: error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-border)',
                    boxShadow: focused && !error ? '0 0 0 3px var(--color-accent-tint)' : 'none',
                }}
            >
                {Icon && (
                    <Icon
                        aria-hidden
                        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                        style={{ color: error ? 'var(--color-danger)' : focused ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                    />
                )}
                <input
                    id={id}
                    {...props}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                    className="block w-full bg-transparent text-[15px] outline-none"
                    style={{ color: 'var(--color-ink)', padding: '22px 16px 8px 48px' }}
                />
                {trailing}
                <label
                    htmlFor={id}
                    aria-hidden
                    className="pointer-events-none absolute transition-all duration-200"
                    style={{
                        left: 48,
                        top: floated ? 7 : '50%',
                        transform: floated ? 'none' : 'translateY(-50%)',
                        fontSize: floated ? 12 : 15,
                        color: error ? 'var(--color-danger)' : focused ? 'var(--color-accent-hover)' : 'var(--color-muted)',
                    }}
                >
                    {label}
                </label>
            </div>
            {error ? <InputError message={error} className="mt-2" /> : hint ? (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>
            ) : null}
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
    const [capsOn, setCapsOn] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const trackCaps = (e) => {
        if (typeof e.getModifierState === 'function') {
            setCapsOn(e.getModifierState('CapsLock'));
        }
    };

    return (
        <>
            {/* SSO for civitas PNJ */}
            <p className="mb-2 text-[13px] font-medium" style={{ color: 'var(--color-muted)' }}>
                Civitas PNJ (masuk dengan SSO)
            </p>
            <SsoButton />

            <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>
                    Eksternal
                </span>
                <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
            </div>

            {status && (
                <div className="mb-5 border-l-[3px] py-1 pl-3 text-sm font-medium" role="status" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                    {status}
                </div>
            )}
            {(errors.email || errors.password) && (
                <div className="mb-5 border-l-[3px] py-1 pl-3 text-sm font-medium" role="alert" style={{ borderColor: 'var(--color-danger)', background: 'var(--color-danger-tint)', color: 'var(--color-danger)' }}>
                    Email atau kata sandi salah.
                </div>
            )}
            <form onSubmit={submit}>
                <AuthField
                    id="email"
                    label="Alamat email"
                    icon={Mail}
                    error={errors.email}
                    hint="Gunakan email yang Anda daftarkan."
                    type="email"
                    name="email"
                    value={data.email}
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    autoFocus
                    aria-invalid={Boolean(errors.email)}
                    onChange={(e) => setData('email', e.target.value)}
                />
                <div className="mt-4">
                    <AuthField
                        id="password"
                        label="Kata sandi"
                        icon={LockKeyhole}
                        error={errors.password}
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password)}
                        onChange={(e) => setData('password', e.target.value)}
                        onKeyUp={trackCaps}
                        onKeyDown={trackCaps}
                        onBlur={() => setCapsOn(false)}
                        trailing={
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                aria-pressed={showPassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                        }
                    />
                    {capsOn && !errors.password && (
                        <p className="mt-1.5 text-xs font-medium" role="status" style={{ color: 'var(--color-gold-deep)' }}>
                            Caps Lock aktif, periksa huruf besar/kecil.
                        </p>
                    )}
                </div>
                <div className="mt-5 flex items-center justify-start">
                    <Checkbox name="remember" checked={data.remember} onChange={(v) => setData('remember', v)} label="Ingat saya" />
                </div>
                <PrimaryButton className="mt-7 h-12 w-full text-base" disabled={processing}>
                    {processing ? 'Memproses…' : 'Masuk →'}
                </PrimaryButton>

                <p className="mt-6 border-t pt-5 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                    Pengguna eksternal perlu mendaftar terlebih dahulu.{' '}
                    <Link href={route('register')} className="font-semibold underline underline-offset-4" style={{ color: 'var(--color-accent-hover)' }}>
                        Daftar di sini
                    </Link>
                </p>
                <p className="mt-3 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                    Akun staf dibuat oleh Super Admin.
                </p>
            </form>
        </>
    );
}

export default function Login({ status, canResetPassword }) {
    return (
        <AuthLayout title="Selamat datang kembali." subtitle="Civitas PNJ masuk dengan SSO; pengguna eksternal masuk dengan email dan kata sandi.">
            <Head title="Masuk" />
            <AuthTabs active="login" />
            <LoginForm status={status} canResetPassword={canResetPassword} />
        </AuthLayout>
    );
}
