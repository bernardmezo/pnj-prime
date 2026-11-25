<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

/**
 * Authorization policy for Product access control.
 * 
 * Rules:
 * - Super Admin: full access (bypassed in AuthServiceProvider)
 * - Admin RTPU: full access (view all products for verification)
 * - Pimpinan RTPU: view all products for approval
 * - Admin Pengelola: only own products (owner_id === user.id)
 * - Customer: view approved products only (handled by catalog controller, not policy)
 */
class ProductPolicy
{
    /**
     * Determine if the user can view any products.
     * Admin Pengelola only sees own products (filtered in controller).
     */
    public function viewAny(User $user): bool
    {
        // All roles can view products list (with their own filters)
        return in_array($user->role, ['admin_pengelola', 'admin_jurusan', 'admin_rtpu', 'pimpinan_rtpu', 'super_admin'], true);
    }

    /**
     * Determine if the user can view the product.
     * Admin Pengelola only if owner, others if has permission.
     */
    public function view(User $user, Product $product): bool
    {
        // Admin Pengelola: only own products
        if (in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true)) {
            return $product->owner_id === $user->id;
        }

        // Admin RTPU, Pimpinan: view all products
        if (in_array($user->role, ['admin_rtpu', 'pimpinan_rtpu'], true)) {
            return $user->canDo('katalog', 'Lihat');
        }

        return false;
    }

    /**
     * Determine if the user can create products.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true) && $user->canDo('katalog', 'Tambah');
    }

    /**
     * Determine if the user can update the product.
     * Admin Pengelola only if owner and product is editable or approved.
     */
    public function update(User $user, Product $product): bool
    {
        if (in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true)) {
            return $product->owner_id === $user->id 
                && ($product->isEditableByPengelola() || $product->curation_status === 'approved') 
                && $user->canDo('katalog', 'Ubah');
        }

        // Admin RTPU can update for verification purposes (set price, status)
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('katalog', 'Ubah');
        }

        return false;
    }

    /**
     * Determine if the user can delete the product.
     * Admin Pengelola only if owner AND product is draft/rejected.
     */
    public function delete(User $user, Product $product): bool
    {
        if (in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true)) {
            return $product->owner_id === $user->id 
                && in_array($product->curation_status, ['draft', 'rejected'], true)
                && $user->canDo('katalog', 'Hapus');
        }

        // Admin RTPU can soft delete (archive) products
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('katalog', 'Hapus');
        }

        return false;
    }

    /**
     * Determine if the user can restore the product.
     */
    public function restore(User $user, Product $product): bool
    {
        // Only admin_rtpu and super_admin can restore soft-deleted products
        return in_array($user->role, ['admin_rtpu', 'super_admin'], true);
    }

    /**
     * Determine if the user can permanently delete the product.
     */
    public function forceDelete(User $user, Product $product): bool
    {
        // Only super_admin can force delete
        return $user->role === 'super_admin';
    }

    /**
     * Determine if the user can submit product for verification.
     * Admin Pengelola only if owner AND product is draft.
     */
    public function submit(User $user, Product $product): bool
    {
        return in_array($user->role, ['admin_pengelola', 'admin_jurusan'], true)
            && $product->owner_id === $user->id
            && $product->isDraft();
    }

    /**
     * Determine if the user can verify the product (Admin RTPU).
     */
    public function verify(User $user, Product $product): bool
    {
        return $user->role === 'admin_rtpu' 
            && $user->canDo('verifikasi', 'Verifikasi')
            && in_array($product->curation_status, ['pending', 'counter_offer'], true);
    }

    /**
     * Determine if the user can approve the product (Pimpinan RTPU).
     */
    public function approve(User $user, Product $product): bool
    {
        return $user->role === 'pimpinan_rtpu' 
            && $user->canDo('verifikasi', 'Verifikasi')
            && $product->curation_status === 'verified';
    }
}
