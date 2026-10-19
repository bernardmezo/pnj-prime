<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Produk unggulan (P3M kurasi RTPU approval Pimpinan) + notifikasi + audit log.
 * BR-01: hanya DISETUJUI tampil di katalog.
 * BR-03: penolakan wajib catatan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- featured_products ---
        if (! Schema::hasTable('featured_products')) {
            Schema::create('featured_products', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('submitted_by')->constrained('users')->restrictOnDelete();
                $table->string('name', 200);
                $table->string('product_type', 50)->nullable();
                $table->text('description')->nullable();
                $table->text('specifications')->nullable();
                $table->decimal('base_cost', 15, 2)->default(0);   // biaya dasar P3M
                $table->decimal('platform_margin', 15, 2)->nullable(); // diisi saat kurasi (A-01)
                $table->decimal('final_price', 15, 2)->nullable();
                $table->integer('stock')->default(0);
                $table->string('youtube_url', 500)->nullable();
                $table->string('status', 25)->default('MENUNGGU_VERIFIKASI');
                $table->boolean('is_taxable')->default(false);
                $table->foreignUuid('tax_rate_id')->nullable()->constrained('tax_rates')->restrictOnDelete();
                $table->decimal('tax_percentage_snapshot', 5, 2)->nullable();
                $table->text('curation_notes')->nullable();
                $table->foreignUuid('curated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('curated_at')->nullable();
                $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('approved_at')->nullable();
                $table->text('rejection_note')->nullable();
                $table->integer('version')->default(1);
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();

                $table->index(['status', 'created_at']);
                $table->index(['submitted_by', 'status']);
            });
        }

        // --- featured_product_histories ---
        if (! Schema::hasTable('featured_product_histories')) {
            Schema::create('featured_product_histories', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('featured_product_id')->constrained('featured_products')->cascadeOnDelete();
                $table->string('previous_status', 25)->nullable();
                $table->string('new_status', 25);
                $table->foreignUuid('action_by')->constrained('users')->restrictOnDelete();
                $table->text('notes')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['featured_product_id', 'created_at']);
            });
        }

        // --- notifications: in-app (Must) & email (Should) ---
        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('title', 200);
                $table->text('message');
                $table->string('type', 50);                  // STATUS_CHANGE|PAYMENT|APPROVAL
                $table->string('reference_entity', 50)->nullable();
                $table->uuid('reference_id')->nullable();
                $table->string('channel', 20)->default('IN_APP');
                $table->boolean('is_read')->default(false);
                $table->timestampTz('read_at')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['user_id', 'is_read', 'created_at']);
                $table->index(['reference_entity', 'reference_id']);
            });
        }

        // --- audit_logs: append-only (NFD-7) ---
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action', 100);
                $table->string('entity', 100);
                $table->uuid('entity_id')->nullable();
                $table->jsonb('before_data')->nullable();
                $table->jsonb('after_data')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->string('correlation_id', 100)->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['entity', 'entity_id', 'created_at']);
                $table->index(['user_id', 'created_at']);
                $table->index('created_at');
            });
        }

        // --- CHECK constraints ---
        DB::statement("ALTER TABLE featured_products ADD CONSTRAINT ck_fp_status CHECK (status IN (
            'MENUNGGU_VERIFIKASI','DIPERIKSA_RTPU','DISETUJUI','DITOLAK','DIBATALKAN'))");
        DB::statement("ALTER TABLE featured_products ADD CONSTRAINT ck_fp_amounts CHECK (
            base_cost >= 0
            AND (platform_margin IS NULL OR platform_margin >= 0)
            AND (final_price IS NULL OR final_price >= 0))");
        DB::statement("ALTER TABLE featured_products ADD CONSTRAINT ck_fp_stock CHECK (stock >= 0)");
        DB::statement("ALTER TABLE featured_products ADD CONSTRAINT ck_fp_reject_note
            CHECK (status <> 'DITOLAK' OR rejection_note IS NOT NULL)");
        // BR-01/BR-11: DISETUJUI wajib sudah punya harga final
        DB::statement("ALTER TABLE featured_products ADD CONSTRAINT ck_fp_approved_price
            CHECK (status <> 'DISETUJUI' OR final_price IS NOT NULL)");

        DB::statement("ALTER TABLE notifications ADD CONSTRAINT ck_notif_channel
            CHECK (channel IN ('IN_APP','EMAIL'))");

        // --- BR-01: index parsial khusus katalog publik ---
        DB::unprepared(<<<'SQL'
            CREATE INDEX idx_fp_public ON featured_products (created_at DESC)
            WHERE status = 'DISETUJUI' AND deleted_at IS NULL;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP INDEX IF EXISTS idx_fp_public');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('featured_product_histories');
        Schema::dropIfExists('featured_products');
    }
};