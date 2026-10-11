import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const submit = (e) => { e.preventDefault(); post(route('password.email')); };

    return (
        <AuthLayout title="Lupa kata sandi" subtitle="Masukkan email Anda, kami akan mengirimkan tautan untuk mengatur ulang kata sandi.">
            <Head title="Lupa Kata Sandi" />
            {status && (
                <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                    {status}
                </div>
            )}
            <form onSubmit={submit}>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                    id="email" type="email" name="email" value={data.email}
                    className="mt-1 block w-full" isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />
                <InputError message={errors.email} className="mt-2" />
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Mengirim…' : 'Kirim Tautan Reset'}
                </PrimaryButton>
                <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    <Link href={route('login')} className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                        Kembali masuk
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
