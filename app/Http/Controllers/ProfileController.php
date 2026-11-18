<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        abort_unless($request->user()->canDo('profil', 'Ubah'), 403);

        $request->user()->fill($request->attributesToSave());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Delete user account — DISABLED per Sprint 4.
     * Route removed from routes/web.php. Kept here for reference only.
     */
    // public function destroy(Request $request): RedirectResponse
    // {
    //     $request->validate(['password' => ['required', 'current_password']]);
    //     $user = $request->user();
    //     Auth::logout();
    //     $user->delete();
    //     $request->session()->invalidate();
    //     $request->session()->regenerateToken();
    //     return Redirect::to('/');
    // }
}
