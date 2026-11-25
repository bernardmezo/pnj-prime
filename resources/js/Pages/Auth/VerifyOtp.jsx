import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';

export default function VerifyOtp({ email, status }) {
    const { data, setData, post, processing, errors } = useForm({ email: email || '', otp: '' });
    const submit = (e) => { e.preventDefault(); post(route('password.confirm.otp')); };

    return (
        <AuthLayout title="Verifikasi OTP" subtitle="Masukkan kode 6 digit yang dikirim ke email Anda.">
            <Head title="Verifikasi OTP" />
            {status && (
                <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                    {status}
                </div>
            )}
            <form onSubmit={submit}>
                <div className="space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email" type="email" name="email" value={data.email}
                            className="mt-1 block w-full" isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            readOnly={!!email}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="otp" value="Kode OTP" />
                        <TextInput
                            id="otp" type="text" name="otp" value={data.otp}
                            className="mt-1 block w-full text-center text-2xl tracking-widest" 
                            placeholder="000000" maxLength={6}
                            onChange={(e) => setData('otp', e.target.value.replace(/\D/g, ''))}
                        />
                        <InputError message={errors.otp} className="mt-2" />
                    </div>
                </div>
                <PrimaryButton className="mt-6 w-full" disabled={processing}>
                    {processing ? 'Memverifikasi…' : 'Verifikasi'}
                </PrimaryButton>
            </form>
        </AuthLayout>
    );
}
