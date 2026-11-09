<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengelola_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('unit_name', 150);
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->string('pic_name', 150);
            $table->string('pic_nip', 50)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('sk_document_path', 255)->nullable();
            $table->string('status', 30)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE pengelola_applications ADD CONSTRAINT pengelola_applications_status_check CHECK (status IN ('pending', 'approved', 'rejected'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengelola_applications');
    }
};
