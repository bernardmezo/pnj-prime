<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->unsignedInteger('rental_billing_duration')->nullable();
            $table->string('rental_billing_unit', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn(['rental_billing_duration', 'rental_billing_unit']);
        });
    }
};
