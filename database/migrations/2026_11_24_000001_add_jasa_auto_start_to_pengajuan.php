<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->boolean('jasa_auto_start')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn('jasa_auto_start');
        });
    }
};
