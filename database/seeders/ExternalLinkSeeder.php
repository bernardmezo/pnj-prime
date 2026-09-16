<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExternalLinkSeeder extends Seeder
{
    public function run(): void
    {
        $links = [
            [
                'label'        => 'LMS iKAMAS',
                'url'          => 'https://ikamas.pnj.ac.id',
                'description'  => 'Platform Learning Management System iKAMAS Politeknik Negeri Jakarta.',
                'icon'         => 'icon-academic-cap',
                'is_active'    => true,
                'open_new_tab' => true,
                'sort_order'   => 1,
            ],
            [
                'label'        => 'Website RTPU',
                'url'          => 'https://rtpu.pnj.ac.id',
                'description'  => 'Website resmi UPA Riset, Teknologi, Pengabdian, dan Usaha PNJ.',
                'icon'         => 'icon-globe',
                'is_active'    => true,
                'open_new_tab' => true,
                'sort_order'   => 2,
            ],
        ];

        foreach ($links as $link) {
            DB::table('external_links')->insertOrIgnore(
                array_merge($link, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}