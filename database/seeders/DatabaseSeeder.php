<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters — seed users first, then products (which reference user IDs),
     * then settings, then external links.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ProductCategorySeeder::class,
            SettingSeeder::class,
            ExternalLinkSeeder::class,
        ]);
    }
}
