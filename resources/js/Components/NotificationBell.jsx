import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(route('notifications.index'));
            setItems(res.data.notifications);
            setUnread(res.data.unread_count);
        } catch (e) {
            // diamkan, badge hanya tidak update
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const t = setInterval(fetchNotifications, 60000); // polling tiap 60 detik
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClickItem = async (n) => {
        if (!n.read_at) {
            try {
                const res = await axios.post(route('notifications.read', n.id));
                setUnread(res.data.unread_count);
                setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
            } catch (e) {}
        }
        if (n.url) {
            setOpen(false);
            router.visit(n.url);
        }
    };

    const handleReadAll = () => {
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setUnread(0);
                setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
            },
        });
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
                aria-label="Notifikasi"
                className="relative rounded-full p-2 transition hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
                <Bell className="h-5 w-5 text-[var(--color-ink)]" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
                        <span className="text-sm font-semibold text-[var(--color-ink)]">Notifikasi</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={handleReadAll}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent-hover)] hover:underline"
                            >
                                <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {loading && items.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">Memuat…</p>
                        )}
                        {!loading && items.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">Belum ada notifikasi.</p>
                        )}
                        {items.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => handleClickItem(n)}
                                className={`flex w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition hover:bg-[var(--color-surface)] ${n.read_at ? 'opacity-70' : 'bg-[var(--color-accent-tint)]/40'}`}
                            >
                                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-[var(--color-accent)]'}`} aria-hidden />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-[var(--color-ink)]">{n.title}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-muted)]">{n.message}</span>
                                    <span className="mt-1 block text-[11px] text-[var(--color-muted)]">{n.created_at}</span>
                                </span>
                                {!n.read_at && <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
