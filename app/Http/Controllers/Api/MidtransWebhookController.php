<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Pengajuan;
use App\Services\MidtransService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(private MidtransService $midtrans) {}

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Midtrans Webhook Received', ['payload' => $payload]);

        $orderId = (string) $request->input('order_id');
        $statusCode = (string) $request->input('status_code');
        $grossAmount = (string) $request->input('gross_amount');
        $signatureKey = (string) $request->input('signature_key');

        // 1. Verify signature in constant time
        if (! $this->midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans Webhook Invalid Signature', [
                'order_id' => $orderId,
                'signature' => $signatureKey,
            ]);

            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        // 2. Confirm by calling the Midtrans status API for that order_id (trust status API)
        try {
            $midtransStatus = $this->midtrans->getTransactionStatus($orderId);
        } catch (Exception $e) {
            Log::error('Midtrans Webhook: Status API call failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Error verifying with Midtrans API.'], 500);
        }

        // 3. Verify the order exists and gross_amount matches our stored amount
        $payment = Payment::with('request')->where('order_id', $orderId)->first();
        if (! $payment) {
            Log::warning('Midtrans Webhook: Order not found in database', ['order_id' => $orderId]);

            return response()->json(['message' => 'Payment record not found.'], 404);
        }

        $apiGross = (int) round((float) ($midtransStatus['gross_amount'] ?? 0));
        if ($apiGross !== (int) $payment->gross_amount) {
            Log::warning('Midtrans Webhook: Gross amount mismatch', [
                'order_id' => $orderId,
                'stored_amount' => $payment->gross_amount,
                'api_gross' => $apiGross,
            ]);

            return response()->json(['message' => 'Gross amount mismatch.'], 400);
        }

        // 4. Map statuses
        // settlement, or capture with fraud_status "accept" -> paid
        // pending -> waiting
        // deny, cancel, expire, failure -> failed or expired
        // refund, partial_refund -> refunded
        $transactionStatus = $midtransStatus['transaction_status'] ?? '';
        $fraudStatus = $midtransStatus['fraud_status'] ?? '';
        $paymentType = $midtransStatus['payment_type'] ?? $payment->payment_type;
        $transactionId = $midtransStatus['transaction_id'] ?? $payment->transaction_id;
        $settlementTime = $midtransStatus['settlement_time'] ?? $midtransStatus['transaction_time'] ?? null;

        $targetStatus = match ($transactionStatus) {
            'capture' => ($fraudStatus === 'accept') ? 'paid' : 'failed',
            'settlement' => 'paid',
            'pending' => 'pending',
            'deny', 'failure' => 'failed',
            'expire' => 'expired',
            'cancel' => 'failed',
            'refund', 'partial_refund' => 'refunded',
            default => 'pending',
        };

        // 5. Idempotency: Never move a paid payment backward or process twice
        if ($payment->status === 'paid' && $targetStatus !== 'refunded') {
            Log::info('Midtrans Webhook: Payment already marked as paid. Ignoring duplicate.', ['order_id' => $orderId]);

            return response()->json(['message' => 'Payment already paid.']);
        }

        // 6. Database Transaction
        DB::transaction(function () use ($payment, $targetStatus, $paymentType, $transactionId, $midtransStatus, $settlementTime) {
            $payment->update([
                'status' => $targetStatus,
                'payment_type' => $paymentType,
                'transaction_id' => $transactionId,
                'raw_response' => $midtransStatus,
                'paid_at' => ($targetStatus === 'paid') ? ($payment->paid_at ?? ($settlementTime ? now()->parse($settlementTime) : now())) : $payment->paid_at,
            ]);

            $pengajuan = $payment->request;
            if ($pengajuan) {
                if ($targetStatus === 'paid') {
                    // Skip 'Menunggu Verifikasi Pembayaran': paid moves straight to 'Diproses'
                    if ($pengajuan->status !== 'Diproses' && $pengajuan->status !== 'Selesai') {
                        $pengajuan->setStatus('Diproses', 'Pembayaran terverifikasi otomatis via Midtrans ('.($paymentType ?? 'Online').').', 'Midtrans Gateway');
                        $pengajuan->save();
                    }

                    if ($pengajuan->order) {
                        $pengajuan->order->update([
                            'status' => 'diproses',
                            'confirmed_at' => $payment->paid_at ?? now(),
                        ]);
                    }
                } elseif (in_array($targetStatus, ['failed', 'expired'], true)) {
                    // If payment expired and pengajuan is still waiting, keep or log
                    Log::info('Midtrans payment marked as '.$targetStatus, ['order_id' => $payment->order_id]);
                }
            }
        });

        Log::info('Midtrans Webhook Processed Successfully', [
            'order_id' => $orderId,
            'target_status' => $targetStatus,
        ]);

        return response()->json(['message' => 'Webhook handled successfully.']);
    }
}
