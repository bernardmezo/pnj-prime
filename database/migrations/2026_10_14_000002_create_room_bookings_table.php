<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('pengajuan_id')->constrained('pengajuan')->cascadeOnDelete();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->string('status', 30)->default('ACTIVE');
            $table->timestampTz('released_at')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status', 'starts_at', 'ends_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');
            DB::statement("
                ALTER TABLE room_bookings ADD CONSTRAINT room_bookings_no_overlap
                EXCLUDE USING gist (
                    product_id WITH =,
                    tstzrange(starts_at, ends_at) WITH &&
                ) WHERE (released_at IS NULL AND status = 'ACTIVE')
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE room_bookings DROP CONSTRAINT IF EXISTS room_bookings_no_overlap');
        }

        Schema::dropIfExists('room_bookings');
    }
};
