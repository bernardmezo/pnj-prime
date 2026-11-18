<?php

namespace App\Enums;

/**
 * Product curation workflow status.
 * 
 * Alur lengkap:
 * 1. draft → pending (Pengelola submit)
 * 2. pending → verified (Admin RTPU verifikasi) | rejected | perlu_revisi_harga
 * 3. perlu_revisi_harga → counter_offer | pending (Pengelola setuju harga RTPU) | rejected
 * 4. counter_offer → verified (Admin RTPU terima counter) | perlu_revisi_harga | rejected
 * 5. verified → approved (Pimpinan setujui) | rejected | perlu_revisi_harga (jika Pimpinan minta revisi)
 * 6. rejected → draft (Pengelola bisa ajukan ulang, start dari awal)
 * 7. approved → final (Produk live di katalog)
 */
class ProductStatus
{
    // Initial state
    public const DRAFT = 'draft';

    // Submission & verification flow
    public const PENDING = 'pending';
    public const VERIFIED = 'verified';

    // Price negotiation states (NEW)
    public const PERLU_REVISI_HARGA = 'perlu_revisi_harga';
    public const COUNTER_OFFER = 'counter_offer';

    // Final states
    public const APPROVED = 'approved';
    public const REJECTED = 'rejected';

    /**
     * All valid statuses.
     */
    public static function all(): array
    {
        return [
            self::DRAFT,
            self::PENDING,
            self::VERIFIED,
            self::PERLU_REVISI_HARGA,
            self::COUNTER_OFFER,
            self::APPROVED,
            self::REJECTED,
        ];
    }

    /**
     * Valid transitions: from_status => [to_statuses]
     * 
     * Rules:
     * - draft → pending (Pengelola submit) | rejected (existing product reject)
     * - pending → verified (RTPU ok) | rejected (RTPU reject) | perlu_revisi_harga (RTPU ask revise price)
     * - perlu_revisi_harga → pending (Pengelola setuju RTPU harga) | counter_offer (Pengelola counter) | rejected (give up)
     * - counter_offer → verified (RTPU terima counter) | perlu_revisi_harga (RTPU counter back) | rejected
     * - verified → approved (Pimpinan ok) | rejected (Pimpinan tolak) | perlu_revisi_harga (Pimpinan ask revise)
     * - approved → approved (no change, already final)
     * - rejected → draft (Pengelola mulai ulang)
     */
    public static function transitions(): array
    {
        return [
            self::DRAFT => [self::PENDING, self::REJECTED],
            self::PENDING => [self::VERIFIED, self::REJECTED, self::PERLU_REVISI_HARGA],
            self::PERLU_REVISI_HARGA => [self::PENDING, self::COUNTER_OFFER, self::REJECTED],
            self::COUNTER_OFFER => [self::VERIFIED, self::PERLU_REVISI_HARGA, self::REJECTED],
            self::VERIFIED => [self::APPROVED, self::REJECTED, self::PERLU_REVISI_HARGA],
            self::APPROVED => [self::APPROVED], // No change from approved
            self::REJECTED => [self::DRAFT], // Can resubmit
        ];
    }

    /**
     * Check if transition from → to is valid.
     */
    public static function canTransition(string $from, string $to): bool
    {
        $valid = self::transitions()[$from] ?? null;
        
        if ($valid === null) {
            return false; // Unknown status
        }

        return in_array($to, $valid, true);
    }

    /**
     * Statuses where Pengelola can edit product data.
     */
    public static function editableByPengelola(): array
    {
        return [
            self::DRAFT,
            self::REJECTED,
            self::PERLU_REVISI_HARGA,
            self::COUNTER_OFFER,
        ];
    }

    /**
     * Statuses where product is visible in public catalog.
     */
    public static function visibleInCatalog(): array
    {
        return [self::APPROVED];
    }

    /**
     * Human-readable labels.
     */
    public static function label(string $status): string
    {
        return match ($status) {
            self::DRAFT => 'Draft',
            self::PENDING => 'Menunggu Verifikasi',
            self::VERIFIED => 'Terverifikasi',
            self::PERLU_REVISI_HARGA => 'Perlu Revisi Harga',
            self::COUNTER_OFFER => 'Counter Offer',
            self::APPROVED => 'Disetujui',
            self::REJECTED => 'Ditolak',
            default => 'Tidak Dikenal',
        };
    }
}
