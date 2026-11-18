<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/**
 * Authorization policy for Order access control.
 * 
 * Rules:
 * - Super Admin: full access
 * - Admin RTPU: view all orders
 * - Admin Pengelola: only orders for products they own
 * - Customer: only their own orders
 */
class OrderPolicy
{
    /**
     * Determine if the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['customer', 'admin_pengelola', 'admin_rtpu', 'super_admin'], true);
    }

    /**
     * Determine if the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        // Customer: only own orders
        if ($user->role === 'customer') {
            return $order->buyer_id === $user->id;
        }

        // Admin Pengelola: only orders containing products they own
        if ($user->role === 'admin_pengelola') {
            // Check if any order item belongs to this admin's product
            return $order->items()->whereHas('product', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->exists() && $user->canDo('pengajuan', 'Lihat');
        }

        // Admin RTPU: view all orders
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('pengajuan', 'Lihat');
        }

        return false;
    }

    /**
     * Determine if the user can create orders.
     * (Note: Orders are created automatically from pengajuan, not manually)
     */
    public function create(User $user): bool
    {
        return $user->role === 'customer';
    }

    /**
     * Determine if the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        // Admin RTPU can update order status
        if ($user->role === 'admin_rtpu') {
            return $user->canDo('pengajuan', 'Ubah');
        }

        // Admin Pengelola can update fulfillment status for their products
        if ($user->role === 'admin_pengelola') {
            return $order->items()->whereHas('product', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->exists() && $user->canDo('pengajuan', 'Ubah');
        }

        return false;
    }

    /**
     * Determine if the user can delete the order.
     */
    public function delete(User $user, Order $order): bool
    {
        // Only admin RTPU can cancel/delete orders
        return $user->role === 'admin_rtpu' && $user->canDo('pengajuan', 'Hapus');
    }
}
