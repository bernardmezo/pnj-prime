/**
 * Hook untuk manage draft pengajuan sebelum login.
 * Simpan data form pengajuan di localStorage sebelum user redirect ke login.
 * Setelah login berhasil dan redirect ke halaman pengajuan, restore data dari localStorage.
 */

export function usePengajuanDraft() {
    const STORAGE_KEY = 'pengajuan_draft';

    const saveDraft = (data) => {
        if (typeof window !== 'undefined' && data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    };

    const restoreDraft = () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }
        return null;
    };

    const clearDraft = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    return { saveDraft, restoreDraft, clearDraft };
}

/**
 * Redirect ke login dengan preserved URL.
 * Browser akan save URL sebagai intended, dan setelah login, user kembali ke sini.
 */
export function redirectToLoginWithIntended(url, currentData = null) {
    // Save draft data sebelum redirect
    if (currentData) {
        const hook = usePengajuanDraft();
        hook.saveDraft(currentData);
    }

    // Save intended URL di session (backend akan handle ini via middleware)
    // Frontend just redirect to login — middleware PreserveIntendedUrl akan capture intended URL
    window.location.href = `${route('login')}`;
}
