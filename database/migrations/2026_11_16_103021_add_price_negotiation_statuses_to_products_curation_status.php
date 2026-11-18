<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add new curation statuses for price negotiation flow.
     * 
     * New statuses:
     * - perlu_revisi_harga: Admin RTPU asks Pengelola to revise price
     * - counter_offer: Pengelola counters RTPU's suggested price
     * 
     * Note: SQLite uses string column (no native enum), so this migration
     * is mostly documentary. App-level validation in ProductStatus enum.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        
        // SQLite: enum is just a string column, no database constraint
        // No migration needed — ProductStatus enum handles validation
        
        if ($driver === 'mysql') {
            // MySQL: ALTER enum to include new values
            DB::statement("
                ALTER TABLE products 
                MODIFY COLUMN curation_status ENUM(
                    'draft',
                    'pending',
                    'verified',
                    'perlu_revisi_harga',
                    'counter_offer',
                    'approved',
                    'rejected'
                ) DEFAULT 'draft'
            ");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: add new enum values to existing type
            // This is complex and requires:
            // 1. Create new type with all values
            // 2. Alter column to use new type
            // 3. Drop old type
            // For now, documented in ProductStatus enum; handle in future if project migrates to PostgreSQL
            
            // Placeholder (not executed for SQLite):
            // DB::statement("ALTER TYPE curation_status ADD VALUE 'perlu_revisi_harga' BEFORE 'approved'");
            // DB::statement("ALTER TYPE curation_status ADD VALUE 'counter_offer' BEFORE 'approved'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("
                ALTER TABLE products 
                MODIFY COLUMN curation_status ENUM(
                    'draft',
                    'pending',
                    'verified',
                    'approved',
                    'rejected'
                ) DEFAULT 'draft'
            ");
        }
    }
};
