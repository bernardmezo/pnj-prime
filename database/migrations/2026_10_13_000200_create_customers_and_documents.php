<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer B2B + dokumen privat + konfigurasi sistem.
 * BR-11/14: file binary TIDAK disimpan di DB, hanya metadata.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- documents: metadata seluruh file (FD-3, NFD-4) ---
        if (! Schema::hasTable('documents')) {
            Schema::create('documents', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('original_name', 255);
                $table->string('stored_name', 255)->unique();
                $table->string('mime_type', 100);
                $table->bigInteger('file_size');
                $table->string('storage_key', 500);
                $table->string('storage_disk', 20)->default('local');
                $table->string('document_type', 50);
                $table->foreignUuid('owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('entity_type', 50)->nullable();   // polymorphic ref
                $table->uuid('entity_id')->nullable();
                $table->boolean('is_private')->default(true);
                $table->foreignUuid('uploaded_by')->constrained('users');
                $table->timestampTz('created_at')->useCurrent();
                $table->softDeletesTz();

                $table->index(['entity_type', 'entity_id']);
                $table->index('owner_id');
                $table->index(['is_private', 'owner_id']);
            });
        }

        // --- customers: profil B2B / sewa ---
        if (! Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('company_name', 200)->nullable();
                $table->string('npwp_number', 30)->nullable();    // PII: encrypt di app layer
                $table->uuid('ktp_document_id')->nullable();
                $table->uuid('npwp_document_id')->nullable();
                $table->string('verification_status', 20)->default('PENDING');
                $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('verified_at')->nullable();
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();

                $table->foreign('ktp_document_id')->references('id')->on('documents')->nullOnDelete();
                $table->foreign('npwp_document_id')->references('id')->on('documents')->nullOnDelete();
            });
        }

        // --- system_configs: URL RTPU, LMS, dsb (FD-15) ---
        if (! Schema::hasTable('system_configs')) {
            Schema::create('system_configs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->text('description')->nullable();
                $table->timestampTz('updated_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_configs');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('documents');
    }
};