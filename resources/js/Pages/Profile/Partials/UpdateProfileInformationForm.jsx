import { Link, useForm, usePage } from '@inertiajs/react';
import AlertBanner from '@/Components/AlertBanner';
import { Field, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

/**
 * Form profil. Field yang tampil mengikuti peran dan, untuk Customer, jenis akun
 * (harus sama dengan ProfileUpdateRequest::CUSTOMER_TYPE_FIELDS di backend).
 * Validasi sebenarnya ada di backend; role/status tidak pernah dikirim.
 */
const UNIT_ROLES = ['admin_pengelola', 'admin_jurusan', 'admin_p3m'];

// label, wajib?, sumber nilai: kolom users atau kunci meta
const TYPE_FIELDS = {
    'Industri/Perusahaan': [
        { key: 'institution', label: 'Nama perusahaan', required: true, column: true },
        { key: 'npwp_perusahaan', label: 'NPWP perusahaan' },
        { key: 'penanggung_jawab', label: 'Nama penanggung jawab', required: true },
        { key: 'bidang_usaha', label: 'Bidang usaha' },
    ],
    'Mitra kerja sama': [
        { key: 'institution', label: 'Nama instansi / mitra', required: true, column: true },
        { key: 'nomor_mou_pks', label: 'Nomor MoU / PKS' },
        { key: 'contact_person', label: 'Contact person', required: true },
        { key: 'periode_kerja_sama', label: 'Periode kerja sama' },
    ],
    'Perguruan tinggi/lembaga lain': [
        { key: 'institution', label: 'Nama perguruan tinggi / lembaga', required: true, column: true },
    ],
};

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const isCustomer = user.role === 'customer';
    const isUnit = UNIT_ROLES.includes(user.role);
    const hasAddress = isCustomer || isUnit;
    const isSso = user.account_origin === 'sso_pnj';
    const meta = user.meta && !Array.isArray(user.meta) ? user.meta : {};
    const typeFields = isCustomer ? TYPE_FIELDS[user.user_type] ?? [] : [];

    const initialExtra = Object.fromEntries(
        typeFields.map((f) => [f.key, (f.column ? user[f.key] : meta[f.key]) ?? ''])
    );

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        ...(hasAddress && { address: user.address ?? '', postal_code: user.postal_code ?? '' }),
        ...(isUnit && {
            institution: user.institution ?? '',
            unit_name: user.unit_name ?? '',
            jurusan: user.jurusan ?? '',
        }),
        ...initialExtra,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    const emailChanged = !isSso && data.email.trim().toLowerCase() !== (user.email ?? '').toLowerCase();

    const text = (id, label, extra = {}) => (
        <Field label={label} htmlFor={id} error={errors[id]}>
            <input
                id={id}
                className={inputClass}
                value={data[id] ?? ''}
                onChange={(e) => setData(id, e.target.value)}
                aria-invalid={errors[id] ? 'true' : undefined}
                {...inputStyleProps()}
                {...extra}
            />
        </Field>
    );

    return (
        <section className={className}>
            <header>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    Informasi Profil
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    Perbarui data akun Anda. Peran dan hak akses tidak dapat diubah dari halaman ini.
                </p>
                {isCustomer && user.user_type && (
                    <p className="mt-3 text-sm" style={{ color: 'var(--color-ink)' }}>
                        <span style={{ color: 'var(--color-muted)' }}>Jenis akun: </span>
                        <span className="font-semibold">{user.user_type === 'civitas' ? 'Civitas PNJ (SSO)' : user.user_type}</span>
                    </p>
                )}
            </header>

            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
                {text('name', 'Nama lengkap', { required: true, autoComplete: 'name' })}

                <div>
                    {text('email', 'Email', {
                        type: 'email',
                        required: true,
                        autoComplete: 'email',
                        readOnly: isSso,
                        'aria-readonly': isSso ? 'true' : undefined,
                    })}
                    {isSso && (
                        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                            Email terhubung dengan akun SSO PNJ dan tidak dapat diubah di sini.
                        </p>
                    )}
                    {emailChanged && (
                        <AlertBanner
                            className="mt-3"
                            type="warning"
                            message="Email diubah. Anda perlu memverifikasi ulang alamat email baru setelah menyimpan."
                        />
                    )}
                </div>

                {text('phone', 'Nomor telepon', { type: 'tel', required: true, autoComplete: 'tel', placeholder: '081234567890' })}

                {typeFields.map((f) =>
                    text(f.key, f.label, { required: Boolean(f.required), autoComplete: f.key === 'institution' ? 'organization' : undefined })
                )}

                {isUnit && (
                    <>
                        {text('institution', 'Instansi', { autoComplete: 'organization' })}
                        <div className="grid gap-5 sm:grid-cols-2">
                            {text('unit_name', 'Unit / vendor')}
                            {text('jurusan', 'Jurusan')}
                        </div>
                    </>
                )}

                {hasAddress && (
                    <>
                        <Field label={isUnit ? 'Alamat asal / gudang' : 'Alamat lengkap'} htmlFor="address" error={errors.address}>
                            <textarea
                                id="address"
                                rows={3}
                                className={inputClass}
                                value={data.address ?? ''}
                                onChange={(e) => setData('address', e.target.value)}
                                autoComplete="street-address"
                                {...inputStyleProps()}
                            />
                        </Field>
                        <div className="sm:max-w-[200px]">
                            {text('postal_code', 'Kode pos', { inputMode: 'numeric', maxLength: 5, autoComplete: 'postal-code', placeholder: '16424' })}
                        </div>
                    </>
                )}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <AlertBanner
                        type="warning"
                        message={
                            <>
                                Email Anda belum diverifikasi.{' '}
                                <Link href={route('verification.send')} method="post" as="button" className="font-semibold underline underline-offset-2">
                                    Kirim ulang email verifikasi
                                </Link>
                                {status === 'verification-link-sent' && ' Tautan verifikasi baru telah dikirim.'}
                            </>
                        }
                    />
                )}

                <div className="pt-1">
                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
