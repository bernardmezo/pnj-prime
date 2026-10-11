import PrimaryButton from '@/Components/PrimaryButton';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const submit = (e) => { e.preventDefault(); post(route('verification.send')); };

    return (
        <AuthLayout title="Verifikasi email" subtitle="Klik tautan yang kami kirim ke email Anda sebelum mulai menggunakan PNJ Prime.">
            <Head title="Verifikasi Email" />
            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                    Tautan verifikasi baru telah dikirim ke email Anda.
                </div>
            )}
            <form onSubmit={submit}>
                <PrimaryButton className="w-full" disabled={processing}>
                    {processing ? 'Mengirim…' : 'Kirim Ulang Email Verifikasi'}
                </PrimaryButton>
                <p className="mt-4 text-center text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    <Link href={route('logout')} method="post" as="button" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                        Keluar
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
