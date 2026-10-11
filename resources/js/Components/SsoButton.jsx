import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { startSsoLogin } from '@/lib/sso';

/**
 * Shared "Masuk dengan SSO PNJ" button.
 *
 * Navigates to `sso.redirect` only when the shared prop `sso_enabled` is
 * true; otherwise it keeps the neutral notice. No identity provider is
 * faked here.
 */
export default function SsoButton() {
    const { sso_enabled: ssoEnabled } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [missing, setMissing] = useState(false);

    const handleClick = () => {
        setMissing(false);
        setLoading(true);
        const started = startSsoLogin(ssoEnabled);
        if (!started) {
            setLoading(false);
            setMissing(true);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border bg-white px-6 py-3 text-sm font-semibold transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent-hover)' }}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Fingerprint className="h-4 w-4" />
                )}
                {loading ? 'Menghubungkan ke SSO PNJ…' : 'Masuk dengan SSO PNJ'}
            </button>
            {missing && (
                <p className="mt-2 rounded-xl px-4 py-2.5 text-[13px]" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }} role="status">
                    Integrasi SSO PNJ belum diaktifkan di lingkungan ini.
                </p>
            )}
        </div>
    );
}
