import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useState } from 'react';
import clsx from 'clsx';

/**
 * Tabs — Headless UI Tab wrapper. Controlled with `value`/`onChange` or
 * uncontrolled from the first tab.
 *
 * @example
 * <Tabs value={tab} onChange={setTab} tabs={[{ key: 'jasa', label: 'Jasa' }, { key: 'produk', label: 'Produk' }]}>
 *   <div>Panel jasa</div>
 *   <div>Panel produk</div>
 * </Tabs>
 */
export default function Tabs({ tabs = [], value, onChange, children, className, panelClassName }) {
    const [internal, setInternal] = useState(tabs[0]?.key);
    const current = value ?? internal;
    const index = Math.max(0, tabs.findIndex((t) => t.key === current));
    const panels = Array.isArray(children) ? children : [children];

    return (
        <TabGroup
            selectedIndex={index}
            onChange={(i) => {
                setInternal(tabs[i]?.key);
                onChange?.(tabs[i]?.key);
            }}
            className={className}
        >
            <TabList
                className="flex flex-wrap gap-1 border-b"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <Tab
                            key={t.key}
                            className={({ selected }) =>
                                clsx(
                                    '-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium outline-none transition',
                                    selected
                                        ? 'border-[var(--color-accent)] text-[var(--color-accent-hover)]'
                                        : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                                )
                            }
                        >
                            {Icon && <Icon className="h-4 w-4" />}
                            {t.label}
                        </Tab>
                    );
                })}
            </TabList>
            <TabPanels className="pt-4">
                {tabs.map((t, i) => (
                    <TabPanel key={t.key} className={panelClassName}>
                        {panels[i]}
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}
