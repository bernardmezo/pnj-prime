import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, FadeIn, isInternalRole, roleLabel } from '@/Components/ui';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

// TODO(backend): not in use-case diagram; remove profile routes when backend migrates
export default function Edit({ auth, mustVerifyEmail, status }) {
    const internal = isInternalRole(auth?.user?.role);

    const content = (
        <>
            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                {roleLabel(auth?.user?.role)}
            </p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                Profil Saya
            </h1>
            <p className="mb-6 mt-2 max-w-xl text-sm" style={{ color: 'var(--color-muted)' }}>
                Kelola informasi akun, kata sandi, dan preferensi Anda.
            </p>
            <div className="mx-auto max-w-3xl space-y-5">
                <Card className="p-6 sm:p-8">
                    <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} className="max-w-xl" />
                </Card>
                <Card className="p-6 sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </Card>
                <Card className="p-6 sm:p-8" style={{ borderColor: 'var(--color-danger)' }}>
                    <DeleteUserForm className="max-w-xl" />
                </Card>
            </div>
        </>
    );

    if (!internal) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Profil" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">{content}</div>
            </PublicLayout>
        );
    }
    return (
        <DashboardLayout title="Profil Saya" breadcrumb="PNJ Prime / Profil">
            <Head title="Profil" />
            <FadeIn>{content}</FadeIn>
        </DashboardLayout>
    );
}
