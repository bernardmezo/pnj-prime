<?php

namespace App\Policies;

use App\Models\Pengajuan;
use App\Models\User;

/**
 * Authorization policy for Pengajuan (order requests) access control.
 * 
 * Rules:
 * - Super Admin: full access
 * - Admin RTPU: view all pengajuan for verification
 * - Admin Pengelola: only pengajuan for products they own
 * - Customer: only their own pengajuan (buyer_id === user.id)
 */
class PengajuanPolicy
{
    /**
     * Determine if the user can view any pengajuan.
     */
    public function viewAny(User $user): bool
    {
        // All logged-in users can view pengajuan list (with their own filters)
        return in_array($user->role, ['customer', 'admin_pengelola', 'admin_rtpu', 'pimpinan_rtpu', 'super_admin'], true);
    }

    /**
     * Determine if the user can view the pengajuan.
     */
    public function view(User $user, Pengajuan $pengajuan): bool
    {
        // Customer: only own pengajuan
        if ($user->role === 'customer') {
            return $pengajuan->buyer_id === $user->id;
        }

        // Admin Pengelola: only pengajuan for products they own
        if ($user->role === 'admin_pengelola') {
            return $pengajuan->product?->owner_id === $user->id 
                && $user->canDo('pengajuan', 'Lihat');
        }

        // Admin RTPU, Pimpinan: view all pengajuan
        if (in_array($user->role, ['admin_rtpu', 'pimpinan_rtpu'], true)) {
            return $user->canDo('pengajuan', 'Lihat');
        }

        return false;
    }

    /**
     * Determine if the user can create pengajuan.
     */
    public function create(User $user): bool
    {
        // Only customer can create pengajuan
        return $user->role === 'customer';
    }

    /**
     * Determine if the user can update the pengajuan.
     * Customer can only update if status is 'Diajukan'.
     */
    public function update(User $user, Pengajuan $pengajuan): bool
    {
        // Customer: only own pengajuan AND status is 'Diajukan'
        if ($user->role === 'customer') {
            return $pengajuan->buyer_id === $user->id 
                && $pengajuan->status === 'Diajukan';
        }

        // Admin RTPU can update for verification/approval
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('pengajuan', 'Ubah');
        }

        // Admin Pengelola can update for fulfillment (status, resi, etc)
        if ($user->role === 'admin_pengelola') {
            return $pengajuan->product?->owner_id === $user->id 
                && $user->canDo('pengajuan', 'Ubah');
        }

        return false;
    }

    /**
     * Determine if the user can delete (cancel) the pengajuan.
     * Customer can only cancel if status is 'Diajukan'.
     */
    public function delete(User $user, Pengajuan $pengajuan): bool
    {
        // Customer: only own pengajuan AND status is 'Diajukan'
        if ($user->role === 'customer') {
            return $pengajuan->buyer_id === $user->id 
                && $pengajuan->status === 'Diajukan';
        }

        // Admin RTPU can cancel pengajuan
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('pengajuan', 'Hapus');
        }

        return false;
    }

    /**
     * Determine if the user can verify the pengajuan (Admin RTPU).
     */
    public function verify(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'admin_rtpu' 
            && $user->canDo('verifikasi', 'Verifikasi')
            && $pengajuan->status === 'Diajukan';
    }

    /**
     * Customer menandai pesanan kurir miliknya sudah diterima (Dikirim -> Selesai).
     */
    public function confirmReceipt(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'customer'
            && $pengajuan->buyer_id === $user->id
            && $pengajuan->status === 'Dikirim'
            && $pengajuan->isShipment();
    }

    /**
     * Jasa: Customer pemesan mengonfirmasi, meminta revisi, atau menilai hasil pengerjaan.
     * Izin fitur dijaga middleware route; di sini hanya kepemilikan + status.
     */
    public function confirmJasa(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'customer'
            && $pengajuan->buyer_id === $user->id
            && $pengajuan->isJasaWork()
            && $pengajuan->status === 'Hasil Diunggah';
    }

    public function requestRevision(User $user, Pengajuan $pengajuan): bool
    {
        return $this->confirmJasa($user, $pengajuan) && $pengajuan->canRequestRevision();
    }

    public function rateJasa(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'customer'
            && $pengajuan->buyer_id === $user->id
            && $pengajuan->isJasaWork()
            && $pengajuan->status === 'Selesai'
            && $pengajuan->rating === null;
    }

    /**
     * Unduh berkas hasil jasa: Customer pemesan, Admin Pengelola pemilik layanan, Admin RTPU, Super Admin.
     */
    public function downloadHasil(User $user, Pengajuan $pengajuan): bool
    {
        if (! $pengajuan->isJasaWork()) {
            return false;
        }

        return $pengajuan->buyer_id === $user->id
            || ($user->role === 'admin_pengelola' && $pengajuan->product?->owner_id === $user->id)
            || in_array($user->role, ['admin_rtpu', 'super_admin'], true);
    }

    /**
     * Determine if the user can fulfill the pengajuan (Admin Pengelola).
     * Only for products they own and status is 'Lunas'.
     */
    public function fulfill(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'admin_pengelola'
            && $pengajuan->product?->owner_id === $user->id
            && in_array($pengajuan->status, ['Lunas', 'Diproses', 'Dikirim', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah'], true)
            && $user->canDo('pengajuan', 'Ubah');
    }

    /**
     * Determine if the user can view payment proof.
     * Customer (owner) and Admin RTPU can view.
     */
    public function viewPaymentProof(User $user, Pengajuan $pengajuan): bool
    {
        if ($user->role === 'customer') {
            return $pengajuan->buyer_id === $user->id;
        }

        if ($user->role === 'admin_rtpu') {
            return $user->canDo('pembayaran', 'Lihat');
        }

        return false;
    }

    /**
     * Determine if the user can upload payment proof.
     * Only customer who owns the pengajuan.
     */
    public function uploadPaymentProof(User $user, Pengajuan $pengajuan): bool
    {
        return $user->role === 'customer' 
            && $pengajuan->buyer_id === $user->id
            && in_array($pengajuan->status, ['Menunggu Pembayaran', 'Ditolak Pembayaran'], true);
    }
}
