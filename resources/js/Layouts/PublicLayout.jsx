import PublicFooter from '@/Components/Public/PublicFooter';
import PublicHeader from '@/Components/Public/PublicHeader';
import FlashToast from '@/Components/FlashToast';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { isStaffRole } from '@/lib/roles';

/**
 * PublicLayout, guests + Customer pages.
 * If user is staff (e.g. Admin RTPU checking the catalog), render within DashboardLayout
 * so the sidebar remains active and public navbar is not displayed.
 */
export default function PublicLayout({ auth, children }) {
    const isStaff = isStaffRole(auth?.user?.role);

    if (isStaff) {
        return (
            <DashboardLayout title="Katalog" activeKey="catalog">
                {children}
            </DashboardLayout>
        );
    }

    return (
        <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
            <PublicHeader auth={auth} />
            <main className="flex-1">{children}</main>
            <PublicFooter auth={auth} />
            <FlashToast />
        </div>
    );
}
