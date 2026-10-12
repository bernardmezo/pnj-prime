import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';

/**
 * File dropzone (presentation only): select files, list with remove.
 * Never uploads anywhere; parent decides what submit does (neutral
 * "belum tersedia" notice when no backend endpoint exists).
 */
export default function FileDropzone({ multiple = false, accept, hint, files, onChange }) {
    const ref = useRef(null);
    const [drag, setDrag] = useState(false);

    const add = (list) => {
        const next = multiple ? [...(files ?? []), ...list] : [...list].slice(0, 1);
        onChange?.(next);
    };

    return (
        <div>
            <div
                role="button"
                tabIndex={0}
                aria-label="Pilih berkas"
                onClick={() => ref.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') ref.current?.click(); }}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); add(Array.from(e.dataTransfer.files ?? [])); }}
                className="cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition"
                style={{
                    borderColor: drag ? 'var(--color-accent)' : 'var(--color-border)',
                    background: drag ? 'var(--color-accent-tint)' : 'transparent',
                }}
            >
                <FileUp className="mx-auto mb-2 h-7 w-7" style={{ color: 'var(--color-accent-hover)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    Seret berkas ke sini atau klik untuk memilih
                </p>
                {hint && <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
                <input
                    ref={ref}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={accept}
                    onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = ''; }}
                />
            </div>
            {(files ?? []).length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${i}`}
                            className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm"
                            style={{ background: 'var(--color-surface)' }}
                        >
                            <span className="truncate" style={{ color: 'var(--color-ink)' }}>{f.name}</span>
                            <button
                                type="button"
                                aria-label={`Hapus ${f.name}`}
                                onClick={() => onChange?.(files.filter((_, x) => x !== i))}
                                className="shrink-0 rounded-lg p-1 transition"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
