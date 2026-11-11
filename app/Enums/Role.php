<?php

namespace App\Enums;

enum Role: string
{
    case Customer = 'customer';
    case AdminRtpu = 'admin_rtpu';
    case AdminP3m = 'admin_p3m';
    case AdminPengelola = 'admin_pengelola';
    case AdminJurusan = 'admin_jurusan';
    case PimpinanRtpu = 'pimpinan_rtpu';
    case Direktur = 'direktur';
    case SuperAdmin = 'super_admin';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Customer',
            self::AdminRtpu => 'Admin RTPU',
            self::AdminP3m => 'Admin P3M',
            self::AdminPengelola => 'Admin Pengelola',
            self::AdminJurusan => 'Admin Jurusan',
            self::PimpinanRtpu => 'Pimpinan RTPU',
            self::Direktur => 'Direktur',
            self::SuperAdmin => 'Super Admin',
        };
    }
}
