<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Master katalog: kategori, pajak, rekening, layanan/ruangan/produk, gambar.
 * BR-09: tarif pajak TIDAK hardcode. BR-08: DECIMAL, bukan integer.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- service_categories ---
        if (! Schema::hasTable('service_categories')) {
            Schema::create('service_categories', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 100);
                $table->string('transaction_type', 20);       // B2C_SALE | B2B_RENTAL
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();

                $table->index(['is_active', 'sort_order']);
            });
        }

        // --- tax_rates: master pajak dinamis (BR-09, BR-10) ---
        if (! Schema::hasTable('tax_rates')) {
            Schema::create('tax_rates', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 100);
                $table->decimal('percentage', 5, 2)->default(0);
                $table->decimal('threshold_amount', 15, 2)->nullable();
                $table->boolean('is_active')->default(true);
                $table->date('effective_from')->nullable();
                $table->date('effective_until')->nullable();
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();

                $table->index(['is_active', 'effective_from', 'effective_until']);
            });
        }

        // --- payment_methods: rekening transfer manual (FD-17) ---
        if (! Schema::hasTable('payment_methods')) {
            Schema::create('payment_methods', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('bank_name', 100);
                $table->string('account_number', 50);
                $table->string('account_holder', 150);
                $table->text('instructions')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();
            });
        }

        // --- services: master jasa/ruangan/produk (FD-16) ---
        if (! Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('category_id')->constrained('service_categories')->restrictOnDelete();
                $table->string('service_type', 20);          // SERVICE | ROOM | PRODUCT
                $table->string('name', 200);
                $table->text('description')->nullable();
                $table->text('specifications')->nullable();
                $table->decimal('base_price', 15, 2)->default(0);
                $table->integer('stock')->nullable();        // hanya PRODUCT
                $table->integer('capacity')->nullable();     // hanya ROOM
                $table->text('facilities')->nullable();
                $table->string('rate_unit', 20)->nullable();
                $table->boolean('is_taxable')->default(false);
                $table->foreignUuid('tax_rate_id')->nullable()->constrained('tax_rates')->restrictOnDelete();
                $table->string('youtube_url', 500)->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('version')->default(1);       // optimistic locking (NFD-8)
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();
                $table->softDeletesTz();

                $table->index(['is_active', 'service_type', 'category_id']);
                $table->index('category_id');
            });
        }

        // --- service_images: poster/gambar (FD-13) ---
        if (! Schema::hasTable('service_images')) {
            Schema::create('service_images', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
                $table->foreignUuid('document_id')->constrained('documents')->restrictOnDelete();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_primary')->default(false);

                $table->index('service_id');
            });
        }

        // --- CHECK constraints: nilai uang >= 0 (BR-08) ---
        DB::statement('ALTER TABLE tax_rates ADD CONSTRAINT ck_tax_pct
            CHECK (percentage >= 0 AND percentage <= 100)');
        DB::statement('ALTER TABLE tax_rates ADD CONSTRAINT ck_tax_threshold
            CHECK (threshold_amount IS NULL OR threshold_amount >= 0)');
        DB::statement('ALTER TABLE tax_rates ADD CONSTRAINT ck_tax_period
            CHECK (effective_until IS NULL OR effective_from IS NULL
                   OR effective_until >= effective_from)');
        DB::statement('ALTER TABLE services ADD CONSTRAINT ck_services_price
            CHECK (base_price >= 0)');
        DB::statement('ALTER TABLE services ADD CONSTRAINT ck_services_stock
            CHECK (stock IS NULL OR stock >= 0)');
        DB::statement('ALTER TABLE services ADD CONSTRAINT ck_services_cap
            CHECK (capacity IS NULL OR capacity > 0)');

        // --- CHECK enum: nilai status tertutup ---
        DB::statement("ALTER TABLE service_categories ADD CONSTRAINT ck_sc_tx_type
            CHECK (transaction_type IN ('B2C_SALE','B2B_RENTAL'))");
        DB::statement("ALTER TABLE services ADD CONSTRAINT ck_services_type
            CHECK (service_type IN ('SERVICE','ROOM','PRODUCT'))");
        DB::statement("ALTER TABLE services ADD CONSTRAINT ck_services_rate
            CHECK (rate_unit IS NULL OR
                   rate_unit IN ('PER_HOUR','PER_DAY','FLAT','PER_UNIT'))");
        DB::statement("ALTER TABLE customers ADD CONSTRAINT ck_customers_verif_status
            CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED'))");
        DB::statement('ALTER TABLE documents ADD CONSTRAINT ck_documents_size
            CHECK (file_size > 0)');
        DB::statement("ALTER TABLE documents ADD CONSTRAINT ck_documents_dtype
            CHECK (document_type IN ('KTP','NPWP','PAYMENT_PROOF','POSTER',
                                     'SUPPORTING_DOC','OTHER'))");
        DB::statement("ALTER TABLE documents ADD CONSTRAINT ck_documents_etype
            CHECK (entity_type IS NULL OR entity_type IN
                   ('service','featured_product','service_request','payment','customer','user'))");

        // --- full-text search Bahasa Indonesia (FD-12) ---
        // Dictionary 'indonesian_stem' bawaan PG; konfigurasi tidak ada -> dibuat.
        DB::unprepared(<<<'SQL'
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'indonesian') THEN
                    CREATE TEXT SEARCH CONFIGURATION indonesian (COPY = simple);
                END IF;
            END $$;
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE INDEX idx_services_fts ON services
            USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')))
            WHERE deleted_at IS NULL;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP INDEX IF EXISTS idx_services_fts');
        Schema::dropIfExists('service_images');
        Schema::dropIfExists('services');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('tax_rates');
        Schema::dropIfExists('service_categories');
    }
};
