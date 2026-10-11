import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SsoButton from '@/Components/SsoButton';
import TextInput from '@/Components/TextInput';
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

/** Floating-label wrapper around the shared TextInput (same behavior/props). */
function FloatField({ id, label, error, icon: Icon, hint, describedBy, children }) {
    return (
        <div>
            <div className="relative">
                {Icon && (
                    <Icon
                        aria-hidden
                        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                        style={{ color: error ? 'var(--color-danger)' : 'var(--color-muted)' }}
                    />
                )}
                {children}
                <label
                    htmlFor={id}
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[15px] transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[15px] peer-focus:top-2.5 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs"
                    style={{ left: Icon ? 48 : 16, color: error ? 'var(--color-danger)' : 'var(--color-muted)' }}
                >
                    {label}
                </label>
            </div>
            {error ? <InputError message={error} className="mt-2" /> : hint ? (
                <p id={describedBy} className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>
            ) : null}
        </div>
    );
}

const floatInputClass = 'peer block w-full !pl-12 !pt-6 !pb-2';

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
                <FloatField id="email" label="Alamat email" error={errors.email} icon={Mail} hint="Gunakan email yang Anda daftarkan.">
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        placeholder=" "
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className={floatInputClass}
                        autoComplete="username"
                        isFocused={true}
                        aria-invalid={Boolean(errors.email)}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </FloatField>
                <div className="mt-4">
                    <FloatField id="password" label="Kata sandi" error={errors.password} icon={LockKeyhole}>
                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                placeholder=" "
                                className={`${floatInputClass} pr-11`}
                                autoComplete="current-password"
                                aria-invalid={Boolean(errors.password)}
                                onChange={(e) => setData('password', e.target.value)}
                                onKeyUp={trackCaps}
                                onKeyDown={trackCaps}
                                onBlur={() => setCapsOn(false)}
                            />
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
                        </div>
                    </FloatField>
                    {capsOn && !errors.password && (
                        <p className="mt-1.5 text-xs font-medium" role="status" style={{ color: 'var(--color-gold-deep)' }}>
                            Caps Lock aktif, periksa huruf besar/kecil.
                        </p>
                    )}
                </div>
                <div className="mt-5 flex items-center justify-start">
                    <label className="flex cursor-pointer items-center">
                        <Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                        <span className="ms-2 text-sm" style={{ color: 'var(--color-muted)' }}>Ingat saya</span>
                    </label>
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
