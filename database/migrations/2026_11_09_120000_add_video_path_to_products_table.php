<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'video_url')) {
                $table->string('video_url')->nullable()->after('thumbnail');
            }
            if (!Schema::hasColumn('products', 'video_path')) {
                $table->string('video_path')->nullable()->after('video_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['video_url', 'video_path']);
        });
    }
};
