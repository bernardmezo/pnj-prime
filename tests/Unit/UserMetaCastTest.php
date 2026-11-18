<?php

namespace Tests\Unit;

use App\Models\User;
use PHPUnit\Framework\TestCase;

class UserMetaCastTest extends TestCase
{
    public function test_meta_attribute_is_cast_to_array()
    {
        $user = new User();
        $user->meta = ['npwp_perusahaan' => '12.345.678.9-012.000', 'bidang_usaha' => 'Manufaktur'];
        
        $this->assertIsArray($user->meta);
        $this->assertEquals('12.345.678.9-012.000', $user->meta['npwp_perusahaan']);
        $this->assertEquals('Manufaktur', $user->meta['bidang_usaha']);
    }

    public function test_meta_null_remains_null()
    {
        $user = new User();
        $user->meta = null;
        
        $this->assertNull($user->meta);
    }

    public function test_meta_empty_array()
    {
        $user = new User();
        $user->meta = [];
        
        $this->assertIsArray($user->meta);
        $this->assertEmpty($user->meta);
    }
}
