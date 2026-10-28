<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Pengajuan;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    private string $serverKey;

    private string $clientKey;

    private bool $isProduction;

    private bool $sslVerify;

    public function __construct()
    {
        $this->serverKey = (string) config('services.midtrans.server_key', '');
        $this->clientKey = (string) config('services.midtrans.client_key', '');
        $this->isProduction = (bool) config('services.midtrans.is_production', false);
        $this->sslVerify = (bool) config('services.midtrans.ssl_verify', false);
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    public function getSnapBaseUrl(): string
    {
        return $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    public function getApiBaseUrl(): string
    {
        return $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function getSnapScriptUrl(): string
    {
        return $this->isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }

    /**
     * Create Snap Token for Pengajuan
     *
     * @throws Exception
     */
    public function createSnapPayment(Pengajuan $pengajuan): Payment
    {
        // 1. Check if a valid unexpired pending payment token already exists for this request
        $existing = $pengajuan->payments()
            ->where('status', 'pending')
            ->whereNotNull('snap_token')
            ->where('created_at', '>=', now()->subHours(24))
            ->latest()
            ->first();

        if ($existing) {
            return $existing;
        }

        // 2. Compute gross_amount from server-stored order / items
        $order = $pengajuan->order;
        $subtotal = (int) ($order?->subtotal ?? $pengajuan->total ?? 0);
        $tax = (int) ($order?->tax_amount ?? 0);
        $grossAmount = (int) ($order?->total ?? ($subtotal + $tax));

        if ($grossAmount <= 0) {
            throw new Exception('Gross amount must be greater than zero.');
        }

        // 3. Unique order_id at most 50 characters: Code + short suffix
        // Code is like PNJ-20261028-0006 (17 chars). Add -<timestamp/random>
        $cleanCode = preg_replace('/[^a-zA-Z0-9\-_]/', '', $pengajuan->code ?? 'PNJ-REQ-'.$pengajuan->id);
        $suffix = substr(bin2hex(random_bytes(4)), 0, 8); // 8 chars
        $orderId = substr($cleanCode, 0, 40).'-'.$suffix; // max 49 chars

        // 4. Build item_details that sum EXACTLY to gross_amount
        $items = [];
        $opsiList = $pengajuan->opsi ?? collect();

        if ($opsiList->count() > 0) {
            // Include main product and add-ons
            $opsiSum = 0;
            foreach ($opsiList as $op) {
                $itemSubtotal = (int) $op->subtotal;
                $items[] = [
                    'id' => 'OPSI-'.$op->id,
                    'price' => (int) $op->harga,
                    'quantity' => (int) ($op->qty ?: 1),
                    'name' => substr((string) ($op->nama ?? 'Opsi Tambahan'), 0, 50),
                ];
                $opsiSum += $itemSubtotal;
            }

            $mainPrice = $subtotal - $opsiSum;
            if ($mainPrice > 0) {
                array_unshift($items, [
                    'id' => 'PROD-'.($pengajuan->product_id ?? $pengajuan->id),
                    'price' => $mainPrice,
                    'quantity' => 1,
                    'name' => substr((string) ($pengajuan->product?->name ?? 'Layanan Utama'), 0, 50),
                ]);
            }
        } else {
            $items[] = [
                'id' => 'REQ-'.$pengajuan->id,
                'price' => $subtotal,
                'quantity' => 1,
                'name' => substr((string) ($pengajuan->product?->name ?? 'Layanan '.$pengajuan->code), 0, 50),
            ];
        }

        if ($tax > 0) {
            $items[] = [
                'id' => 'TAX-PPN',
                'price' => $tax,
                'quantity' => 1,
                'name' => 'PPN (12%)',
            ];
        }

        // Midtrans rejects item_details with price = 0 (e.g. Garansi 0 rupiah).
        // Exclude any line items with price <= 0.
        $items = array_values(array_filter($items, fn ($it) => (int) ($it['price'] ?? 0) > 0));

        // Verify items sum matches gross_amount exactly
        $itemSum = 0;
        foreach ($items as $it) {
            $itemSum += ($it['price'] * $it['quantity']);
        }
        if ($itemSum !== $grossAmount) {
            // Safety fallback if item details mismatch slightly
            $items = [
                [
                    'id' => 'TOTAL-'.$pengajuan->id,
                    'price' => $grossAmount,
                    'quantity' => 1,
                    'name' => substr((string) ($pengajuan->product?->name ?? 'Total Tagihan'), 0, 50),
                ],
            ];
        }

        $customer = $pengajuan->buyer;
        $customerDetails = [
            'first_name' => substr((string) ($customer?->name ?? 'Customer'), 0, 45),
            'email' => $customer?->email ?? 'customer@example.com',
            'phone' => substr((string) ($customer?->phone ?? ''), 0, 19),
        ];

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'item_details' => $items,
            'customer_details' => $customerDetails,
            'custom_expiry' => [
                'expiry_duration' => 24,
                'unit' => 'hour',
            ],
            'callbacks' => [
                'finish' => route('customer.pengajuan.show', $pengajuan->id),
            ],
        ];

        $response = Http::withOptions(['verify' => $this->sslVerify])
            ->withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->post($this->getSnapBaseUrl().'/transactions', $payload);

        if (! $response->successful()) {
            Log::error('Midtrans Snap Token Creation Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'order_id' => $orderId,
            ]);
            throw new Exception('Gagal menghubungi gateway pembayaran: '.($response->json('error_messages.0') ?? $response->body()));
        }

        $resData = $response->json();
        $snapToken = $resData['token'] ?? null;

        if (! $snapToken) {
            throw new Exception('Token pembayaran tidak ditemukan dalam respon Midtrans.');
        }

        return Payment::create([
            'request_id' => $pengajuan->id,
            'order_id' => $orderId,
            'gross_amount' => $grossAmount,
            'snap_token' => $snapToken,
            'status' => 'pending',
            'raw_response' => $resData,
        ]);
    }

    /**
     * Verify Webhook Signature
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        return hash_equals($expectedSignature, $signatureKey);
    }

    /**
     * Fetch latest transaction status directly from Midtrans API
     */
    public function getTransactionStatus(string $orderId): array
    {
        $response = Http::withOptions(['verify' => $this->sslVerify])
            ->withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->get($this->getApiBaseUrl().'/'.urlencode($orderId).'/status');

        if (! $response->successful()) {
            Log::error('Midtrans Status Check Failed', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception('Gagal memeriksa status ke Midtrans API.');
        }

        return $response->json();
    }
}
