import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: { visit: vi.fn(), get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), reload: vi.fn() },
        useForm: (initial = {}) => ({
            data: initial,
            setData: vi.fn(),
            post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(),
            processing: false, errors: {}, reset: vi.fn(), recentlySuccessful: false,
        }),
        usePage: () => ({ props: { auth: { user: { id: 1, name: 'Test User', email: 't@t.id', role: 'customer' } } } }),
    };
});

const ui = await import('@/Components/ui.jsx');
const { StatusBadge, Table, Td, EmptyState, PageHeader, ConfirmModal } = ui;
const Timeline = (await import('@/Components/StatusTimeline.jsx')).default;
const FileDropzone = (await import('@/Components/FileDropzone.jsx')).default;
const ReviewPanel = (await import('@/Components/ReviewPanel.jsx')).default;
const SsoButton = (await import('@/Components/SsoButton.jsx')).default;

import { render, screen, fireEvent } from '@testing-library/react';

describe('shared components', () => {
    it('StatusBadge renders label', () => {
        const { container } = render(<StatusBadge status="Diajukan" label="Diajukan" />);
        expect(container.textContent).toContain('Diajukan');
    });

    it('Table renders headers and rows', () => {
        render(
            <Table columns={['Kode', 'Nama']}>
                <tbody>
                    <tr><Td strong>PNJ-1</Td><Td>Alat X</Td></tr>
                </tbody>
            </Table>,
        );
        expect(screen.getByText('Kode')).toBeInTheDocument();
        expect(screen.getByText('Alat X')).toBeInTheDocument();
    });

    it('PageHeader renders title', () => {
        render(<PageHeader eyebrow="Customer" title="Pengajuan Saya" desc="Desc" />);
        expect(screen.getByText('Pengajuan Saya')).toBeInTheDocument();
    });

    it('EmptyState renders title and action', () => {
        render(<EmptyState title="Kosong" desc="Tidak ada data." action={<button>Tutup</button>} />);
        expect(screen.getByText('Kosong')).toBeInTheDocument();
    });

    it('StatusTimeline renders flow and history note', () => {
        render(
            <Timeline
                flow={['Diajukan', 'Diproses', 'Selesai']}
                history={[{ status: 'Diajukan', at: '2026-01-01', note: 'Catatan uji', by: 'Admin' }]}
                current="Diproses"
            />,
        );
        expect(screen.getByText('Diproses')).toBeInTheDocument();
        expect(screen.getByText('Catatan uji')).toBeInTheDocument();
    });

    it('FileDropzone lists chosen files and exposes remove', () => {
        const files = [{ name: 'proposal.pdf' }];
        const onChange = () => {};
        const { container } = render(<FileDropzone multiple files={files} onChange={onChange} />);
        expect(screen.getByText('proposal.pdf')).toBeInTheDocument();
        expect(container.querySelector('button[aria-label="Hapus proposal.pdf"]')).toBeInTheDocument();
    });

    it('ReviewPanel requires a note to reject', () => {
        const onReject = vi.fn();
        render(
            <ReviewPanel
                title="Panel peninjau"
                checklist={['Data lengkap']}
                approveLabel="Setujui"
                rejectLabel="Tolak Pengajuan"
                onApprove={vi.fn()}
                onReject={onReject}
            />,
        );
        expect(screen.getByText('Panel peninjau')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Tolak Pengajuan'));
        // confirm modal opens, confirm without note does nothing
        fireEvent.click(screen.getAllByText('Tolak Pengajuan')[1]);
        expect(onReject).not.toHaveBeenCalled();
        expect(screen.getByText('Catatan wajib diisi untuk menolak.')).toBeInTheDocument();
    });

    it('ConfirmModal is closed when open=false and confirms when open', () => {
        const onConfirm = vi.fn();
        const { unmount } = render(
            <ConfirmModal open={false} title="Hapus data?" onConfirm={onConfirm} onClose={vi.fn()}>
                <p>isi</p>
            </ConfirmModal>,
        );
        expect(screen.queryByText('Hapus data?')).not.toBeInTheDocument();
        unmount();

        render(
            <ConfirmModal open title="Hapus data?" confirmLabel="Ya, hapus" onConfirm={onConfirm} onClose={vi.fn()}>
                <p>Sekali dihapus tidak bisa dikembalikan.</p>
            </ConfirmModal>,
        );
        expect(screen.getByText('Hapus data?')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Ya, hapus'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('SsoButton shows the neutral notice when SSO is disabled', () => {
        render(<SsoButton />);
        fireEvent.click(screen.getByText('Masuk dengan SSO PNJ'));
        expect(screen.getByText('Integrasi SSO PNJ belum diaktifkan di lingkungan ini.')).toBeInTheDocument();
    });
});
