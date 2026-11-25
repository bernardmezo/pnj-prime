<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Services\MonitoringData;
use Inertia\Inertia;
use Inertia\Response;

class PemantauanController extends Controller
{
    public function monitor(MonitoringData $data): Response
    {
        return Inertia::render('Direktur/Pemantauan', ['produk' => $data->productSales()]);
    }

    public function riwayat(MonitoringData $data): Response
    {
        return Inertia::render('Direktur/Riwayat', ['riwayat' => $data->history()]);
    }
}
