<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            // Rental period (datetime range for booking)
            $table->dateTime('rental_start')->nullable()->after('metode_pengambilan');
            $table->dateTime('rental_end')->nullable()->after('rental_start');
            
            // Renter data (for sewa: company name, NPWP, KTP, contact person)
            // Stored as JSON: {company_name, npwp, ktp_number, contact_person, contact_phone}
            $table->json('renter_data')->nullable()->after('rental_end');
            
            // Rental fulfillment timestamps
            $table->dateTime('rental_started_at')->nullable()->after('renter_data')->comment('When rental actually started (Berjalan/Dipinjam)');
            $table->dateTime('rental_returned_at')->nullable()->after('rental_started_at')->comment('When equipment was returned (alat only)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn([
                'rental_start',
                'rental_end',
                'renter_data',
                'rental_started_at',
                'rental_returned_at',
            ]);
        });
    }
};
