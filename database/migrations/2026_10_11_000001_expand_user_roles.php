<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expand users.role to the six PNJ PRIME roles and remap legacy rows:
     *   eksternal, dosen_peneliti, mahasiswa -> customer
     * admin_rtpu rows are untouched. Same passwords keep working.
     *
     * Enum CHECKs validate on write, so the change is staged through a
     * superset enum (MySQL) or a mapping copy (SQLite).
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        $final = ['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'];

        if ($driver === 'mysql') {
            $all = array_unique(array_merge(
                ['admin_rtpu', 'dosen_peneliti', 'mahasiswa', 'eksternal'], $final
            ));
            DB::statement('ALTER TABLE users MODIFY COLUMN role ENUM('.$this->quoted($all).") NOT NULL DEFAULT 'customer'");
            $this->mapUp();
            DB::statement('ALTER TABLE users MODIFY COLUMN role ENUM('.$this->quoted($final).") NOT NULL DEFAULT 'customer'");
        } elseif ($driver === 'sqlite') {
            $this->rebuildUsersTable($final, 'customer', [
                'eksternal' => 'customer',
                'dosen_peneliti' => 'customer',
                'mahasiswa' => 'customer',
            ]);
        }
        if ($driver === 'pgsql') {
            // Drop the old CHECK constraint that only allows 4 legacy roles,
            // add a superset constraint (legacy + new) so mapUp() can write
            // 'customer', then tighten to the final 6 roles.
            $legacy = ['admin_rtpu', 'dosen_peneliti', 'mahasiswa', 'eksternal'];
            $superset = array_unique(array_merge($legacy, $final));
            $supersetSql = implode(',', array_map(fn ($v) => "'".$v."'", $superset));
            $finalSql = implode(',', array_map(fn ($v) => "'".$v."'", $final));

            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$supersetSql}))");

            $this->mapUp();

            // Tighten to only the 6 PNJ PRIME roles.
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$finalSql}))");

            // Update default value.
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'");
        }
    }

    /**
     * Reverse the data mapping. Note: admin_p3m rows collapse back to
     * dosen_peneliti (the finer old distinction is not recoverable).
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        $legacy = ['admin_rtpu', 'dosen_peneliti', 'mahasiswa', 'eksternal'];

        if ($driver === 'mysql') {
            $all = array_unique(array_merge($legacy, [
                'customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin',
            ]));
            DB::statement('ALTER TABLE users MODIFY COLUMN role ENUM('.$this->quoted($all).") NOT NULL DEFAULT 'eksternal'");
            $this->mapDown();
            DB::statement('ALTER TABLE users MODIFY COLUMN role ENUM('.$this->quoted($legacy).") NOT NULL DEFAULT 'eksternal'");
        } elseif ($driver === 'sqlite') {
            $this->rebuildUsersTable($legacy, 'eksternal', [
                'customer' => 'eksternal',
                'admin_p3m' => 'dosen_peneliti',
                'pimpinan_rtpu' => 'eksternal',
                'direktur' => 'eksternal',
                'super_admin' => 'eksternal',
            ]);
        }
        if ($driver === 'pgsql') {
            $final = ['customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'];
            $superset = array_unique(array_merge($legacy, $final));
            $supersetSql = implode(',', array_map(fn ($v) => "'".$v."'", $superset));
            $legacySql = implode(',', array_map(fn ($v) => "'".$v."'", $legacy));

            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$supersetSql}))");

            $this->mapDown();

            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ({$legacySql}))");

            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'eksternal'");
        }
    }

    protected function mapUp(): void
    {
        DB::table('users')->whereIn('role', ['eksternal', 'dosen_peneliti', 'mahasiswa'])->update(['role' => 'customer']);
    }

    protected function mapDown(): void
    {
        DB::table('users')->where('role', 'customer')->update(['role' => 'eksternal']);
        DB::table('users')->where('role', 'admin_p3m')->update(['role' => 'dosen_peneliti']);
        DB::table('users')->whereIn('role', ['pimpinan_rtpu', 'direktur', 'super_admin'])->update(['role' => 'eksternal']);
    }

    protected function quoted(array $values): string
    {
        return implode(',', array_map(fn ($v) => "'".str_replace("'", "''", $v)."'", $values));
    }

    /**
     * SQLite cannot ALTER an enum CHECK in place: rebuild users with the
     * target enum while remapping role values during the copy.
     */
    protected function rebuildUsersTable(array $roles, string $default, array $map): void
    {
        Schema::dropIfExists('users_new');
        Schema::create('users_new', function (Blueprint $table) use ($roles, $default) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', $roles)->default($default);
            $table->enum('account_origin', ['local_simulation', 'sso_pnj'])->default('local_simulation');
            $table->string('phone', 20)->nullable();
            $table->string('institution')->nullable();
            $table->string('ktp_number', 16)->nullable();
            $table->string('npwp_number', 20)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Remap legacy values during the copy so the new CHECK holds.
        $case = $this->nestedCase($map);

        DB::statement("INSERT INTO users_new (id, name, email, email_verified_at, password, role, account_origin, phone, institution, ktp_number, npwp_number, remember_token, created_at, updated_at) SELECT id, name, email, email_verified_at, password, {$case}, account_origin, phone, institution, ktp_number, npwp_number, remember_token, created_at, updated_at FROM users");

        Schema::disableForeignKeyConstraints();
        Schema::drop('users');
        Schema::rename('users_new', 'users');
        Schema::enableForeignKeyConstraints();
    }

    protected function nestedCase(array $map): string
    {
        $expr = 'role';
        foreach (array_reverse($map, true) as $from => $to) {
            $expr = "CASE WHEN role = '{$from}' THEN '{$to}' ELSE ({$expr}) END";
        }

        return $expr;
    }
};
