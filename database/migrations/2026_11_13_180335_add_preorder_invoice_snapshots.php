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
        Schema::table('invoices', function (Blueprint $table) {
            $table->jsonb('bank_snapshot')->nullable();
            $table->jsonb('request_snapshot')->nullable();
            $table->unsignedBigInteger('shipping_amount')->default(0);
            $table->unsignedInteger('unique_amount')->default(0);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE invoices DROP CONSTRAINT invoices_status_check');
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'issued', 'paid', 'void', 'cancelled'))");
        }
        DB::statement("CREATE UNIQUE INDEX invoices_active_preorder_total_unique ON invoices (total) WHERE bank_snapshot IS NOT NULL AND status IN ('draft', 'issued')");
        DB::statement("CREATE UNIQUE INDEX invoices_active_preorder_request_unique ON invoices (pengajuan_id) WHERE bank_snapshot IS NOT NULL AND status IN ('draft', 'issued')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS invoices_active_preorder_total_unique');
        DB::statement('DROP INDEX IF EXISTS invoices_active_preorder_request_unique');
        Schema::table('invoices', fn (Blueprint $table) => $table->dropColumn(['bank_snapshot', 'request_snapshot', 'shipping_amount', 'unique_amount']));
    }
};
