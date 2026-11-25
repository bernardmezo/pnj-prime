<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProdukUnggulan;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $allPengajuan = Pengajuan::with(['product', 'buyer'])->get();

        $pendingProductsCount = Product::whereIn('curation_status', ['pending', 'verified'])->count();
        $menungguVerifikasi = $allPengajuan->whereIn('status', ['Diajukan', 'Menunggu Invoice'])->count() + $pendingProductsCount;
        $verificationQueues = collect([
            ['key' => 'akun', 'label' => 'Verifikasi akun', 'count' => User::whereIn('role', ['admin_pengelola', 'admin_jurusan', 'admin_p3m'])->where('account_status', 'pending')->count(), 'route' => 'rtpu.verify.akun'],
            ['key' => 'layanan', 'label' => 'Verifikasi layanan dan katalog', 'count' => $menungguVerifikasi, 'route' => 'rtpu.verify.layanan'],
            ['key' => 'produk', 'label' => 'Verifikasi produk unggulan', 'count' => ProdukUnggulan::where('status', 'Diajukan')->count(), 'route' => 'rtpu.verify.produk'],
            ['key' => 'pembayaran', 'label' => 'Verifikasi pembayaran', 'count' => Payment::where('status', 'pending')->count() + PaymentProof::where('verification_status', 'pending')->count(), 'route' => 'rtpu.verify.bayar', 'description' => 'Termasuk pembayaran Midtrans yang masih menunggu dan bukti transfer manual.'],
        ])->map(fn ($queue) => [...$queue, 'url' => route($queue['route'])]);
        $menungguBayar = $allPengajuan->where('status', 'Menunggu Pembayaran')->count();
        $verifikasiBayar = $allPengajuan->where('status', 'Menunggu Verifikasi Pembayaran')->count();
        $diproses = $allPengajuan->where('status', 'Diproses')->count();
        $selesai = $allPengajuan->where('status', 'Selesai')->count();
        $ditolak = $allPengajuan->whereIn('status', ['Ditolak', 'Dibatalkan'])->count();
        $totalPengajuan = $allPengajuan->count();

        // Completion rate percentage
        $completionRate = $totalPengajuan > 0 ? (int) round(($selesai / $totalPengajuan) * 100) : 0;

        // Total revenue from completed requests
        $completedRevenue = (int) $allPengajuan->where('status', 'Selesai')->sum('total');

        $stats = [
            'menunggu_verifikasi' => $menungguVerifikasi,
            'menunggu_pembayaran' => $menungguBayar,
            'verifikasi_bayar' => $verifikasiBayar,
            'diproses' => $diproses,
            'selesai' => $selesai,
            'ditolak' => $ditolak,
            'total_pengajuan' => $totalPengajuan,
            'total_layanan' => Product::count(),
            'layanan_aktif' => Product::where('is_active', true)->count(),
            'metode_aktif' => MetodePembayaran::where('aktif', true)->count(),
            'completion_rate' => $completionRate,
            'completed_revenue' => $completedRevenue,
            'pending_actions' => $menungguVerifikasi + $verifikasiBayar,
        ];

        // Lifecycle flow stages for visual funnel / pipeline
        $stages = [
            [
                'key' => 'diajukan',
                'step' => 1,
                'name' => 'Pengajuan Masuk',
                'shortName' => 'Diajukan',
                'desc' => 'Menunggu verifikasi admin',
                'count' => $menungguVerifikasi,
                'tone' => 'gold',
                'routeKey' => 'rtpu.verify.layanan',
            ],
            [
                'key' => 'menunggu_pembayaran',
                'step' => 2,
                'name' => 'Menunggu Pembayaran',
                'shortName' => 'Menunggu Bayar',
                'desc' => 'Menanti pembayaran customer',
                'count' => $menungguBayar,
                'tone' => 'gold',
                'routeKey' => 'rtpu.status',
            ],
            [
                'key' => 'verifikasi_bayar',
                'step' => 3,
                'name' => 'Verifikasi Pembayaran',
                'shortName' => 'Cek Bukti Bayar',
                'desc' => 'Periksa bukti transfer',
                'count' => $verifikasiBayar,
                'tone' => 'gold',
                'routeKey' => 'rtpu.verify.bayar',
            ],
            [
                'key' => 'diproses',
                'step' => 4,
                'name' => 'Sedang Dikerjakan',
                'shortName' => 'Diproses',
                'desc' => 'Pengerjaan layanan aktif',
                'count' => $diproses,
                'tone' => 'teal',
                'routeKey' => 'rtpu.status',
            ],
            [
                'key' => 'selesai',
                'step' => 5,
                'name' => 'Layanan Selesai',
                'shortName' => 'Selesai',
                'desc' => 'Layanan berhasil dituntaskan',
                'count' => $selesai,
                'tone' => 'teal',
                'routeKey' => 'rtpu.riwayat',
            ],
        ];

        // Status distribution for the donut chart and breakdown list
        $statusDistribution = [
            ['label' => 'Diajukan', 'value' => $menungguVerifikasi, 'tone' => 'gold'],
            ['label' => 'Menunggu Pembayaran', 'value' => $menungguBayar, 'tone' => 'gold'],
            ['label' => 'Verifikasi Pembayaran', 'value' => $verifikasiBayar, 'tone' => 'gold'],
            ['label' => 'Diproses', 'value' => $diproses, 'tone' => 'teal'],
            ['label' => 'Selesai', 'value' => $selesai, 'tone' => 'teal'],
            ['label' => 'Ditolak / Dibatalkan', 'value' => $ditolak, 'tone' => 'danger'],
        ];

        $recentPengajuan = Pengajuan::with('product', 'buyer')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $status = $p->status;
                $action = match ($status) {
                    'Diajukan' => ['label' => 'Verifikasi', 'routeKey' => 'rtpu.verify.layanan'],
                    'Menunggu Verifikasi Pembayaran' => ['label' => 'Cek Bayar', 'routeKey' => 'rtpu.verify.bayar'],
                    'Diproses' => ['label' => 'Update Status', 'routeKey' => 'rtpu.status'],
                    default => ['label' => 'Detail Riwayat', 'routeKey' => 'rtpu.riwayat'],
                };

                return [
                    'id' => $p->id,
                    'code' => $p->code,
                    'customer' => $p->buyer?->name ?? 'Customer',
                    'customer_email' => $p->buyer?->email ?? null,
                    'layanan' => $p->product?->name ?? 'Layanan RTPU',
                    'tipe' => $p->tipe ?? 'jasa',
                    'total' => (int) ($p->total ?? 0),
                    'total_formatted' => $p->total ? 'Rp '.number_format($p->total, 0, ',', '.') : '-',
                    'date' => optional($p->created_at)->format('Y-m-d'),
                    'time' => optional($p->created_at)->format('H:i'),
                    'status' => $status,
                    'action' => $action,
                ];
            });

        return Inertia::render('Rtpu/Dashboard', [
            'verificationQueues' => $verificationQueues,
            'stats' => $stats,
            'stages' => $stages,
            'statusDistribution' => $statusDistribution,
            'recentPengajuan' => $recentPengajuan,
        ]);
    }
}
