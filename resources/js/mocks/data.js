/**
 * DEV preview data only (resources/js/mocks/*).
 * Realistic Indonesian samples. No real personal data.
 */

export const mockUsers = [
    { id: 1, name: 'Siti Rahma', email: 'customer@pnjprime.test', role: 'customer', status: 'Aktif' },
    { id: 2, name: 'Budi Santoso', email: 'rtpu@pnjprime.test', role: 'admin_rtpu', status: 'Aktif' },
    { id: 3, name: 'Dr. Andi Wijaya', email: 'p3m@pnjprime.test', role: 'admin_p3m', status: 'Aktif' },
    { id: 4, name: 'Prof. Dewi Lestari', email: 'pimpinan@pnjprime.test', role: 'pimpinan_rtpu', status: 'Aktif' },
    { id: 5, name: 'H. Bambang Sutrisno', email: 'direktur@pnjprime.test', role: 'direktur', status: 'Aktif' },
    { id: 6, name: 'Rizky Pratama', email: 'superadmin@pnjprime.test', role: 'super_admin', status: 'Aktif' },
    { id: 7, name: 'PT Maju Bersama', email: 'mitra@industri.test', role: 'customer', status: 'Nonaktif' },
];

export const mockAuth = (role = 'customer') => {
    const u = mockUsers.find((x) => x.role === role) ?? mockUsers[0];
    return { user: { id: u.id, name: u.name, email: u.email, role: u.role } };
};

export const mockLayanan = [
    { id: 101, code: 'PNJ-JSA-0101', type: 'jasa', name: 'Uji Kuat Tekan Beton', price: 350000, location: 'Lab Struktur, Gedung A', duration: '3 hari kerja', status: 'Aktif', desc: 'Pengujian kuat tekan silinder beton sesuai SNI.' },
    { id: 102, code: 'PNJ-JSA-0102', type: 'jasa', name: 'Kalibrasi Mikroskop', price: 275000, location: 'Lab Kalibrasi, Gedung B', duration: '2 hari kerja', status: 'Aktif', desc: 'Kalibrasi mikroskop optik beserta sertifikat.' },
    { id: 103, code: 'PNJ-RGN-0201', type: 'ruangan', name: 'Aula Gedung Serbaguna', price: 2500000, location: 'Gedung Serbaguna Lt.1', capacity: 300, facilities: 'Proyektor, sound system, AC', status: 'Aktif', desc: 'Aula untuk seminar, wisuda, dan pameran.' },
    { id: 104, code: 'PNJ-RGN-0202', type: 'ruangan', name: 'Ruang Rapat Lantai 2', price: 550000, location: 'Gedung Rektorat Lt.2', capacity: 12, facilities: 'Smart TV, whiteboard', status: 'Aktif', desc: 'Ruang rapat representatif untuk 12 orang.' },
    { id: 105, code: 'PNJ-PRD-0301', type: 'produk', name: 'Alat Uji Kualitas Air Portable', price: 2450000, stock: 16, category: 'Alat Uji', specs: 'pH, TDS, suhu; baterai isi ulang', status: 'Aktif', desc: 'Kit uji kualitas air jinjing untuk lapangan.' },
    { id: 106, code: 'PNJ-PRD-0302', type: 'produk', name: 'Modul Trainer IoT ESP32', price: 1275000, stock: 24, category: 'Modul Ajar', specs: 'ESP32, 8 sensor, panduan praktikum', status: 'Aktif', desc: 'Modul pembelajaran IoT untuk praktikum.' },
    { id: 107, code: 'PNJ-JSA-0103', type: 'jasa', name: 'Uji Tarik Baja Tulangan', price: 425000, location: 'Lab Material, Gedung A', duration: '4 hari kerja', status: 'Nonaktif', desc: 'Sementara tidak menerima sampel baru.' },
];

const H = (status, at, note = null, by = null) => ({ status, at, note, by });

export const mockPengajuan = [
    { id: 1, code: 'PNJ-2026-0001', type: 'jasa', layanan: 'Uji Kuat Tekan Beton', customer: 'Siti Rahma', date: '2026-09-28', status: 'Diajukan', qty: '3 sampel', need: 'Syarat tender proyek', history: [H('Diajukan', '2026-09-28 09:12')] },
    { id: 2, code: 'PNJ-2026-0002', type: 'ruangan', layanan: 'Aula Gedung Serbaguna', customer: 'PT Maju Bersama', date: '2026-09-25', status: 'Menunggu Pembayaran', qty: '1 hari', need: 'Seminar karyawan', total: 2500000, history: [H('Diajukan', '2026-09-25 10:00'), H('Diverifikasi', '2026-09-25 14:30', null, 'Admin RTPU')] },
    { id: 3, code: 'PNJ-2026-0003', type: 'produk', layanan: 'Alat Uji Kualitas Air Portable', customer: 'Siti Rahma', date: '2026-09-22', status: 'Menunggu Verifikasi Pembayaran', qty: '2 unit', total: 4900000, method: 'Transfer Bank BNI', history: [H('Diajukan', '2026-09-22 08:40'), H('Menunggu Pembayaran', '2026-09-22 09:15'), H('Menunggu Verifikasi Pembayaran', '2026-09-23 11:02')] },
    { id: 4, code: 'PNJ-2026-0004', type: 'jasa', layanan: 'Kalibrasi Mikroskop', customer: 'Siti Rahma', date: '2026-09-18', status: 'Diproses', qty: '1 unit', history: [H('Diajukan', '2026-09-18 13:20'), H('Menunggu Pembayaran', '2026-09-18 15:00'), H('Menunggu Verifikasi Pembayaran', '2026-09-19 09:44'), H('Diproses', '2026-09-20 08:10', null, 'Admin RTPU')] },
    { id: 5, code: 'PNJ-2026-0005', type: 'ruangan', layanan: 'Ruang Rapat Lantai 2', customer: 'PT Maju Bersama', date: '2026-09-10', status: 'Selesai', qty: '1 sesi', total: 550000, history: [H('Diajukan', '2026-09-10 09:00'), H('Diproses', '2026-09-11 10:00'), H('Selesai', '2026-09-12 16:00', null, 'Admin RTPU')] },
    { id: 6, code: 'PNJ-2026-0006', type: 'jasa', layanan: 'Uji Tarik Baja Tulangan', customer: 'Siti Rahma', date: '2026-09-05', status: 'Ditolak', qty: '5 sampel', note: 'Dokumen pendukung kurang lengkap. Mohon lampirkan surat pengantar dan foto sampel.', history: [H('Diajukan', '2026-09-05 10:30'), H('Ditolak', '2026-09-06 11:15', 'Dokumen pendukung kurang lengkap.', 'Admin RTPU')] },
    { id: 7, code: 'PNJ-2026-0007', type: 'produk', layanan: 'Modul Trainer IoT ESP32', customer: 'Siti Rahma', date: '2026-08-30', status: 'Dibatalkan', qty: '1 unit', history: [H('Diajukan', '2026-08-30 14:00'), H('Dibatalkan', '2026-08-31 09:20', 'Dibatalkan oleh pemohon.')] },
    { id: 8, code: 'PNJ-2026-0008', type: 'ruangan', layanan: 'Aula Gedung Serbaguna', customer: 'Siti Rahma', date: '2026-09-29', status: 'Diajukan', qty: '2 hari', need: 'Pameran inovasi', history: [H('Diajukan', '2026-09-29 08:05')] },
];

export const mockPembayaran = [
    { id: 21, code: 'PNJ-2026-0003', customer: 'Siti Rahma', layanan: 'Alat Uji Kualitas Air Portable', amount: 4900000, method: 'Transfer Bank BNI', at: '2026-09-23 11:02', proof: null, status: 'Menunggu Verifikasi Pembayaran' },
    { id: 22, code: 'PNJ-2026-0009', customer: 'PT Maju Bersama', layanan: 'Uji Kuat Tekan Beton', amount: 1050000, method: 'Virtual Account BRI', at: '2026-09-27 16:40', proof: null, status: 'Menunggu Verifikasi Pembayaran' },
];

export const mockMetode = [
    { id: 1, name: 'Transfer Bank BNI', type: 'Transfer Bank', account: '9888-01-009876-5', holder: 'PNJ Prime (BLU PNJ)', instructions: 'Transfer tepat sesuai tagihan, cantumkan kode pengajuan pada berita transfer.', active: true },
    { id: 2, name: 'Transfer Bank BRI', type: 'Transfer Bank', account: '0022-01-045678-9', holder: 'PNJ Prime (BLU PNJ)', instructions: 'Transfer tepat sesuai tagihan, simpan bukti transfer.', active: true },
    { id: 3, name: 'Virtual Account BRI', type: 'Virtual Account', account: '88899-100-200-300', holder: 'PNJ Prime', instructions: 'Bayar melalui ATM, mobile banking, atau teller dengan nomor VA di atas.', active: true },
    { id: 4, name: 'Tunai di Loket RTPU', type: 'Tunai', account: '-', holder: 'Petugas Loket RTPU', instructions: 'Bayar langsung di loket Gedung RTPU jam kerja, minta kuitansi resmi.', active: false },
];

export const mockProdukUnggulan = [
    { id: 31, code: 'PNJ-PU-0031', name: 'Kompor Biomassa Hemat Energi', researcher: 'Dr. Andi Wijaya', team: 'Teknik Mesin', category: 'Energi', price: 1850000, desc: 'Kompor biomassa efisiensi 38% untuk UMKM kuliner.', status: 'Diajukan', date: '2026-09-26', documents: [{ name: 'proposal.pdf', size: '1,2 MB' }, { name: 'foto-produk.jpg', size: '860 KB' }], history: [H('Diajukan', '2026-09-26 10:10')] },
    { id: 32, code: 'PNJ-PU-0032', name: 'Sensor Banjir LoRa', researcher: 'Dr. Andi Wijaya', team: 'Teknik Elektro', category: 'IoT', price: 950000, desc: 'Sensor ketinggian air berbasis LoRa untuk peringatan dini banjir.', status: 'Disetujui', date: '2026-09-12', documents: [{ name: 'proposal.pdf', size: '980 KB' }], history: [H('Diajukan', '2026-09-12 09:00'), H('Disetujui', '2026-09-15 13:40', null, 'Pimpinan RTPU')] },
    { id: 33, code: 'PNJ-PU-0033', name: 'Pupuk Organik Cair Multiguna', researcher: 'Dr. Andi Wijaya', team: 'Teknik Kimia', category: 'Agro', price: 75000, desc: 'POC dari limbah pasar untuk hortikultura.', status: 'Ditolak', date: '2026-09-08', note: 'Data uji efektivitas belum memenuhi standar. Lengkapi hasil uji laboratorium.', documents: [{ name: 'proposal.pdf', size: '1,1 MB' }], history: [H('Diajukan', '2026-09-08 11:25'), H('Ditolak', '2026-09-10 15:05', 'Data uji efektivitas belum memenuhi standar.', 'Pimpinan RTPU')] },
    { id: 34, code: 'PNJ-PU-0034', name: 'Aplikasi Presensi QR Santri', researcher: 'Dr. Andi Wijaya', team: 'Teknik Informatika', category: 'Aplikasi', price: 0, desc: 'Aplikasi presensi QR untuk pondok pesantren mitra.', status: 'Dibatalkan', date: '2026-08-20', documents: [], history: [H('Diajukan', '2026-08-20 10:00'), H('Dibatalkan', '2026-08-22 09:10', 'Dibatalkan oleh pengaju.')] },
    { id: 35, code: 'PNJ-PU-0035', name: 'Filter Air Gambut Portabel', researcher: 'Dr. Andi Wijaya', team: 'Teknik Sipil', category: 'Lingkungan', price: 1250000, desc: 'Filter air gambut tiga tahap untuk rumah tangga.', status: 'Diajukan', date: '2026-09-29', documents: [{ name: 'proposal.pdf', size: '1,4 MB' }, { name: 'hasil-uji.pdf', size: '720 KB' }], history: [H('Diajukan', '2026-09-29 07:55')] },
];

export const mockFitur = [
    { key: 'katalog', name: 'Katalog Layanan', desc: 'Menjelajah dan melihat detail layanan.', active: true },
    { key: 'pengajuan', name: 'Pengajuan Layanan', desc: 'Membuat, mengubah, dan membatalkan pengajuan.', active: true },
    { key: 'verifikasi', name: 'Verifikasi Pengajuan', desc: 'Meninjau dan memutus pengajuan masuk.', active: true },
    { key: 'pembayaran', name: 'Pembayaran', desc: 'Memilih metode, mengunggah, dan memverifikasi bukti.', active: true },
    { key: 'produk-unggulan', name: 'Produk Unggulan', desc: 'Pengajuan dan verifikasi produk unggulan P3M.', active: true },
    { key: 'pengguna', name: 'Manajemen Pengguna', desc: 'Kelola akun dan peran pengguna.', active: true },
    { key: 'hak-akses', name: 'Hak Akses', desc: 'Matriks izin per peran.', active: true },
    { key: 'fitur', name: 'Kelola Fitur', desc: 'Mengaktifkan dan menonaktifkan modul.', active: false },
];

const AKSI = ['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'];
export const MATRIX_AKSI = AKSI;

const full = () => ({ Lihat: true, Tambah: true, Ubah: true, Hapus: true, Verifikasi: true });
const readOnly = () => ({ Lihat: true, Tambah: false, Ubah: false, Hapus: false, Verifikasi: false });

export const mockPermissions = {
    customer: Object.fromEntries(mockFitur.map((f) => [f.key, f.key === 'katalog' || f.key === 'pengajuan' || f.key === 'pembayaran' ? { ...readOnly(), Tambah: true } : readOnly()])),
    admin_rtpu: Object.fromEntries(mockFitur.map((f) => [f.key, full()])),
    admin_p3m: Object.fromEntries(mockFitur.map((f) => [f.key, f.key === 'produk-unggulan' ? { ...readOnly(), Tambah: true, Ubah: true } : readOnly()])),
    pimpinan_rtpu: Object.fromEntries(mockFitur.map((f) => [f.key, f.key === 'produk-unggulan' ? { Lihat: true, Tambah: false, Ubah: false, Hapus: false, Verifikasi: true } : readOnly()])),
    direktur: Object.fromEntries(mockFitur.map((f) => [f.key, readOnly()])),
    super_admin: Object.fromEntries(mockFitur.map((f) => [f.key, full()])),
};

/** Mock props per preview page. */
export function propsFor(pageKey, role = 'customer') {
    const auth = mockAuth(role);
    const base = { auth };
    switch (pageKey) {
        case 'customer.pengajuan.index':
            return { ...base, pengajuan: mockPengajuan.filter((p) => p.customer === auth.user.name) };
        case 'customer.pengajuan.show':
        case 'customer.pengajuan.edit':
            return { ...base, item: mockPengajuan[0] };
        case 'customer.bayar':
            return { ...base, item: mockPengajuan[1], metode: mockMetode.filter((m) => m.active) };
        case 'customer.riwayat':
            return { ...base, riwayat: mockPengajuan.filter((p) => ['Selesai', 'Dibatalkan', 'Ditolak'].includes(p.status)) };
        case 'rtpu.verify.layanan':
            return { ...base, antrean: mockPengajuan.filter((p) => p.status === 'Diajukan'), selected: mockPengajuan[0] };
        case 'rtpu.verify.bayar':
            return { ...base, antrean: mockPembayaran, selected: mockPembayaran[0] };
        case 'rtpu.status':
            return { ...base, daftar: mockPengajuan.filter((p) => !['Selesai', 'Dibatalkan'].includes(p.status)) };
        case 'rtpu.layanan':
            return { ...base, layanan: mockLayanan };
        case 'rtpu.metode':
            return { ...base, metode: mockMetode };
        case 'rtpu.riwayat':
            return { ...base, riwayat: mockPengajuan };
        case 'p3m.produk.index':
            return { ...base, daftar: mockProdukUnggulan.filter((p) => !['Disetujui', 'Ditolak', 'Dibatalkan'].includes(p.status)) };
        case 'p3m.produk.show':
        case 'p3m.produk.edit':
            return { ...base, item: mockProdukUnggulan[0] };
        case 'p3m.riwayat':
            return { ...base, riwayat: mockProdukUnggulan };
        case 'pimpinan.verify':
            return { ...base, antrean: mockProdukUnggulan.filter((p) => p.status === 'Diajukan'), selected: mockProdukUnggulan[0] };
        case 'pimpinan.monitor':
        case 'direktur.monitor':
            return { ...base, produk: mockProdukUnggulan, layanan: mockPengajuan };
        case 'pimpinan.riwayat':
        case 'direktur.riwayat':
            return { ...base, produk: mockProdukUnggulan, layanan: mockPengajuan };
        case 'superadmin.users':
            return { ...base, users: mockUsers };
        case 'superadmin.hakakses':
            return { ...base, fitur: mockFitur, matriks: mockPermissions };
        case 'superadmin.fitur':
            return { ...base, fitur: mockFitur };
        default:
            return base;
    }
}
