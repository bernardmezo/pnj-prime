<?php

namespace Database\Seeders;

use App\Models\Fitur;
use App\Models\MetodePembayaran;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UsecaseSeeder extends Seeder
{
    /** Presentation metadata for the shipped fitur (key => [grup, urutan]). */
    private const META = [
        'katalog' => ['Layanan', 1],
        'pengajuan' => ['Layanan', 2],
        'verifikasi' => ['Layanan', 3],
        'pembayaran' => ['Pembayaran', 4],
        'produk-unggulan' => ['P3M', 5],
        'pengguna' => ['Administrasi', 6],
        'hak-akses' => ['Administrasi', 7],
        'fitur' => ['Administrasi', 8],
        'master-pajak' => ['Administrasi', 9],
        'laporan' => ['Administrasi', 10],
        'tenant' => ['Layanan', 11],
    ];

    /**
     * Factory-default permission matrix (role => fitur => aksi => bool).
     * Shared with HakAksesController so the "Kembalikan ke bawaan" preset can
     * reset a role to the values this seeder would install. Super Admin is
     * always full — it is locked in the UI.
     *
     * @return array<string, array<string, array<string, bool>>>
     */
    public static function defaultMatrix(?array $fiturKeys = null): array
    {
        $full = ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => true, 'Verifikasi' => true];
        $read = ['Lihat' => true, 'Tambah' => false, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => false];

        $explicit = [
            'customer' => [
                'katalog' => $read,
                'pengajuan' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => false, 'Verifikasi' => false],
                'pembayaran' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => false],
            ],
            'admin_rtpu' => ['katalog' => $full, 'pengajuan' => $full, 'verifikasi' => $full, 'pembayaran' => $full, 'produk-unggulan' => $read, 'master-pajak' => $full, 'laporan' => $full, 'tenant' => $full],
            'admin_p3m' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => false, 'Verifikasi' => false]],
            'pimpinan_rtpu' => [
                'produk-unggulan' => ['Lihat' => true, 'Tambah' => false, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => true],
                'pengajuan' => ['Lihat' => true, 'Tambah' => false, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => true],
                'laporan' => $read,
            ],
            'direktur' => ['laporan' => $read],
            'super_admin' => [],
        ];

        $keys = $fiturKeys ?? array_keys(self::META);
        $out = [];
        foreach (['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'] as $role) {
            foreach ($keys as $key) {
                $out[$role][$key] = $role === 'super_admin' ? $full : ($explicit[$role][$key] ?? $read);
            }
        }

        return $out;
    }

    public function run(): void
    {
        // Satu-satunya kanal resmi: Mandiri BLU PNJ. Nomor rekening mengikuti
        // pengaturan admin (payment_account_number); Admin RTPU dapat
        // mengubahnya lewat halaman Pengaturan atau Kelola Metode.
        $rekening = DB::table('settings')->where('key', 'payment_account_number')->value('value') ?: '-';
        MetodePembayaran::updateOrCreate(
            ['nama' => 'Mandiri BLU PNJ'],
            ['tipe' => 'Transfer Bank', 'rekening' => $rekening, 'holder' => 'Politeknik Negeri Jakarta',
                'instruksi' => 'Transfer tepat sesuai tagihan ke rekening BLU PNJ, cantumkan kode pengajuan pada berita transfer.', 'aktif' => true]
        );
        MetodePembayaran::where('nama', '!=', 'Mandiri BLU PNJ')->delete();

        $fitur = [
            ['katalog', 'Katalog Layanan', 'Menjelajah dan melihat detail layanan.'],
            ['pengajuan', 'Pengajuan Layanan', 'Membuat, mengubah, dan membatalkan pengajuan.'],
            ['verifikasi', 'Verifikasi Pengajuan', 'Meninjau dan memutus pengajuan masuk.'],
            ['pembayaran', 'Pembayaran', 'Memilih metode, mengunggah, dan memverifikasi bukti.'],
            ['produk-unggulan', 'Produk Unggulan', 'Pengajuan dan verifikasi produk unggulan P3M.'],
            ['pengguna', 'Manajemen Pengguna', 'Kelola akun dan peran pengguna.'],
            ['hak-akses', 'Hak Akses', 'Matriks izin per peran.'],
            ['fitur', 'Kelola Fitur', 'Mengaktifkan dan menonaktifkan modul.'],
            ['master-pajak', 'Master Pajak', 'Kelola tarif pajak dan ambang PPN.'],
            ['laporan', 'Laporan & Audit', 'Laporan transaksi, statistik, dan log audit.'],
            ['tenant', 'Verifikasi Tenant', 'Validasi profil usaha dan dokumen tenant.'],
        ];
        foreach ($fitur as [$key, $nama, $deskripsi]) {
            [$grup, $urutan] = self::META[$key] ?? ['Lainnya', 0];
            Fitur::firstOrCreate(['key' => $key], [
                'nama' => $nama,
                'deskripsi' => $deskripsi,
                'aktif' => true,
                'grup' => $grup,
                'urutan' => $urutan,
                'aksi_tersedia' => Permission::AKSI,
                'terkunci' => in_array($key, Fitur::PROTECTED, true),
            ]);
        }

        $allFitur = array_column($fitur, 0);
        $matrix = self::defaultMatrix($allFitur);
        foreach ($matrix as $role => $fiturs) {
            foreach ($fiturs as $key => $row) {
                foreach (Permission::AKSI as $aksi) {
                    Permission::updateOrCreate(
                        ['role' => $role, 'fitur_key' => $key, 'aksi' => $aksi],
                        ['allowed' => (bool) ($row[$aksi] ?? false)]
                    );
                }
            }
        }
    }
}
