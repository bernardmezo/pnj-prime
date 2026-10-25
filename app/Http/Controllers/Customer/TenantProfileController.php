<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TenantProfileController extends Controller
{
    public function show(): Response
    {
        $user = Auth::user();
        $tenant = TenantProfile::where('user_id', $user->id)->first();

        return Inertia::render('Customer/TenantProfile', [
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'company_name' => $tenant->company_name,
                'verification_status' => $tenant->verification_status,
                'rejection_note' => $tenant->rejection_note,
                'has_ktp' => ! empty($tenant->ktp_path),
                'verified_at' => optional($tenant->verified_at)->format('Y-m-d H:i'),
            ] : null,
            'pdp_consented' => ! empty($user->pdp_consent_at),
            'pdp_consent_at' => optional($user->pdp_consent_at)->format('Y-m-d H:i'),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'company_name' => 'required|string|max:200',
            'nik' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:30',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $tenant = TenantProfile::firstOrNew(['user_id' => $user->id]);
        $tenant->company_name = $data['company_name'];

        if (! empty($data['nik'])) {
            $tenant->nik = $data['nik'];
        }
        if (! empty($data['npwp'])) {
            $tenant->npwp = $data['npwp'];
        }

        if ($request->hasFile('ktp')) {
            $path = $request->file('ktp')->store('tenant-ktp', 'local');
            $tenant->ktp_path = $path;
        }

        // Re-submitting resets status to pending if it was invalid
        if ($tenant->verification_status === 'invalid') {
            $tenant->verification_status = 'pending';
            $tenant->rejection_note = null;
        }

        $tenant->save();

        return back()->with('success', 'Profil tenant berhasil disimpan dan sedang diverifikasi.');
    }

    public function consentPdp(Request $request)
    {
        $request->validate([
            'agreed' => 'required|accepted',
            'version' => 'nullable|string|max:20',
        ]);

        $user = Auth::user();
        $user->update([
            'pdp_consent_at' => now(),
            'pdp_consent_version' => $request->input('version', 'v1.0'),
        ]);

        return back()->with('success', 'Persetujuan kebijakan privasi PDP berhasil dicatat.');
    }
}
