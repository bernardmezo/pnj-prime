<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('company_name', 200)->nullable();
            $table->text('nik')->nullable(); // encrypted
            $table->text('npwp')->nullable(); // encrypted
            $table->string('ktp_path', 500)->nullable();
            $table->enum('verification_status', ['pending', 'valid', 'invalid'])->default('pending');
            $table->text('rejection_note')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['verification_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_profiles');
    }
};
