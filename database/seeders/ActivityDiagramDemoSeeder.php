<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Pengajuan;
use App\Models\PengelolaApplication;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ActivityDiagramDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'mitra@pnjprime.test')->first()
            ?? User::where('role', 'customer')->first();
        $adminRtpu = User::where('email', 'admin@pnjprime.test')->first();

        // Ensure Admin Pengelola exists for AD-13
        User::firstOrCreate(
            ['email' => 'pengelola@pnjprime.test'],
            [
                'name' => 'Admin Pengelola Unit',
                'password' => Hash::make('password'),
                'role' => 'admin_pengelola',
                'is_active' => true,
                'account_status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $product = Product::where('curation_status', 'approved')->first();

        if (! $customer || ! $product) {
            return;
        }

        // 1. Pengajuan status: Diajukan (Untuk AD-08)
        $p1 = Pengajuan::updateOrCreate(
            ['code' => 'PNJ-DEMO-AD08'],
            [
                'buyer_id' => $customer->id,
                'product_id' => $product->id,
                'tipe' => 'jasa',
                'keperluan' => 'Pengujian lab kalibrasi beton - Demo AD-08',
                'total' => 1500000,
                'status' => 'Diajukan',
            ]
        );

        // 2. Pengajuan status: Menunggu Invoice (Untuk AD-09)
        $p2 = Pengajuan::updateOrCreate(
            ['code' => 'PNJ-DEMO-AD09'],
            [
                'buyer_id' => $customer->id,
                'product_id' => $product->id,
                'tipe' => 'jasa',
                'keperluan' => 'Pelatihan IoT kampus - Demo AD-09',
                'total' => 2500000,
                'status' => 'Menunggu Invoice',
            ]
        );
        $order2 = Order::updateOrCreate(
            ['order_number' => 'ORD-DEMO-AD09'],
            [
                'pengajuan_id' => $p2->id,
                'buyer_id' => $customer->id,
                'subtotal' => 2500000,
                'tax_amount' => 275000,
                'total' => 2775000,
                'status' => 'menunggu_pembayaran',
            ]
        );

        // 3. Pengajuan status: Menunggu Pembayaran + Invoice (Untuk AD-06, AD-10)
        $p3 = Pengajuan::updateOrCreate(
            ['code' => 'PNJ-DEMO-AD10'],
            [
                'buyer_id' => $customer->id,
                'product_id' => $product->id,
                'tipe' => 'jasa',
                'keperluan' => 'Sewa Ruang Rapat - Demo AD-10',
                'total' => 1200000,
                'status' => 'Menunggu Pembayaran',
            ]
        );
        $order3 = Order::updateOrCreate(
            ['order_number' => 'ORD-DEMO-AD10'],
            [
                'pengajuan_id' => $p3->id,
                'buyer_id' => $customer->id,
                'subtotal' => 1200000,
                'tax_amount' => 132000,
                'total' => 1332000,
                'status' => 'menunggu_pembayaran',
            ]
        );
        $invoice3 = Invoice::updateOrCreate(
            ['invoice_number' => 'INV-DEMO-AD10'],
            [
                'pengajuan_id' => $p3->id,
                'order_id' => $order3->id,
                'issued_by' => $adminRtpu?->id,
                'subtotal' => 1200000,
                'tax_rate_snapshot' => 11.0,
                'tax_amount' => 132000,
                'total' => 1332000,
                'status' => 'issued',
                'issued_at' => now(),
                'due_at' => now()->addDays(7),
            ]
        );
        Payment::updateOrCreate(
            ['order_id' => 'MIDTRANS-DEMO-10'],
            [
                'request_id' => $p3->id,
                'gross_amount' => 1332000,
                'payment_type' => 'bank_transfer',
                'status' => 'pending',
                'snap_token' => 'demo-snap-token',
            ]
        );

        // 4. Pengajuan status: Diproses (Untuk AD-11)
        $p4 = Pengajuan::updateOrCreate(
            ['code' => 'PNJ-DEMO-AD11'],
            [
                'buyer_id' => $customer->id,
                'product_id' => $product->id,
                'tipe' => 'jasa',
                'keperluan' => 'Pengerjaan Uji Tarik Logam - Demo AD-11',
                'total' => 3000000,
                'status' => 'Diproses',
            ]
        );

        // 5. Product pending curation: pending & verified (Untuk AD-14 & AD-18)
        $owner = User::where('role', 'admin_pengelola')->first() ?? $customer;
        Product::updateOrCreate(
            ['slug' => 'demo-ad14-robot-pembersih'],
            [
                'owner_id' => $owner->id,
                'category_id' => $product->category_id,
                'name' => 'Robot Pembersih Otomatis Panel Surya (AD-14)',
                'short_description' => 'Produk hasil riset unit robotika PNJ siap diverifikasi RTPU.',
                'description' => 'Spesifikasi lengkap robot pembersih panel surya otomatis.',
                'base_price' => 18000000,
                'final_price' => 18000000,
                'curation_status' => 'pending',
                'is_active' => false,
            ]
        );
        Product::updateOrCreate(
            ['slug' => 'demo-ad18-mesin-distilasi'],
            [
                'owner_id' => $owner->id,
                'category_id' => $product->category_id,
                'name' => 'Mesin Distilasi Minyak Atsiri (AD-18)',
                'short_description' => 'Lolos verifikasi RTPU, menunggu persetujuan Pimpinan.',
                'description' => 'Mesin distilasi kapasitas 25L hasil riset Teknik Kimia PNJ.',
                'base_price' => 12500000,
                'final_price' => 12500000,
                'curation_status' => 'verified',
                'is_active' => false,
            ]
        );

        // 6. Pengelola Application status: pending (Untuk AD-17)
        PengelolaApplication::updateOrCreate(
            ['unit_name' => 'Pusat Riset Mekatronika & AI'],
            [
                'user_id' => $customer->id,
                'pic_name' => 'Ir. Hendra Wijaya, M.T.',
                'phone' => '081298765432',
                'sk_document_path' => 'demo/sk_mekatronika.pdf',
                'status' => 'pending',
            ]
        );
    }
}
