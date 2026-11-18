<?php

namespace App\Services;

use App\Enums\ProductStatus;
use App\Models\Product;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Centralized product status transitions.
 * All places that change curation_status should use these methods.
 * 
 * Ensures:
 * 1. Valid status transitions only
 * 2. Audit trail (who, when, why)
 * 3. Consistent business logic
 */
class ProductStatusTransitionService
{
    /**
     * Pengelola submits product (draft → pending).
     */
    public static function submitToPending(Product $product, Authenticatable $user): void
    {
        if (!$product->isDraft()) {
            throw new \InvalidArgumentException('Hanya produk berstatus draft yang dapat diajukan.');
        }

        $product->transitionTo(ProductStatus::PENDING, $user, 'Pengajuan oleh Pengelola');
    }

    /**
     * Admin RTPU verifies product (pending → verified).
     */
    public static function verifyToVerified(Product $product, Authenticatable $user): void
    {
        if (!in_array($product->curation_status, [ProductStatus::PENDING, ProductStatus::COUNTER_OFFER], true)) {
            throw new \InvalidArgumentException('Hanya produk berstatus pending atau counter_offer yang dapat diverifikasi.');
        }

        $product->transitionTo(ProductStatus::VERIFIED, $user, 'Verifikasi oleh Admin RTPU');
    }

    /**
     * Admin RTPU asks for price revision (pending/verified → perlu_revisi_harga).
     */
    public static function requestPriceRevision(Product $product, Authenticatable $user, string $note = ''): void
    {
        if (!in_array($product->curation_status, [ProductStatus::PENDING, ProductStatus::VERIFIED], true)) {
            throw new \InvalidArgumentException('Hanya produk berstatus pending atau verified yang dapat diminta revisi harga.');
        }

        $product->transitionTo(ProductStatus::PERLU_REVISI_HARGA, $user, 'Permintaan revisi harga: ' . $note);
    }

    /**
     * Pengelola counters RTPU's price (perlu_revisi_harga → counter_offer).
     */
    public static function submitCounterOffer(Product $product, Authenticatable $user, string $note = ''): void
    {
        if ($product->curation_status !== ProductStatus::PERLU_REVISI_HARGA) {
            throw new \InvalidArgumentException('Hanya produk berstatus perlu_revisi_harga yang dapat counter offer.');
        }

        $product->transitionTo(ProductStatus::COUNTER_OFFER, $user, 'Counter offer harga: ' . $note);
    }

    /**
     * Pengelola agrees with RTPU's price (perlu_revisi_harga → pending, back to verification).
     */
    public static function acceptRtpuPrice(Product $product, Authenticatable $user): void
    {
        if ($product->curation_status !== ProductStatus::PERLU_REVISI_HARGA) {
            throw new \InvalidArgumentException('Hanya produk berstatus perlu_revisi_harga yang dapat setuju harga RTPU.');
        }

        // Go back to pending, then to verified after re-verification (or skip to verified if auto-approved)
        $product->transitionTo(ProductStatus::PENDING, $user, 'Setuju harga RTPU, kembali ke verifikasi');
    }

    /**
     * Pimpinan approves product (verified → approved).
     */
    public static function approveToApproved(Product $product, Authenticatable $user): void
    {
        if ($product->curation_status !== ProductStatus::VERIFIED) {
            throw new \InvalidArgumentException('Hanya produk berstatus verified yang dapat disetujui.');
        }

        $product->transitionTo(ProductStatus::APPROVED, $user, 'Persetujuan oleh Pimpinan RTPU');
    }

    /**
     * Reject product (from pending/verified/counter_offer → rejected).
     */
    public static function reject(Product $product, Authenticatable $user, string $reason = ''): void
    {
        if (!in_array($product->curation_status, [ProductStatus::PENDING, ProductStatus::VERIFIED, ProductStatus::COUNTER_OFFER], true)) {
            throw new \InvalidArgumentException('Produk tidak berada dalam status yang dapat ditolak.');
        }

        $product->transitionTo(ProductStatus::REJECTED, $user, 'Penolakan: ' . $reason);
    }

    /**
     * Pengelola resubmits after rejection (rejected → draft).
     */
    public static function resubmitAfterRejection(Product $product, Authenticatable $user): void
    {
        if ($product->curation_status !== ProductStatus::REJECTED) {
            throw new \InvalidArgumentException('Hanya produk berstatus rejected yang dapat diajukan ulang.');
        }

        $product->transitionTo(ProductStatus::DRAFT, $user, 'Pengajuan ulang setelah penolakan');
    }
}
