import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';

// TODO(backend): not in use-case diagram; remove password.confirm routes when backend migrates
export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });
    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Konfirmasi kata sandi" subtitle="Area aman, mohon konfirmasi kata sandi Anda untuk melanjutkan.">
            <Head title="Konfirmasi Kata Sandi" />
            <form onSubmit={submit}>
                <InputLabel htmlFor="password" value="Kata sandi" />
                <TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" isFocused={true} onChange={(e) => setData('password', e.target.value)} />
                <InputError message={errors.password} className="mt-2" />
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Memproses…' : 'Konfirmasi'}
                </PrimaryButton>
            </form>
        </AuthLayout>
    );
}
