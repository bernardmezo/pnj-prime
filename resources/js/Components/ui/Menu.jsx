import { Menu as HeadlessMenu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

export default function Menu({ button, items = [], align = 'end', className, menuClassName, buttonClassName }) {
    const reduce = useReducedMotion();
    const anchor = align === 'end' ? 'bottom end' : 'bottom start';

    return (
        <HeadlessMenu as="div" className={clsx('relative inline-block text-left', className)}>
            <MenuButton
                className={clsx(
                    'inline-flex items-center gap-2 outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
                    buttonClassName,
                )}
            >
                {button}
            </MenuButton>
            <MenuItems
                anchor={anchor}
                transition
                className={clsx(
                    'z-[90] mt-1 w-56 origin-top rounded-xl border bg-white p-1 text-sm shadow-dropdown focus:outline-none',
                    !reduce && 'transition duration-100 ease-out data-[closed]:opacity-0 data-[closed]:scale-95',
                    menuClassName,
                )}
                style={{ borderColor: 'var(--color-border)' }}
            >
                {items.map((item, i) => {
                    if (item.type === 'divider') {
                        return (
                            <div
                                key={`d-${i}`}
                                className="my-1 h-px"
                                style={{ background: 'var(--color-border)' }}
                            />
                        );
                    }
                    const Icon = item.icon;
                    const classes = ({ focus, disabled }) =>
                        clsx(
                            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition duration-150',
                            focus && 'bg-[var(--color-surface)]',
                            disabled && 'cursor-not-allowed opacity-50',
                        );
                    const inner = ({ focus, disabled }) => (
                        <>
                            {Icon && (
                                <Icon
                                    className="h-4 w-4"
                                    style={{ color: item.destructive ? 'var(--color-danger)' : 'var(--color-muted)' }}
                                />
                            )}
                            <span style={{ color: item.destructive ? 'var(--color-danger)' : 'var(--color-ink)' }}>
                                {item.label}
                            </span>
                        </>
                    );
                    if (item.href) {
                        return (
                            <MenuItem key={item.key ?? i} as={Link} href={item.href} className={classes} disabled={item.disabled}>
                                {inner}
                            </MenuItem>
                        );
                    }
                    return (
                        <MenuItem
                            key={item.key ?? i}
                            as="button"
                            type="button"
                            onClick={item.onClick}
                            className={classes}
                            disabled={item.disabled}
                        >
                            {inner}
                        </MenuItem>
                    );
                })}
            </MenuItems>
        </HeadlessMenu>
    );
}
