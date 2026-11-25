import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPasswordOtp({ email, otp }) {
    const { data, setData, post, processing, errors } = useForm({ email: email || '', otp: otp || '', password: '', password_confirmation: '' });
    const submit = (e) => { e.preventDefault(); post(route('password.store.otp')); };

    return (
        <AuthLayout title="Reset Password" subtitle="Masukkan password baru Anda.">
            <Head title="Reset Password" />
            <form onSubmit={submit}>
                <div className="space-y-4">
                    <div>
                        <InputLabel htmlFor="password" value="Password Baru" />
                        <TextInput
                            id="password" type="password" name="password" value={data.password}
                            className="mt-1 block w-full" isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                        <TextInput
                            id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Mengubah…' : 'Ubah Password'}
                </PrimaryButton>
            </form>
        </AuthLayout>
    );
}
