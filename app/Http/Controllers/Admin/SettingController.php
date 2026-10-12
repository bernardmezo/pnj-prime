<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(private SettingService $settings) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => Setting::all()->keyBy('key'),
            'audits' => DB::table('settings_audit')
                ->leftJoin('users', 'users.id', '=', 'settings_audit.changed_by')
                ->orderByDesc('settings_audit.id')
                ->limit(20)
                ->get([
                    'settings_audit.id', 'settings_audit.key',
                    'settings_audit.old_value', 'settings_audit.new_value',
                    'settings_audit.changed_at', 'users.name as changed_by_name',
                ]),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable|string|max:1000',
        ]);

        foreach ($request->settings as $key => $value) {
            $this->settings->set($key, $value ?? '');
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
