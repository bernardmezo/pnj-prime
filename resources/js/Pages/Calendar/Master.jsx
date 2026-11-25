import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, PrimaryButton, SecondaryButton, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CalendarMaster({ month, bookings = [], closedDates = [], canManage = false }) {
    const current = new Date(`${month}T00:00:00`);
    const [cursor, setCursor] = useState(current);
    const closedForm = useForm({ date: '', title: '' });
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const iso = (day) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const moveMonth = (delta) => {
        const next = new Date(year, monthIndex + delta, 1);
        setCursor(next);
        router.get(route('calendar.master'), { month: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01` }, { preserveState: true, preserveScroll: true });
    };

    return (
        <DashboardLayout title="Kalender Master" breadcrumb="Layanan / Kalender Master" activeKey="calendar">
            <Head title="Kalender Master · PNJ Prime" />
            <FadeIn>
                <PageHeader title="Kalender Master Layanan" desc="Jadwal sewa dan jasa, tanggal merah akademik, serta pesanan yang perlu dijadwalkan ulang." />
                <div className="grid gap-6 min-w-0 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <Card>
                        <div className="p-4 sm:p-6">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-accent-tint px-4 py-4 text-accent sm:px-5">
                            <SecondaryButton type="button" onClick={() => moveMonth(-1)} className="!px-4 !py-2">← Bulan sebelumnya</SecondaryButton>
                            <h2 className="font-display text-lg font-bold">{cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                            <SecondaryButton type="button" onClick={() => moveMonth(1)} className="!px-4 !py-2">Bulan berikutnya →</SecondaryButton>
                        </div>
                        <div className="overflow-x-auto"><div className="min-w-[620px]">
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--color-muted)]">
                            {DAY_LABELS.map((d) => <div key={d}>{d}</div>)}
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-2">
                            {cells.map((day, index) => {
                                if (!day) return <div key={`empty-${index}`} className="min-h-28" />;
                                const date = iso(day);
                                const closed = closedDates.filter((d) => d.date === date);
                                const items = bookings.filter((b) => b.start && b.end && b.start < `${date} 23:59:59` && b.end > `${date} 00:00`);
                                return (
                                    <div key={date} className={`min-h-28 min-w-0 break-words rounded-xl border p-3 text-left ${closed.length ? 'border-danger/30 bg-danger-tint' : 'border-border bg-white'}`}>
                                        <div className="text-sm font-bold text-ink">{day}</div>
                                        {closed.map((d) => <div key={d.id} className="mt-1 text-[10px] font-semibold text-danger">{d.title}</div>)}
                                        {items.map((b) => <div key={b.id} className={`mt-1 rounded p-1 text-[10px] ${b.reschedule_required ? 'bg-gold/20 text-gold-deep' : 'bg-accent-tint text-accent-hover'}`}>{b.product} · {b.code}{b.reschedule_required ? ' · Reschedule' : ''}</div>)}
                                    </div>
                                );
                            })}
                        </div>
                        </div></div>
                        </div>
                    </Card>
                    <div className="space-y-5">
                        {canManage && <Card>
                            <div className="p-5 sm:p-6">
                            <h3 className="font-display font-semibold text-ink">Tandai tanggal akademik tidak tersedia</h3>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">Pesanan yang terdampak akan diminta reschedule, bukan dibatalkan atau direfund.</p>
                            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); closedForm.post(route('calendar.closed.store'), { onSuccess: () => closedForm.reset() }); }}>
                                <label className="block text-sm">Tanggal<input required type="date" value={closedForm.data.date} onChange={(e) => closedForm.setData('date', e.target.value)} className={`mt-1.5 ${inputClass}`} {...inputStyleProps()} /></label>
                                <label className="block text-sm">Keterangan akademik<input required placeholder="Contoh: Libur akademik" value={closedForm.data.title} onChange={(e) => closedForm.setData('title', e.target.value)} className={`mt-1.5 ${inputClass}`} {...inputStyleProps()} /></label>
                                {Object.values(closedForm.errors).map((error) => <p role="alert" key={error} className="text-sm text-danger">{error}</p>)}
                                <PrimaryButton disabled={closedForm.processing} className="w-full">Tandai merah & proses reschedule</PrimaryButton>
                            </form>
                            </div>
                        </Card>}
                        <Card>
                            <div className="p-5 sm:p-6">
                            <h3 className="font-display font-semibold text-ink">Tanggal merah akademik</h3>
                            <div className="mt-3 space-y-2">
                                {closedDates.length === 0 && <p className="text-sm text-[var(--color-muted)]">Belum ada tanggal yang ditandai bulan ini.</p>}
                                {closedDates.map((d) => <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-danger-tint p-3 text-sm text-danger"><span>{d.date} · {d.title}</span>{canManage && <button type="button" onClick={() => router.delete(route('calendar.closed.destroy', d.id))} className="shrink-0 rounded text-xs font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2">Hapus</button>}</div>)}
                            </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-5 sm:p-6">
                            <h3 className="font-display font-semibold text-ink">Pesanan bulan ini</h3>
                            <div className="mt-3 space-y-3">
                                {bookings.length === 0 && <p className="text-sm text-[var(--color-muted)]">Belum ada jadwal pada bulan ini.</p>}
                                {bookings.map((b) => <div key={b.id} className="rounded-xl border border-border bg-surface p-3 text-sm"><div className="flex justify-between gap-2"><strong>{b.product}</strong><StatusBadge status={b.reschedule_required ? 'Perlu Reschedule' : b.status} label={b.reschedule_required ? 'Perlu Reschedule' : b.status} tone={b.reschedule_required ? 'gold' : undefined} /></div><p className="mt-1 text-xs">{b.start} — {b.end}</p><p className="text-xs text-[var(--color-muted)]">{b.code} · {b.customer}</p></div>)}
                            </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}
