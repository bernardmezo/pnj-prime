<?php

namespace App\Http\Controllers\Pengelola;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = Auth::id();

        $stats = [
            'total' => Product::where('owner_id', $userId)->count(),
            'draft' => Product::where('owner_id', $userId)->where('curation_status', 'draft')->count(),
            'pending' => Product::where('owner_id', $userId)->where('curation_status', 'pending')->count(),
            'verified' => Product::where('owner_id', $userId)->where('curation_status', 'verified')->count(),
            'approved' => Product::where('owner_id', $userId)->where('curation_status', 'approved')->count(),
            'rejected' => Product::where('owner_id', $userId)->where('curation_status', 'rejected')->count(),
        ];

        $recentProducts = Product::with('category')
            ->where('owner_id', $userId)
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Pengelola/Dashboard', [
            'stats' => $stats,
            'recentProducts' => $recentProducts,
            'user' => Auth::user(),
        ]);
    }
}
