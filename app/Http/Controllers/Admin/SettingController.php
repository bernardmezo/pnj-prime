<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(private SettingService $settings)
    {
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => Setting::all()->keyBy('key'),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings'   => 'required|array',
            'settings.*' => 'nullable|string|max:1000',
        ]);

        foreach ($request->settings as $key => $value) {
            $this->settings->set($key, $value ?? '');
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
