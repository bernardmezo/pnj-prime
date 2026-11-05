<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $ordersQuery = Order::whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59']);

        $summary = [
            'total_orders' => (clone $ordersQuery)->count(),
            'total_revenue' => (clone $ordersQuery)->whereIn('status', ['diproses', 'selesai'])->sum('total'),
            'total_tax' => (clone $ordersQuery)->whereIn('status', ['diproses', 'selesai'])->sum('tax_amount'),
            'pending_payment' => (clone $ordersQuery)->where('status', 'menunggu_pembayaran')->count(),
            'pending_verification' => (clone $ordersQuery)->where('status', 'menunggu_verifikasi')->count(),
            'completed' => (clone $ordersQuery)->where('status', 'selesai')->count(),
        ];

        $recentOrders = (clone $ordersQuery)
            ->with(['buyer:id,name', 'taxRate:id,name,rate'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'buyer' => $o->buyer?->name,
                'subtotal' => $o->subtotal,
                'tax_name' => $o->tax_name_snapshot ?? $o->taxRate?->name ?? 'PPN',
                'tax_amount' => $o->tax_amount,
                'total' => $o->total,
                'status' => $o->status,
                'order_type' => $o->order_type,
                'created_at' => optional($o->created_at)->format('Y-m-d H:i'),
            ]);

        $auditLogs = AuditLog::with('user:id,name')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'user' => $l->user?->name ?? 'Sistem',
                'action' => $l->action,
                'entity_type' => $l->entity_type,
                'entity_id' => $l->entity_id,
                'ip_address' => $l->ip_address,
                'created_at' => optional($l->created_at)->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('Reports/Index', [
            'filter' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => $summary,
            'orders' => $recentOrders,
            'audit_logs' => $auditLogs,
        ]);
    }
}
