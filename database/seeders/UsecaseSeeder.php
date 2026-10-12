<?php

namespace Database\Seeders;

use App\Models\Fitur;
use App\Models\MetodePembayaran;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UsecaseSeeder extends Seeder
{
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
        ];
        foreach ($fitur as [$key, $nama, $deskripsi]) {
            Fitur::firstOrCreate(['key' => $key], ['nama' => $nama, 'deskripsi' => $deskripsi, 'aktif' => true]);
        }

        $full = ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => true, 'Verifikasi' => true];
        $read = ['Lihat' => true, 'Tambah' => false, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => false];

        $matrix = [
            'customer' => [
                'katalog' => $read, 'pengajuan' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => false, 'Verifikasi' => false],
                'pembayaran' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => false],
            ],
            'admin_rtpu' => ['katalog' => $full, 'pengajuan' => $full, 'verifikasi' => $full, 'pembayaran' => $full, 'produk-unggulan' => $read],
            'admin_p3m' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => true, 'Ubah' => true, 'Hapus' => false, 'Verifikasi' => false]],
            'pimpinan_rtpu' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => false, 'Ubah' => false, 'Hapus' => false, 'Verifikasi' => true]],
            'direktur' => [],
            'super_admin' => [],
        ];

        $allFitur = array_column($fitur, 0);
        foreach (['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'] as $role) {
            foreach ($allFitur as $key) {
                $row = $matrix[$role][$key] ?? $read;
                foreach (['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'] as $aksi) {
                    Permission::updateOrCreate(
                        ['role' => $role, 'fitur_key' => $key, 'aksi' => $aksi],
                        ['allowed' => (bool) ($row[$aksi] ?? false)]
                    );
                }
            }
        }
    }
}
