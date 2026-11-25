<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Pengajuan;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SyncMidtransPayment
{
    public function handle(Payment $payment, array $response): bool
    {
        $amount = $response['gross_amount'] ?? null;
        if (($response['order_id'] ?? null) !== $payment->order_id || ! $this->matchesAmount($amount, $payment->gross_amount)) {
            throw new InvalidArgumentException('Midtrans order or gross amount mismatch.');
        }

        $status = match ($response['transaction_status'] ?? '') {
            'capture' => match ($response['fraud_status'] ?? '') {
                'accept' => 'paid',
                'deny' => 'failed',
                default => 'pending',
            },
            'settlement' => 'paid',
            'deny', 'failure', 'cancel' => 'failed',
            'expire' => 'expired',
            'refund', 'partial_refund' => 'refunded',
            default => 'pending',
        };

        return DB::transaction(function () use ($payment, $response, $status) {
            if (DB::getDriverName() === 'sqlite') {
                DB::table('pengajuan')->where('id', $payment->request_id)->update(['id' => DB::raw('id')]);
            }
            $request = Pengajuan::whereKey($payment->request_id)->lockForUpdate()->firstOrFail();
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if (in_array($locked->status, ['paid', 'refunded'], true) && $status !== 'refunded') {
                return true;
            }
            $time = $response['settlement_time'] ?? $response['transaction_time'] ?? null;
            $locked->update([
                'status' => $status,
                'payment_type' => $response['payment_type'] ?? $locked->payment_type,
                'transaction_id' => $response['transaction_id'] ?? $locked->transaction_id,
                'raw_response' => $response,
                'paid_at' => $status === 'paid' ? ($locked->paid_at ?? ($time ? now()->parse($time) : now())) : $locked->paid_at,
            ]);
            if ($status === 'paid') {
                app(ConfirmPaidPengajuan::class)->handle($request);
            }

            return false;
        });
    }

    public function matchesAmount(mixed $amount, int $expected): bool
    {
        if (! is_string($amount) && ! is_int($amount)) {
            return false;
        }
        if (! preg_match('/\A([0-9]+)(?:\.([0-9]+))?\z/', (string) $amount, $matches)) {
            return false;
        }

        return ltrim($matches[1], '0') === ltrim((string) $expected, '0')
            && (! isset($matches[2]) || trim($matches[2], '0') === '');
    }
}
