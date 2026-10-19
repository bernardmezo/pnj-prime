import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Checkbox from '@/Components/ui/Checkbox';
import { ConfirmModal, DangerButton, PrimaryButton, inputClass, inputStyleProps } from '@/Components/ui';

/**
 * Shared review panel for ALL verify/reject-with-note actions.
 * - checklist: "Memeriksa Kelengkapan Data" items (local check state)
 * - children: the submitted data ("Memverifikasi Data")
 * - approve + reject; rejection REQUIRES a non-empty catatan
 *   ("Menolak dan Memberi Catatan").
 * Callbacks receive the catatan text. Pages wire real routes or a neutral
 * "belum tersedia" notice when no route exists yet.
 */
export default function ReviewPanel({
    title,
    checklist = [],
    approveLabel = 'Verifikasi',
    rejectLabel = 'Tolak',
    onApprove,
    onReject,
}) {
    const [checked, setChecked] = useState([]);
    const [note, setNote] = useState('');
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [done, setDone] = useState(null);

    const toggle = (i) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

    return (
        <div>
            {title && (
                <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
            )}

            {checklist.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        Kelengkapan data
                    </p>
                    <ul className="space-y-2">
                        {checklist.map((item, i) => (
                            <li key={i}>
                                <Checkbox
                                    checked={checked.includes(i)}
                                    onChange={() => toggle(i)}
                                    label={item}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-5">
                <label htmlFor="review-note" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    Catatan peninjau
                </label>
                <textarea
                    id="review-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Hasil verifikasi data, opsional untuk persetujuan…"
                    className={inputClass}
                    {...inputStyleProps()}
                />
            </div>

            {done && (
                <p className="mt-3 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                    {done}
                </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => {
                        const r = onApprove?.(note);
                        if (r) setDone(r);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                    style={{ background: 'var(--color-accent)' }}
                >
                    <Check className="h-4 w-4" /> {approveLabel}
                </button>
                <button
                    type="button"
                    onClick={() => { setRejectNote(''); setRejectOpen(true); }}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                    style={{ background: 'var(--color-danger)' }}
                >
                    <X className="h-4 w-4" /> {rejectLabel}
                </button>
            </div>

            <ConfirmModal
                open={rejectOpen}
                title="Tolak dengan catatan?"
                desc="Penolakan wajib disertai catatan agar pemohon dapat memperbaiki."
                confirmLabel={rejectLabel}
                danger
                onConfirm={() => {
                    if (!rejectNote.trim()) return;
                    const r = onReject?.(rejectNote);
                    setRejectOpen(false);
                    if (r) setDone(r);
                }}
                onClose={() => setRejectOpen(false)}
            >
                <div>
                    <label htmlFor="reject-note" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                        Catatan penolakan (wajib)
                    </label>
                    <textarea
                        id="reject-note"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        rows={3}
                        placeholder="Tulis alasan penolakan…"
                        className={inputClass}
                        {...inputStyleProps()}
                    />
                    {!rejectNote.trim() && (
                        <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-danger)' }}>
                            Catatan wajib diisi untuk menolak.
                        </p>
                    )}
                </div>
            </ConfirmModal>
        </div>
    );
}

// Re-exported so pages import review bits from one place.
export { PrimaryButton, DangerButton };
