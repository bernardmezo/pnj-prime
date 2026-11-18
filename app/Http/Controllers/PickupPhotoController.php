<?php

namespace App\Http\Controllers;

use App\Models\Pengajuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PickupPhotoController extends Controller
{
    public function __invoke(Request $request, Pengajuan $pengajuan)
    {
        $u = $request->user();
        abort_unless(($u->role === 'customer' && $pengajuan->buyer_id === $u->id)
        || ($u->role === 'admin_pengelola' && $pengajuan->product?->owner_id === $u->id && $u->canDo('katalog', 'Lihat'))
        || (in_array($u->role, ['admin_rtpu', 'super_admin'], true) && $u->canDo('pengajuan', 'Lihat')), 404);
        abort_unless($pengajuan->handover_photo_path && Storage::disk('local')->exists($pengajuan->handover_photo_path), 404);

        return Storage::disk('local')->response($pengajuan->handover_photo_path, null, ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }
}
