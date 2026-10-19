import { describe, expect, it, vi } from 'vitest';

// Stateful useForm mock so controlled components can be wired end-to-end,
// plus router spies for the PublicHeader logout item.
vi.mock('@inertiajs/react', () => {
    const React = require('react');
    const strip = ({ method, as, data, preserveScroll, preserveState, replace, only, except, ...rest }) => rest;
    return {
        Head: ({ children }) => React.createElement(React.Fragment, null, children),
        Link: (props) => React.createElement('a', { ...strip(props), href: props.href }),
        router: { visit: vi.fn(), get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), reload: vi.fn() },
        usePage: () => ({ props: {} }),
        useForm: (initial = {}) => {
            const [data, setData] = React.useState(initial);
            return {
                data,
                setData: (key, value) =>
                    setData((prev) =>
                        typeof key === 'object' ? { ...prev, ...key } : { ...prev, [key]: value },
                    ),
                errors: {},
                processing: false,
                post: vi.fn(),
                patch: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
                reset: vi.fn(),
                clearErrors: vi.fn(),
            };
        },
    };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { router } from '@inertiajs/react';

describe('migrated pages use the UI kit', () => {
    it('PublicHeader opens the user menu (ui/Menu) and logs out via router.post', async () => {
        const user = userEvent.setup();
        const { default: PublicHeader } = await import('@/Components/Public/PublicHeader.jsx');
        render(<PublicHeader auth={{ user: { id: 1, name: 'Siti Rahma', role: 'customer' } }} />);

        await user.click(screen.getByRole('button', { name: /siti rahma/i }));
        expect(screen.getByRole('menuitem', { name: 'Ajukan Layanan' })).toBeInTheDocument();

        await user.click(screen.getByRole('menuitem', { name: 'Keluar' }));
        expect(router.post).toHaveBeenCalledWith('/logout');
    });

    it('Register picks a user type through the ui Select', async () => {
        const user = userEvent.setup();
        const { default: Register } = await import('@/Pages/Auth/Register.jsx');
        render(<Register />);

        await user.click(screen.getByRole('button', { name: /jenis pengguna/i }));
        await user.click(screen.getByRole('option', { name: 'Industri/Perusahaan' }));

        expect(document.querySelector('input[name="user_type"]')).toHaveValue('Industri/Perusahaan');
    });

    it('Login toggles the "Ingat saya" checkbox', async () => {
        const user = userEvent.setup();
        const { default: Login } = await import('@/Pages/Auth/Login.jsx');
        render(<Login status={null} canResetPassword={false} />);

        const remember = screen.getByRole('checkbox', { name: 'Ingat saya' });
        expect(remember).toHaveAttribute('aria-checked', 'false');

        await user.click(remember);
        expect(screen.getByRole('checkbox', { name: 'Ingat saya' })).toHaveAttribute('aria-checked', 'true');
    });

    it('ReviewPanel checklist items toggle', async () => {
        const user = userEvent.setup();
        const { default: ReviewPanel } = await import('@/Components/ReviewPanel.jsx');
        render(
            <ReviewPanel
                title="Panel peninjau"
                checklist={['Data lengkap', 'Berkas lengkap']}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />,
        );

        const item = screen.getByRole('checkbox', { name: 'Data lengkap' });
        expect(item).toHaveAttribute('aria-checked', 'false');

        await user.click(item);
        expect(screen.getByRole('checkbox', { name: 'Data lengkap' })).toHaveAttribute('aria-checked', 'true');
    });
});
