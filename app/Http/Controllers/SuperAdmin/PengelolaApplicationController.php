<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PengelolaApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PengelolaApplicationController extends Controller
{
    /**
     * Display a listing of unit pengelola applications.
     */
    public function index(): Response
    {
        $applications = PengelolaApplication::with(['user:id,name,email,institution,unit_name', 'verifier:id,name'])
            ->latest()
            ->get()
            ->map(fn (PengelolaApplication $app) => [
                'id' => $app->id,
                'user_id' => $app->user_id,
                'applicant_name' => $app->user?->name,
                'applicant_email' => $app->user?->email,
                'unit_name' => $app->unit_name,
                'pic_name' => $app->pic_name,
                'pic_phone' => $app->pic_phone,
                'sk_document_path' => $app->sk_document_path,
                'status' => $app->status,
                'notes' => $app->notes,
                'created_at' => optional($app->created_at)->format('Y-m-d H:i'),
                'verified_at' => optional($app->verified_at)->format('Y-m-d H:i'),
                'verifier_name' => $app->verifier?->name,
            ]);

        return Inertia::render('SuperAdmin/PengelolaApplications/Index', [
            'applications' => $applications,
        ]);
    }

    /**
     * Show detail of one application.
     */
    public function show(PengelolaApplication $application): Response
    {
        $application->load(['user', 'verifier']);

        return Inertia::render('SuperAdmin/PengelolaApplications/Show', [
            'application' => $application,
        ]);
    }

    /**
     * Approve the application and elevate the user to admin_pengelola.
     */
    public function approve(Request $request, PengelolaApplication $application): RedirectResponse
    {
        if ($application->status !== 'pending') {
            abort(422, 'Hanya permohonan berstatus pending yang dapat disetujui.');
        }

        DB::transaction(function () use ($application) {
            $application->update([
                'status' => 'approved',
                'verified_by' => Auth::id(),
                'verified_at' => now(),
            ]);

            $user = $application->user;
            if ($user) {
                $user->update([
                    'role' => 'admin_pengelola',
                    'account_status' => 'active',
                    'unit_name' => $application->unit_name,
                    'institution' => $application->unit_name,
                ]);
            }
        });

        return back()->with('success', "Permohonan pengelola unit {$application->unit_name} disetujui.");
    }

    /**
     * Reject the application with notes.
     */
    public function reject(Request $request, PengelolaApplication $application): RedirectResponse
    {
        $data = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        if ($application->status !== 'pending') {
            abort(422, 'Hanya permohonan berstatus pending yang dapat ditolak.');
        }

        $application->update([
            'status' => 'rejected',
            'notes' => $data['notes'],
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        return back()->with('success', "Permohonan pengelola unit {$application->unit_name} ditolak.");
    }
}
