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
        $driver = DB::getDriverName();
        $final = ['customer', 'admin_rtpu', 'admin_p3m', 'admin_pengelola', 'admin_jurusan', 'pimpinan_rtpu', 'direktur', 'super_admin'];

        if ($driver === 'sqlite') {
            // Rebuild users table with expanded enum including admin_jurusan
            $this->rebuildUsersTableForSqlite($final);
        }
    }

    public function down(): void
    {
        // no-op
    }

    protected function rebuildUsersTableForSqlite(array $roles): void
    {
        // Get all columns existing in users table
        $columns = Schema::getColumnListing('users');

        Schema::dropIfExists('users_new');
        Schema::create('users_new', function (Blueprint $table) use ($roles) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', $roles)->default('customer');
            $table->enum('account_origin', ['local_simulation', 'sso_pnj'])->default('local_simulation');
            $table->string('phone', 20)->nullable();
            $table->string('nip', 30)->nullable();
            $table->string('jurusan', 100)->nullable();
            $table->string('prodi', 100)->nullable();
            $table->string('institution')->nullable();
            $table->string('user_type', 64)->nullable();
            $table->string('nik_npwp', 32)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('account_status', 30)->default('active');
            $table->string('unit_name', 100)->nullable();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->string('ktp_number', 16)->nullable();
            $table->string('npwp_number', 20)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Copy existing data safely
        $existingCols = array_intersect(Schema::getColumnListing('users_new'), $columns);
        $colList = implode(', ', $existingCols);

        DB::statement("INSERT INTO users_new ({$colList}) SELECT {$colList} FROM users");

        Schema::disableForeignKeyConstraints();
        Schema::drop('users');
        Schema::rename('users_new', 'users');
        Schema::enableForeignKeyConstraints();
    }
};
