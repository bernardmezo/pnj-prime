import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CatalogCard, { typeFromCategory } from '../Components/Public/CatalogCard';

vi.mock('@inertiajs/react', () => ({ Link: ({ children }) => <div>{children}</div> }));
vi.mock('framer-motion', () => ({
    motion: { div: ({ children }) => <div>{children}</div> },
    useReducedMotion: () => true,
}));
vi.mock('../Components/ui', () => ({ EASE: [] }));

describe('status kartu katalog', () => {
    const renderCard = (type, stock, availability_status = 'tersedia') => renderToStaticMarkup(
        <CatalogCard item={{ type, title: 'Item', stock, availability_status }} />,
    );

    it('tidak memakai stok untuk sewa dan jasa', () => {
        expect(renderCard('sewa', 0)).toContain('Periksa Jadwal');
        expect(renderCard('jasa', 0)).toContain('Periksa Jadwal');
        expect(renderCard('sewa', 0)).not.toContain('Stok Habis');
    });

    it('mempertahankan status stok dan pre-order produk', () => {
        expect(renderCard('produk', 0)).toContain('Stok Habis');
        expect(renderCard('produk', 2)).toContain('Ready Stock');
        expect(renderCard('produk', 0, 'preorder')).toContain('Pre-order');
    });

    it('mengenali kategori induk sewa dan jasa', () => {
        expect(typeFromCategory('sewa-fasilitas')).toBe('sewa');
        expect(typeFromCategory('jasa-layanan')).toBe('jasa');
        expect(typeFromCategory('produk-fisik')).toBe('produk');
    });
});
