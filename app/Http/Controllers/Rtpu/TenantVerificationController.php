<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TenantVerificationController extends Controller
{
    public function index(): Response
    {
        $tenants = TenantProfile::with(['user:id,name,email,institution,phone', 'verifier:id,name'])
            ->latest()
            ->get()
            ->map(fn ($tp) => [
                'id' => $tp->id,
                'user_id' => $tp->user_id,
                'user_name' => $tp->user?->name,
                'user_email' => $tp->user?->email,
                'company_name' => $tp->company_name,
                'verification_status' => $tp->verification_status,
                'rejection_note' => $tp->rejection_note,
                'verified_by' => $tp->verifier?->name,
                'verified_at' => optional($tp->verified_at)->format('Y-m-d H:i'),
                'created_at' => optional($tp->created_at)->format('Y-m-d H:i'),
                'ktp_url' => $tp->ktp_path ? route('berkas.show', ['kind' => 'tenant-ktp', 'id' => $tp->id, 'index' => 0]) : null,
            ]);

        return Inertia::render('Rtpu/Tenant/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function verify(Request $request, TenantProfile $tenantProfile)
    {
        $data = $request->validate([
            'status' => 'required|in:valid,invalid',
            'rejection_note' => 'required_if:status,invalid|nullable|string|max:1000',
        ]);

        $old = $tenantProfile->toArray();

        $tenantProfile->update([
            'verification_status' => $data['status'],
            'rejection_note' => $data['status'] === 'invalid' ? $data['rejection_note'] : null,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        AuditLogger::log(
            'verify_tenant_profile',
            $tenantProfile,
            $tenantProfile->id,
            $old,
            $tenantProfile->fresh()->toArray()
        );

        $msg = $data['status'] === 'valid'
            ? 'Profil tenant berhasil divalidasi.'
            : 'Profil tenant ditolak dengan catatan.';

        return back()->with('success', $msg);
    }
}
