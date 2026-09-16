<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\Request;

interface AuthServiceInterface
{
    /**
     * @param array{email: string, password: string} $credentials
     */
    public function attempt(array $credentials, bool $remember = false): bool;

    public function currentUser(): ?User;

    public function logout(Request $request): void;

    public function driverName(): string;
}