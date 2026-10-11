import '@testing-library/jest-dom';

// Ziggy route() stub: known named routes resolve, unknown names throw
// (mirrors the try/catch usage in nav.js and pages).
globalThis.route = (name, params) => {
    if (name === 'catalog.show') return `/catalog/${params}`;
    const known = [
        'home', 'login', 'register', 'logout', 'dashboard',
        'catalog.index', 'catalog.show',
        'customer.pengajuan.index', 'customer.pengajuan.create', 'customer.pengajuan.show',
        'customer.pengajuan.edit', 'customer.pengajuan.bayar', 'customer.riwayat',
        'rtpu.verify.layanan', 'rtpu.verify.bayar', 'rtpu.status',
        'rtpu.layanan', 'rtpu.layanan.form', 'rtpu.metode', 'rtpu.riwayat',
        'p3m.produk.index', 'p3m.produk.create', 'p3m.produk.show', 'p3m.produk.edit',
        'p3m.riwayat', 'pimpinan.verify', 'pimpinan.monitor', 'pimpinan.riwayat',
        'direktur.monitor', 'direktur.riwayat',
        'superadmin.users', 'superadmin.hakakses', 'superadmin.fitur',
    ];
    if (!known.includes(name)) {
        throw new Error(`Route [${name}] not defined in test stub.`);
    }
    return `/${name}`;
};
globalThis.route.current = () => false;

// matchMedia (framer-motion, responsive hooks)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    }),
});

// IntersectionObserver (scroll reveals, counters)
class IOStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
globalThis.IntersectionObserver = IOStub;

// scrollTo (jsdom gap)
window.scrollTo = () => {};
