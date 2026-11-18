<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

/**
 * Agregasi read-only untuk dashboard Direktorat.
 *
 * Aturan "penjualan" (disetujui Direktorat): order berstatus `selesai`
 * (produk, jasa, maupun sewa), dihitung pada tanggal `completed_at`.
 * Semua angka dihitung di database dengan GROUP BY/SUM/COUNT; tidak ada
 * koleksi penuh yang dimuat ke memori. Tidak ada data pribadi yang keluar.
 */
class DirekturSummaryService
{
    /** Batas maksimum rentang tanggal (hari) agar query tetap ringan. */
    public const MAX_RANGE_DAYS = 731;

    /** Peran yang digabung saat menghitung akun (admin_jurusan bagian Pengelola). */
    private const ROLE_GROUPS = [
        'customer' => 'Customer',
        'admin_pengelola' => 'Admin Pengelola',
        'admin_jurusan' => 'Admin Pengelola',
        'admin_rtpu' => 'Admin RTPU',
        'pimpinan_rtpu' => 'Pimpinan RTPU',
        'direktur' => 'Direktorat',
        'super_admin' => 'Super Admin',
        'admin_p3m' => 'Admin P3M',
    ];

    /**
     * @return array<string, mixed>
     */
    public function summary(Carbon $from, Carbon $to): array
    {
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->endOfDay();
        $granularity = $from->diffInDays($to) <= 62 ? 'day' : 'month';

        return [
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'granularity' => $granularity,
            ],
            'sales' => $this->sales($from, $to, $granularity),
            'funnel' => $this->funnel($from, $to),
            'accounts' => $this->accounts($from, $to),
            'negotiation' => $this->negotiation(),
        ];
    }

    /**
     * Penjualan: KPI, tren, per kategori, dan 10 produk terlaris.
     *
     * Omzet KPI memakai orders.total (dibayar customer, termasuk pajak) dan
     * orders.subtotal (sebelum pajak). Per kategori dan produk terlaris memakai
     * order_items.subtotal (sebelum pajak) karena pajak dicatat per order.
     */
    private function sales(Carbon $from, Carbon $to, string $granularity): array
    {
        $base = fn () => Order::query()
            ->where('orders.status', 'selesai')
            ->whereBetween('orders.completed_at', [$from, $to]);

        $kpi = $base()->selectRaw('COUNT(*) as transaksi, COALESCE(SUM(orders.total),0) as total, COALESCE(SUM(orders.subtotal),0) as subtotal')->first();

        $bucket = $this->bucketExpression('orders.completed_at', $granularity);
        $rows = $base()
            ->selectRaw("$bucket as bucket, COUNT(*) as transaksi, COALESCE(SUM(orders.total),0) as total")
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get()
            ->keyBy('bucket');

        $series = [];
        foreach ($this->buckets($from, $to, $granularity) as $key => $label) {
            $row = $rows->get($key);
            $series[] = [
                'key' => $key,
                'label' => $label,
                'transaksi' => (int) ($row->transaksi ?? 0),
                'total' => (int) ($row->total ?? 0),
            ];
        }

        $itemBase = fn () => DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNull('orders.deleted_at')
            ->where('orders.status', 'selesai')
            ->whereBetween('orders.completed_at', [$from, $to]);

        $perKategori = $itemBase()
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('product_categories as cat', 'cat.id', '=', 'products.category_id')
            ->leftJoin('product_categories as parent', 'parent.id', '=', 'cat.parent_id')
            ->selectRaw("COALESCE(parent.name, cat.name, 'Tanpa kategori') as kategori, COALESCE(SUM(order_items.subtotal),0) as total, COALESCE(SUM(order_items.quantity),0) as qty")
            ->groupBy('kategori')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['kategori' => $r->kategori, 'total' => (int) $r->total, 'qty' => (int) $r->qty])
            ->all();

        $terlaris = $itemBase()
            ->selectRaw('order_items.product_id as product_id, MAX(order_items.product_name) as nama, COALESCE(SUM(order_items.quantity),0) as qty, COALESCE(SUM(order_items.subtotal),0) as total')
            ->groupBy('order_items.product_id')
            ->orderByDesc('qty')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['product_id' => $r->product_id, 'nama' => $r->nama, 'qty' => (int) $r->qty, 'total' => (int) $r->total])
            ->all();

        return [
            'kpi' => [
                'transaksi' => (int) $kpi->transaksi,
                'omzet_total' => (int) $kpi->total,
                'omzet_subtotal' => (int) $kpi->subtotal,
            ],
            'series' => $series,
            'per_kategori' => $perKategori,
            'terlaris' => $terlaris,
        ];
    }

    /**
     * Funnel alur produk dari products.curation_status (status yang ada,
     * tidak ada status baru). Menghitung produk yang dibuat dalam rentang.
     * Ini jumlah per status saat ini, bukan riwayat perjalanan tiap produk.
     */
    private function funnel(Carbon $from, Carbon $to): array
    {
        $byStatus = Product::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('curation_status, COUNT(*) as n')
            ->groupBy('curation_status')
            ->pluck('n', 'curation_status');

        $tayang = Product::query()
            ->whereBetween('created_at', [$from, $to])
            ->where('curation_status', 'approved')
            ->where('is_active', true)
            ->count();

        $transaksi = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNull('orders.deleted_at')
            ->where('orders.status', 'selesai')
            ->whereBetween('orders.completed_at', [$from, $to])
            ->distinct()
            ->count('order_items.product_id');

        $n = fn (string ...$s) => (int) collect($s)->sum(fn ($k) => $byStatus[$k] ?? 0);

        return [
            'tahap' => [
                ['key' => 'diajukan', 'label' => 'Diajukan (menunggu verifikasi)', 'jumlah' => $n('pending')],
                ['key' => 'diverifikasi', 'label' => 'Diverifikasi RTPU', 'jumlah' => $n('verified')],
                ['key' => 'revisi_harga', 'label' => 'Perlu revisi harga', 'jumlah' => $n('perlu_revisi_harga', 'counter_offer')],
                ['key' => 'disetujui', 'label' => 'Disetujui final', 'jumlah' => $n('approved')],
                ['key' => 'tayang', 'label' => 'Tayang di katalog', 'jumlah' => $tayang],
                ['key' => 'transaksi', 'label' => 'Pernah bertransaksi (selesai)', 'jumlah' => (int) $transaksi],
                ['key' => 'ditolak', 'label' => 'Ditolak', 'jumlah' => $n('rejected')],
            ],
            'draft' => $n('draft'),
            'total' => (int) $byStatus->sum(),
        ];
    }

    /**
     * Akun per peran dan pertumbuhan pendaftaran. Hanya angka agregat.
     */
    private function accounts(Carbon $from, Carbon $to): array
    {
        $perRole = [];
        foreach (User::query()->selectRaw('role, COUNT(*) as n')->groupBy('role')->pluck('n', 'role') as $role => $n) {
            $label = self::ROLE_GROUPS[$role] ?? 'Lainnya';
            $perRole[$label] = ($perRole[$label] ?? 0) + (int) $n;
        }
        arsort($perRole);

        $bucket = $this->bucketExpression('created_at', 'month');
        $rows = User::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("$bucket as bucket, COUNT(*) as n")
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->pluck('n', 'bucket');

        $growth = [];
        foreach ($this->buckets($from, $to, 'month') as $key => $label) {
            $growth[] = ['key' => $key, 'label' => $label, 'jumlah' => (int) ($rows[$key] ?? 0)];
        }

        return [
            'per_role' => collect($perRole)->map(fn ($n, $label) => ['label' => $label, 'jumlah' => $n])->values()->all(),
            'total' => array_sum($perRole),
            'pertumbuhan' => $growth,
        ];
    }

    /**
     * Negosiasi harga: hanya produk yang sedang berjalan. Riwayat putaran tidak
     * disimpan di sistem, jadi rata-rata putaran sengaja tidak dihitung.
     */
    private function negotiation(): array
    {
        $rows = Product::query()
            ->whereIn('curation_status', ['perlu_revisi_harga', 'counter_offer'])
            ->selectRaw('curation_status, COUNT(*) as n')
            ->groupBy('curation_status')
            ->pluck('n', 'curation_status');

        $revisi = (int) ($rows['perlu_revisi_harga'] ?? 0);
        $counter = (int) ($rows['counter_offer'] ?? 0);

        return [
            'berjalan' => $revisi + $counter,
            'menunggu_pengelola' => $revisi,
            'menunggu_rtpu' => $counter,
        ];
    }

    /**
     * Ekspresi pengelompokan periode sesuai driver database.
     */
    private function bucketExpression(string $column, string $granularity): string
    {
        $driver = DB::connection()->getDriverName();
        $day = $granularity === 'day';

        return match ($driver) {
            'pgsql' => $day ? "to_char($column, 'YYYY-MM-DD')" : "to_char($column, 'YYYY-MM')",
            'mysql', 'mariadb' => $day ? "DATE_FORMAT($column, '%Y-%m-%d')" : "DATE_FORMAT($column, '%Y-%m')",
            default => $day ? "strftime('%Y-%m-%d', $column)" : "strftime('%Y-%m', $column)",
        };
    }

    /**
     * Semua periode dalam rentang (agar bulan/hari kosong tampil sebagai 0).
     *
     * @return array<string, string> key => label
     */
    private function buckets(Carbon $from, Carbon $to, string $granularity): array
    {
        $out = [];
        if ($granularity === 'day') {
            foreach (CarbonPeriod::create($from->copy()->startOfDay(), '1 day', $to->copy()->startOfDay()) as $d) {
                $out[$d->format('Y-m-d')] = $d->format('d/m');
            }

            return $out;
        }

        foreach (CarbonPeriod::create($from->copy()->startOfMonth(), '1 month', $to->copy()->startOfMonth()) as $d) {
            $out[$d->format('Y-m')] = $d->locale('id')->translatedFormat('M Y');
        }

        return $out;
    }
}
