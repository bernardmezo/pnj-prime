<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApproveCatalogProduct
{
    public function handle(Product $product, User $reviewer): void
    {
        DB::transaction(function () use ($product, $reviewer) {
            $locked = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($locked->curation_status, ['pending', 'verified'], true), 422, 'Produk tidak lagi menunggu persetujuan.');
            $meta = $locked->meta ?? [];
            if ($reviewer->role === 'admin_rtpu') {
                $meta['rtpu_verified_at'] = now()->toIso8601String();
                $meta['rtpu_verifier_id'] = $reviewer->id;
                $meta['rtpu_verifier_name'] = $reviewer->name;
            } else {
                $meta['pimpinan_approved_at'] = now()->toIso8601String();
                $meta['pimpinan_approver_id'] = $reviewer->id;
                $meta['pimpinan_approver_name'] = $reviewer->name;
            }
            $locked->update([
                'curation_status' => 'approved',
                'is_active' => true,
                'approved_at' => now(),
                'approved_by' => $reviewer->id,
                'rejection_reason' => null,
                'meta' => $meta,
            ]);
        });
    }
}
