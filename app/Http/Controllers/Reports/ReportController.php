<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        if ($user->isAdminRtpu()) {
            return $this->adminReport();
        }

        return $this->ownerReport($user->id);
    }

    private function adminReport(): Response
    {
        return Inertia::render('Reports/AdminReport', [
            'summary' => [],
        ]);
    }

    private function ownerReport(int $ownerId): Response
    {
        return Inertia::render('Reports/OwnerReport', [
            'summary' => [],
        ]);
    }
}
