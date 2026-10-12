/**
 * Status & rule definitions (assumptions in one place, easy to change).
 * Tones: teal | gold | danger | muted.
 */

// Pengajuan Layanan flow
export const LAYANAN_FLOW = [
    'Diajukan',
    'Menunggu Pembayaran',
    'Menunggu Verifikasi Pembayaran',
    'Diproses',
    'Selesai',
];
export const LAYANAN_END = ['Ditolak', 'Dibatalkan'];

// Pengajuan Produk Unggulan flow
export const PRODUK_FLOW = ['Diajukan', 'Disetujui'];
export const PRODUK_END = ['Ditolak', 'Dibatalkan'];

export const STATUS_TONE = {
    // teal: done / approved / active
    Selesai: 'teal',
    Disetujui: 'teal',
    Diverifikasi: 'teal',
    Aktif: 'teal',
    Terverifikasi: 'teal',
    Lunas: 'teal',
    // gold: waiting / in progress
    Diajukan: 'gold',
    'Menunggu Pembayaran': 'gold',
    'Menunggu Verifikasi Pembayaran': 'gold',
    Diproses: 'gold',
    Menunggu: 'gold',
    Pending: 'gold',
    // danger: rejected / cancelled
    Ditolak: 'danger',
    Dibatalkan: 'danger',
    // muted: inactive
    Nonaktif: 'muted',
    Draft: 'muted',
};

export const toneForStatus = (s) => STATUS_TONE[String(s ?? '')] ?? 'muted';

// ---- guards: who may act, by status ----
const UBAH_LAYANAN = ['Diajukan', 'Ditolak'];
const BATAL_LAYANAN = ['Diajukan', 'Ditolak', 'Menunggu Pembayaran'];
const UBAH_PRODUK = ['Diajukan', 'Ditolak'];
const BATAL_PRODUK = ['Diajukan', 'Ditolak'];

export const canUbahLayanan = (s) => UBAH_LAYANAN.includes(s);
export const canBatalLayanan = (s) => BATAL_LAYANAN.includes(s);
export const canBayarLayanan = (s) => s === 'Menunggu Pembayaran';
export const canUbahProduk = (s) => UBAH_PRODUK.includes(s);
export const canBatalProduk = (s) => BATAL_PRODUK.includes(s);

// Next valid status options for "Perbarui Status" (Admin RTPU).
export const NEXT_STATUS = {
    'Menunggu Verifikasi Pembayaran': ['Diproses', 'Menunggu Pembayaran'],
    Diproses: ['Selesai', 'Dibatalkan'],
    Diajukan: ['Menunggu Pembayaran', 'Ditolak'],
};

// Pemantauan (in progress) vs Riwayat (closed) split.
export const LAYANAN_CLOSED = ['Selesai', 'Dibatalkan', 'Ditolak'];
export const PRODUK_CLOSED = ['Disetujui', 'Ditolak', 'Dibatalkan'];
export const isLayananClosed = (s) => LAYANAN_CLOSED.includes(s);
export const isProdukClosed = (s) => PRODUK_CLOSED.includes(s);
