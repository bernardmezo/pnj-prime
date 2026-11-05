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
     *
     * Demo seeders (users with known passwords, sample products) only run in
     * local/testing environments — never in production.
     */
    public function run(): void
    {
        $this->call([
            ProductCategorySeeder::class,
            SettingSeeder::class,
            TaxRateSeeder::class,
            ExternalLinkSeeder::class,
            UsecaseSeeder::class,
        ]);

        if (app()->environment(['local', 'testing'])) {
            $this->call([
                UserSeeder::class,
                ProductSeeder::class,
            ]);
        }
    }
}
