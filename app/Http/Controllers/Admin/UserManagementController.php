<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('UserManagement/Index', [
            'users' => User::query()
                ->select(['id', 'name', 'email', 'role', 'account_origin', 'created_at'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('UserManagement/Create');
    }

    public function store(Request $request)
    {
        return redirect()->route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('UserManagement/Edit', [
            'user' => $user->only(['id', 'name', 'email', 'role', 'phone', 'institution']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user)
    {
        return redirect()->route('admin.users.index');
    }
}
