import PublicFooter from '@/Components/Public/PublicFooter';
import PublicHeader from '@/Components/Public/PublicHeader';
import FlashToast from '@/Components/FlashToast';

/**
 * PublicLayout, guests + Customer pages.
 * Header is sticky at top:0 (first element); same footer as the landing page.
 */
export default function PublicLayout({ auth, children }) {
    return (
        <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
            <PublicHeader auth={auth} />
            <main className="flex-1">{children}</main>
            <PublicFooter auth={auth} />
            <FlashToast />
        </div>
    );
}
