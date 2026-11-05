<?php

namespace App\Http\Controllers;

use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\ProdukUnggulan;
use App\Models\TenantProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * Serve uploaded files only to authorized users:
     * - pengajuan documents: owner or Admin RTPU
     * - produk-unggulan documents: owner, Pimpinan RTPU, or Direktur
     * - payment proofs: buyer or Admin RTPU
     */
    public function show(string $kind, int $id, int $index)
    {
        $user = Auth::user();
        $role = $user->role;

        if ($kind === 'pengajuan-dokumen') {
            $item = Pengajuan::findOrFail($id);
            abort_unless(
                $item->buyer_id === $user->id || $role === 'admin_rtpu' || $role === 'super_admin',
                403
            );
            $doc = ($item->dokumen ?? [])[$index] ?? null;
        } elseif ($kind === 'produk-dokumen') {
            $item = ProdukUnggulan::findOrFail($id);
            // Owner sees own documents; Pimpinan verifies, Direktur monitors.
            // (Admin P3M sees only their own items via the owner check.)
            abort_unless(
                $item->owner_id === $user->id || in_array($role, ['pimpinan_rtpu', 'direktur', 'super_admin'], true),
                403
            );
            $doc = ($item->documents ?? [])[$index] ?? null;
        } elseif ($kind === 'tenant-ktp') {
            $tp = TenantProfile::findOrFail($id);
            abort_unless(
                $tp->user_id === $user->id || in_array($role, ['admin_rtpu', 'pimpinan_rtpu', 'super_admin'], true),
                403
            );
            abort_unless($tp->ktp_path && Storage::disk('local')->exists($tp->ktp_path), 404);

            return Storage::disk('local')->download($tp->ktp_path, 'KTP-Tenant-'.$tp->id.'.'.pathinfo($tp->ktp_path, PATHINFO_EXTENSION));
        } elseif ($kind === 'bukti') {
            $proof = PaymentProof::with('order')->findOrFail($id);
            abort_unless(
                $proof->order->buyer_id === $user->id || $role === 'admin_rtpu' || $role === 'super_admin',
                403
            );
            $disk = Storage::disk('local')->exists($proof->file_path) ? 'local' : 'public';
            abort_unless(Storage::disk($disk)->exists($proof->file_path), 404);

            return Storage::disk($disk)->download($proof->file_path, $proof->file_name);
        } else {
            abort(404);
        }

        abort_unless($doc && (! empty($doc['path']) || ! empty($doc['url'])), 404);

        // Support both new 'path' key (private disk) and legacy 'url' fallback.
        if (! empty($doc['path'])) {
            $path = $doc['path'];
            $disk = 'local';
        } else {
            $path = ltrim(preg_replace('#^/?storage/#', '', $doc['url']), '/');
            $disk = Storage::disk('local')->exists($path) ? 'local' : 'public';
        }
        abort_unless($path !== '' && Storage::disk($disk)->exists($path), 404);

        return Storage::disk($disk)->download($path, $doc['name'] ?? basename($path));
    }
}
