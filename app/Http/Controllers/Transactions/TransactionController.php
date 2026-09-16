<?php

namespace App\Http\Controllers\Transactions;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function __construct(private SettingService $settings)
    {
    }

    public function index(): Response
    {
        $user  = Auth::user();
        $query = Order::with(['items.product', 'paymentProofs'])->latest();

        if (! $user->isAdminRtpu()) {
            $query->where('buyer_id', $user->id);
        }

        return Inertia::render('Transactions/Index', [
            'orders' => $query->paginate(15),
        ]);
    }

    public function checkout(): Response
    {
        return Inertia::render('Transactions/Checkout', [
            'payment_info' => [
                'bank'    => $this->settings->get('payment_bank_name'),
                'account' => $this->settings->get('payment_account_number'),
                'holder'  => $this->settings->get('payment_account_holder'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        return redirect()->route('transactions.index');
    }

    public function show(Order $order): Response
    {
        $this->authorizeOrder($order);

        return Inertia::render('Transactions/Show', [
            'order' => $order->load(['items.product', 'buyer', 'paymentProofs']),
        ]);
    }

    public function uploadProof(Request $request, Order $order)
    {
        $this->authorizeOrder($order);
        return back()->with('success', 'Bukti pembayaran berhasil diunggah.');
    }

    private function authorizeOrder(Order $order): void
    {
        $user = Auth::user();
        if (! $user->isAdminRtpu() && $order->buyer_id !== $user->id) {
            abort(403);
        }
    }
}
