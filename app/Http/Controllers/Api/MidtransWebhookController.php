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

        $orderId = (string) $request->input('order_id');
        $statusCode = (string) $request->input('status_code');
        $grossAmount = (string) $request->input('gross_amount');
        $signatureKey = (string) $request->input('signature_key');

        // 1. Verify signature in constant time
        if (! $this->midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans Webhook Invalid Signature', [
                'order_id' => $orderId,
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

        if (! app(\App\Services\SyncMidtransPayment::class)->matchesAmount($grossAmount, $payment->gross_amount)) {
            return response()->json(['message' => 'Gross amount mismatch.'], 400);
        }

        try {
            $alreadyPaid = app(\App\Services\SyncMidtransPayment::class)->handle($payment, $midtransStatus);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => 'Order or gross amount mismatch.'], 400);
        }

        if ($alreadyPaid) {
            return response()->json(['message' => 'Payment already paid.']);
        }

        Log::info('Midtrans Webhook Processed Successfully', [
            'order_id' => $orderId,
        ]);

        return response()->json(['message' => 'Webhook handled successfully.']);
    }
}
