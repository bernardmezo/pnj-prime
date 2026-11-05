<?php

namespace App\Enums;

enum PengajuanStatus: string
{
    case Diajukan = 'Diajukan';
    case MenungguPersetujuanPimpinan = 'Menunggu Persetujuan Pimpinan';
    case MenungguPembayaran = 'Menunggu Pembayaran';
    case MenungguVerifikasiPembayaran = 'Menunggu Verifikasi Pembayaran';
    case Diproses = 'Diproses';
    case Selesai = 'Selesai';
    case Dibatalkan = 'Dibatalkan';
    case Ditolak = 'Ditolak';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function isClosed(): bool
    {
        return match ($this) {
            self::Selesai, self::Dibatalkan, self::Ditolak => true,
            default => false,
        };
    }
}
