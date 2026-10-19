<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Prasyarat: tabel users (0001_01_01_000000_create_users_table)
 *
 * Tambah: sessions kustom, tabel RBAC, feature flags.
 * users.role tetap enum lama (keputusan stakeholder) — tabel roles
 * disiapkan agar migrasi pivot tidak perlu restrukturisasi nanti.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- extension untuk anti-double-booking + UUID (file 04) ---
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        // --- user_sessions: refresh token & revokasi (FD-4) ---
        if (! Schema::hasTable('user_sessions')) {
            Schema::create('user_sessions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('refresh_token_hash', 255);
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->timestampTz('expires_at');
                $table->timestampTz('created_at')->useCurrent();

                $table->index('user_id');
                $table->index('expires_at');
                $table->index('refresh_token_hash');
            });
        }

        // --- roles: role dinamis (FD-7) ---
        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 50);
                $table->string('name', 100);
                $table->text('description')->nullable();
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();

                $table->index('code', 'uq_roles_code');
            });
        }

        // --- permissions: hak akses granular (FD-7, FD-9) ---
        if (! Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 100);        // '<module>:<action>'
                $table->string('name', 150);
                $table->string('module', 50);
                $table->string('action', 50);
                $table->text('description')->nullable();

                $table->unique('code');
                $table->index('module');
            });
        }

        // --- features: toggle fitur tanpa deploy (FD-8) ---
        if (! Schema::hasTable('features')) {
            Schema::create('features', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 50);
                $table->string('name', 100);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestampTz('updated_at')->useCurrent();

                $table->unique('code');
            });
        }

        // --- user_roles: pivot (dibuat sekarang, diisi nanti) ---
        if (! Schema::hasTable('user_roles')) {
            Schema::create('user_roles', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('created_at')->useCurrent();

                $table->unique(['user_id', 'role_id']);
                $table->index('role_id');
            });
        }

        // --- role_permissions: pivot ---
        if (! Schema::hasTable('role_permissions')) {
            Schema::create('role_permissions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignUuid('permission_id')->constrained('permissions')->cascadeOnDelete();

                $table->unique(['role_id', 'permission_id']);
            });
        }

        // --- role_features: pivot ---
        if (! Schema::hasTable('role_features')) {
            Schema::create('role_features', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignUuid('feature_id')->constrained('features')->cascadeOnDelete();

                $table->unique(['role_id', 'feature_id']);
            });
        }

        // --- user_auth_providers: kesiapan SSO PNJ (FD-5, NFD-6) ---
        if (! Schema::hasTable('user_auth_providers')) {
            Schema::create('user_auth_providers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('provider_name', 50);
                $table->string('provider_user_id', 255);
                $table->jsonb('provider_data')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->unique(['provider_name', 'provider_user_id']);
                $table->index('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_auth_providers');
        Schema::dropIfExists('role_features');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('features');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('user_sessions');
    }
};