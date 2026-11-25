<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Models\Product;

class MonitoringData
{
    public function productSales(): \Illuminate\Support\Collection
    {
        $sales = Pengajuan::query()
            ->where(function ($query) {
                $query->where(fn ($q) => $q->where('tipe', 'produk')->whereIn('status', ['Lunas', 'Diproses', 'Dikirim', 'Selesai']))
                    ->orWhere(fn ($q) => $q->where('tipe', 'jasa')->whereIn('status', ['Lunas', 'Diproses', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah', 'Selesai']))
                    ->orWhere(fn ($q) => $q->whereIn('tipe', ['ruangan', 'alat'])->whereIn('status', ['Lunas', 'Diproses', 'Terjadwal', 'Berjalan', 'Dipinjam', 'Dikembalikan', 'Selesai']));
            })
            ->whereNotNull('product_id')
            ->get(['product_id', 'tipe', 'jumlah'])
            ->groupBy('product_id');

        return Product::with(['category.parent', 'owner:id,name'])
            ->latest()
            ->get()
            ->map(function ($product) use ($sales) {
                $type = $product->layananTipe();
                $requests = $sales->get($product->id, collect())->filter(fn ($request) => $type === 'ruangan' ? in_array($request->tipe, ['ruangan', 'alat'], true) : $request->tipe === $type);

                return [
                    'id' => $product->id,
                    'code' => 'PROD-'.$product->id,
                    'name' => $product->name,
                    'owner' => $product->owner?->name,
                    'date' => $product->created_at?->format('Y-m-d H:i'),
                    'status' => $product->curation_status,
                    'type' => $type,
                    'sold_count' => $type === 'produk' ? $requests->sum(fn ($request) => \App\Services\PricingService::parseQty($request->jumlah)) : 0,
                    'usage_count' => $type === 'produk' ? 0 : $requests->count(),
                ];
            })->values();
    }

    public function history(): \Illuminate\Support\Collection
    {
        return Pengajuan::with(['product', 'buyer:id,name'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->tipe,
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'customer' => $p->buyer?->name,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
                'history' => $p->history ?? [],
            ]);
    }
}
