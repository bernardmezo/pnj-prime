<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Http\Request;

class RentalConflictController extends Controller
{
    /**
     * Check if a rental period conflicts with existing active bookings.
     */
    public function __invoke(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'rental_start' => 'required|date|after_or_equal:today',
            'rental_end' => 'required|date|after:rental_start',
        ]);

        $productId = $request->integer('product_id');
        $start = $request->input('rental_start');
        $end = $request->input('rental_end');

        $conflict = Pengajuan::where('product_id', $productId)
            ->whereNotNull('rental_start')
            ->whereNotNull('rental_end')
            ->whereNotIn('status', ['Ditolak', 'Dibatalkan', 'Kedaluwarsa'])
            ->where('rental_start', '<', $end)
            ->where('rental_end', '>', $start)
            ->first();

        if ($conflict) {
            $s = \Carbon\Carbon::parse($conflict->rental_start)->locale('id')->isoFormat('D MMM YYYY HH:mm');
            $e = \Carbon\Carbon::parse($conflict->rental_end)->locale('id')->isoFormat('D MMM YYYY HH:mm');
            return response()->json([
                'conflict' => true,
                'conflict_message' => "Jadwal bentrok: sudah ada pemesanan pada {$s} s/d {$e}. Silakan pilih periode lain.",
            ]);
        }

        return response()->json(['conflict' => false, 'conflict_message' => null]);
    }
}
