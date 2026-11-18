import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { Field, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        // Toast sukses datang dari flash('success') yang dikirim PasswordController.
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const field = (id, label, ref, autoComplete) => (
        <Field label={label} htmlFor={id} error={errors[id]}>
            <input
                id={id}
                ref={ref}
                type="password"
                className={inputClass}
                value={data[id]}
                onChange={(e) => setData(id, e.target.value)}
                autoComplete={autoComplete}
                aria-invalid={errors[id] ? 'true' : undefined}
                {...inputStyleProps()}
            />
        </Field>
    );

    return (
        <section className={className}>
            <header>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    Ganti Kata Sandi
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    Gunakan kata sandi minimal 8 karakter yang sulit ditebak.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-5" noValidate>
                {field('current_password', 'Kata sandi saat ini', currentPasswordInput, 'current-password')}
                {field('password', 'Kata sandi baru', passwordInput, 'new-password')}
                {field('password_confirmation', 'Konfirmasi kata sandi baru', null, 'new-password')}

                <div className="pt-1">
                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Ganti kata sandi'}
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
