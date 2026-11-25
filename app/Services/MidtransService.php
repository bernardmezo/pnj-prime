<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Pengajuan;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
        $this->sslVerify = (bool) config('services.midtrans.ssl_verify', true);
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
        // A nested commit is only a savepoint: process death could roll back the
        // reservation after Midtrans has accepted the external request.
        if (DB::transactionLevel() !== 0) {
            throw new \LogicException('Snap payment cannot be created inside an existing transaction.');
        }

        if ($pengajuan->tipe !== 'produk' || $pengajuan->isPreorder()) {
            throw ValidationException::withMessages(['payment' => 'Pembayaran Midtrans hanya tersedia untuk produk ready stock.']);
        }

        // Phase A (short transaction): validate under lock, reuse a live token, or list stale pending attempts.
        $phaseA = DB::transaction(function () use ($pengajuan) {
            $locked = $this->lockEligibleRequest($pengajuan);
            $existing = $this->reusablePayment($locked);

            return [$existing, $existing ? [] : $locked->payments()->where('status', 'pending')->pluck('order_id', 'id')->all()];
        });
        if ($phaseA[0]) {
            return $phaseA[0];
        }

        // Phase B (no lock, no transaction): ask the gateway about earlier attempts.
        $remoteByPayment = [];
        foreach ($phaseA[1] as $paymentId => $staleOrderId) {
            try {
                $remoteByPayment[$paymentId] = $this->getTransactionStatus($staleOrderId);
            } catch (Exception $e) {
                throw ValidationException::withMessages(['payment' => 'Status pembayaran sebelumnya belum dapat dipastikan. Coba lagi nanti.']);
            }
        }

        // Phase C (short transaction): re-validate, apply reconciliation, then COMMIT the reservation before any HTTP.
        [$payment, $payload] = DB::transaction(function () use ($pengajuan, $remoteByPayment) {
            $locked = $this->lockEligibleRequest($pengajuan);
            if ($existing = $this->reusablePayment($locked)) {
                return [$existing, null];
            }
            foreach ($locked->payments()->where('status', 'pending')->lockForUpdate()->get() as $stale) {
                $remote = $remoteByPayment[$stale->id] ?? null;
                $remoteStatus = $remote['transaction_status'] ?? '';
                if ($remote !== null && in_array($remoteStatus, ['expire', 'cancel', 'deny', 'failure'], true)) {
                    $stale->update(['status' => $remoteStatus === 'expire' ? 'expired' : 'failed', 'raw_response' => $remote]);

                    continue;
                }
                throw ValidationException::withMessages(['payment' => 'Masih ada pembayaran Midtrans sebelumnya yang belum final. Periksa status pembayaran terlebih dahulu.']);
            }

            return $this->reserveSnapPayment($locked);
        });
        if ($payload === null) {
            return $payment;
        }

        // Phase D (outside any transaction): the reservation row is already durable, so a crash here leaves a reconcilable pending attempt.
        try {
            $response = Http::withOptions(['verify' => $this->sslVerify])
                ->timeout(15)->connectTimeout(5)
                ->withBasicAuth($this->serverKey, '')
                ->acceptJson()
                ->post($this->getSnapBaseUrl().'/transactions', $payload);
        } catch (\Throwable $e) {
            throw $e; // Keep the pending row: the gateway may have accepted the request.
        }
        if (! $response->successful()) {
            throw new Exception('Status pembuatan pembayaran belum dapat dipastikan. Hubungi RTPU.');
        }
        $resData = $response->json();
        $snapToken = $resData['token'] ?? null;
        if (! $snapToken) {
            throw new Exception('Token pembayaran tidak ditemukan; status transaksi perlu diperiksa.');
        }

        // Phase E: persist the token, only on a still-pending row.
        Payment::whereKey($payment->id)->where('status', 'pending')->update(['snap_token' => $snapToken, 'raw_response' => json_encode($resData)]);

        return $payment->refresh();
    }

    private function lockEligibleRequest(Pengajuan $pengajuan): Pengajuan
    {
        // SQLite ignores FOR UPDATE; reserve the writer before reading state.
        if (DB::getDriverName() === 'sqlite') {
            DB::table('pengajuan')->where('id', $pengajuan->id)->update(['id' => DB::raw('id')]);
        }
        $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
        if ($locked->tipe !== 'produk' || $locked->isPreorder() || $locked->status !== 'Menunggu Pembayaran') {
            throw ValidationException::withMessages(['payment' => 'Pembayaran Midtrans tidak tersedia untuk pesanan ini.']);
        }

        return $locked;
    }

    private function reusablePayment(Pengajuan $pengajuan): ?Payment
    {
        return $pengajuan->payments()
            ->where('status', 'pending')
            ->whereNotNull('snap_token')
            ->where('created_at', '>=', now()->subHours(24))
            ->latest()
            ->first();
    }

    /** @return array{0: Payment, 1: array} reserved pending payment and the gateway payload */
    private function reserveSnapPayment(Pengajuan $pengajuan): array
    {
        // 2. Compute gross_amount from server-stored order / items
        $order = $pengajuan->order;
        $subtotal = (int) ($order?->subtotal ?? $pengajuan->total ?? 0);
        $tax = (int) ($order?->tax_amount ?? 0);
        $shipping = (int) ($order?->shipping_amount ?? 0);
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

        if ($shipping > 0) {
            $items[] = [
                'id' => 'SHIPPING-'.($order->shipping_snapshot['service'] ?? 'ONGKIR'),
                'price' => $shipping,
                'quantity' => 1,
                'name' => substr('Ongkir '.strtoupper($order->shipping_snapshot['courier'] ?? '').' '.($order->shipping_snapshot['service'] ?? ''), 0, 50),
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

        $payment = Payment::create([
            'request_id' => $pengajuan->id, 'order_id' => $orderId,
            'gross_amount' => $grossAmount, 'status' => 'pending',
        ]);

        return [$payment, $payload];
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
            ]);
            throw new Exception('Gagal memeriksa status ke Midtrans API.');
        }

        return $response->json();
    }
}
