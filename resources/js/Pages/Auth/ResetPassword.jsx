import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';

// TODO(backend): password reset not in use-case diagram; remove password.* routes when backend migrates
export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token, email, password: '', password_confirmation: '',
    });
    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <AuthLayout title="Atur ulang kata sandi" subtitle="Buat kata sandi baru untuk akun Anda.">
            <Head title="Reset Kata Sandi" />
            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="username" onChange={(e) => setData('email', e.target.value)} />
                    <InputError message={errors.email} className="mt-2" />
                </div>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Kata sandi baru" />
                    <TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" autoComplete="new-password" isFocused={true} onChange={(e) => setData('password', e.target.value)} />
                    <InputError message={errors.password} className="mt-2" />
                </div>
                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi kata sandi" />
                    <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="mt-1 block w-full" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Memproses…' : 'Reset Kata Sandi'}
                </PrimaryButton>
            </form>
        </AuthLayout>
    );
}
