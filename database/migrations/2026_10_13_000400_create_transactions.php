<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Transaksi: pengajuan, item (snapshot harga), reservasi, invoice, pajak, bayar.
 * BR-12: snapshot nilai agar transaksi lama tidak berubah saat master berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- service_requests: header pengajuan (FD-30) ---
        if (! Schema::hasTable('service_requests')) {
            Schema::create('service_requests', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('request_number', 30)->unique();
                $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();
                $table->string('status', 35)->default('MENUNGGU_VERIFIKASI');
                $table->text('notes')->nullable();
                $table->text('rejection_note')->nullable();
                $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('verified_at')->nullable();
                $table->text('cancelled_reason')->nullable();
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();

                $table->index(['user_id', 'status']);
                $table->index(['status', 'created_at']);
                $table->index('created_at');
            });
        }

        // --- service_request_items: detail + snapshot harga (BR-12) ---
        if (! Schema::hasTable('service_request_items')) {
            Schema::create('service_request_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('request_id')->constrained('service_requests')->cascadeOnDelete();
                $table->foreignUuid('service_id')->constrained('services')->restrictOnDelete();
                $table->string('service_type_snapshot', 20);
                $table->string('service_name_snapshot', 200);
                $table->decimal('unit_price_snapshot', 15, 2);
                $table->integer('quantity')->default(1);
                $table->string('rate_unit_snapshot', 20)->nullable();
                $table->decimal('subtotal', 15, 2);
                $table->text('custom_requirements')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index('request_id');
                $table->index('service_id');
            });
        }

        // --- room_reservations: slot jadwal (FD-28, BR-05) ---
        if (! Schema::hasTable('room_reservations')) {
            Schema::create('room_reservations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('request_item_id')->constrained('service_request_items')->cascadeOnDelete();
                $table->foreignUuid('service_id')->constrained('services')->restrictOnDelete();
                $table->timestampTz('start_datetime');
                $table->timestampTz('end_datetime');
                $table->string('status', 20)->default('ACTIVE');
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['service_id', 'start_datetime', 'end_datetime']);
            });
        }

        // --- invoices: hanya setelah DISETUJUI (BR-02) ---
        if (! Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('invoice_number', 30)->unique();
                $table->foreignUuid('request_id')->unique()->constrained('service_requests')->restrictOnDelete();
                $table->decimal('subtotal', 15, 2)->default(0);
                $table->decimal('tax_total', 15, 2)->default(0);
                $table->decimal('grand_total', 15, 2)->default(0);
                $table->string('status', 25)->default('UNPAID');
                $table->jsonb('payment_method_snapshot')->nullable();
                $table->timestampTz('issued_at')->nullable();
                $table->timestampTz('due_date')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['status', 'created_at']);
            });
        }

        // --- invoice_tax_snapshots: pajak per invoice (BR-10) ---
        if (! Schema::hasTable('invoice_tax_snapshots')) {
            Schema::create('invoice_tax_snapshots', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();
                $table->foreignUuid('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();
                $table->string('tax_name_snapshot', 100);
                $table->decimal('tax_percentage_snapshot', 5, 2);
                $table->decimal('taxable_amount', 15, 2);
                $table->decimal('tax_amount', 15, 2);

                $table->index('invoice_id');
            });
        }

        // --- payments: multi attempt (bukti ditolak -> unggah ulang) (FD-43) ---
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('invoice_id')->constrained('invoices')->restrictOnDelete();
                $table->foreignUuid('payment_method_id')->nullable()->constrained('payment_methods')->restrictOnDelete();
                $table->decimal('amount', 15, 2);
                $table->string('status', 30)->default('MENUNGGU_VERIFIKASI');
                $table->jsonb('payment_method_snapshot');
                $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestampTz('verified_at')->nullable();
                $table->text('rejection_note')->nullable();
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent();

                $table->index('invoice_id');
                $table->index(['status', 'created_at']);
            });
        }

        // --- payment_evidences: bukti bayar (privat) (BR-14) ---
        if (! Schema::hasTable('payment_evidences')) {
            Schema::create('payment_evidences', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
                $table->foreignUuid('document_id')->constrained('documents')->restrictOnDelete();
                $table->timestampTz('uploaded_at')->useCurrent();

                $table->index('payment_id');
            });
        }

        // --- status_histories: riwayat transisi (FD-40, BR-06) ---
        if (! Schema::hasTable('status_histories')) {
            Schema::create('status_histories', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('request_id')->constrained('service_requests')->cascadeOnDelete();
                $table->string('previous_status', 35)->nullable();
                $table->string('new_status', 35);
                $table->foreignUuid('action_by')->constrained('users')->restrictOnDelete();
                $table->text('notes')->nullable();
                $table->timestampTz('created_at')->useCurrent();

                $table->index(['request_id', 'created_at']);
            });
        }

        // --- CHECK business rules (safety net; validasi utama di app layer) ---
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT ck_sr_status CHECK (status IN (
            'MENUNGGU_VERIFIKASI','DISETUJUI','DITOLAK',
            'MENUNGGU_VERIFIKASI_PEMBAYARAN','LUNAS','DIPROSES','SELESAI','DIBATALKAN'))");
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT ck_sr_reject_note
            CHECK (status <> 'DITOLAK' OR rejection_note IS NOT NULL)");
        DB::statement("ALTER TABLE service_request_items ADD CONSTRAINT ck_sri_price
            CHECK (unit_price_snapshot >= 0 AND subtotal >= 0)");
        DB::statement("ALTER TABLE service_request_items ADD CONSTRAINT ck_sri_qty
            CHECK (quantity > 0)");
        DB::statement("ALTER TABLE room_reservations ADD CONSTRAINT ck_rr_period
            CHECK (end_datetime > start_datetime)");
        DB::statement("ALTER TABLE room_reservations ADD CONSTRAINT ck_rr_status
            CHECK (status IN ('ACTIVE','RELEASED'))");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT ck_inv_status CHECK (status IN
            ('UNPAID','PENDING_VERIFICATION','PAID','CANCELLED'))");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT ck_inv_amounts
            CHECK (subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0)");
        DB::statement("ALTER TABLE payments ADD CONSTRAINT ck_pay_amount CHECK (amount > 0)");
        DB::statement("ALTER TABLE payments ADD CONSTRAINT ck_pay_status CHECK (status IN
            ('MENUNGGU_VERIFIKASI','LUNAS','DITOLAK'))");
        DB::statement("ALTER TABLE payments ADD CONSTRAINT ck_pay_reject_note
            CHECK (status <> 'DITOLAK' OR rejection_note IS NOT NULL)");

        // --- BR-05: anti-bentrok jadwal di level DB ---
        // Dua reservasi ACTIVE untuk ruangan sama TIDAK boleh rentang waktunya beririsan.
        DB::unprepared(<<<'SQL'
            CREATE INDEX idx_rr_service_time ON room_reservations
            (service_id, start_datetime, end_datetime) WHERE status = 'ACTIVE';
        SQL);

        DB::unprepared(<<<'SQL'
            ALTER TABLE room_reservations ADD CONSTRAINT ex_rr_no_overlap
            EXCLUDE USING gist (
                service_id WITH =,
                tstzrange(start_datetime, end_datetime) WITH &&
            ) WHERE (status = 'ACTIVE');
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('ALTER TABLE room_reservations DROP CONSTRAINT IF EXISTS ex_rr_no_overlap');
        Schema::dropIfExists('status_histories');
        Schema::dropIfExists('payment_evidences');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_tax_snapshots');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('room_reservations');
        Schema::dropIfExists('service_request_items');
        Schema::dropIfExists('service_requests');
    }
};