<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Services\DirekturSummaryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Dashboard ringkasan Direktorat. Read-only: hanya GET, dan data hanya agregat.
 */
class DashboardController extends Controller
{
    public function __construct(private DirekturSummaryService $summary) {}

    public function __invoke(Request $request): Response
    {
        [$from, $to] = $this->range($request);

        return Inertia::render('Direktur/Dashboard', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'preset' => $request->query('preset'),
                // true bila tanpa parameter sama sekali (tampilan awal 30 hari).
                'isDefault' => ! $request->hasAny(['preset', 'from', 'to']),
            ],
            // Dimuat setelah halaman tampil agar skeleton bisa muncul di klien.
            'summary' => Inertia::defer(fn () => $this->summary->summary($from, $to)),
        ]);
    }

    /**
     * Ekspor CSV ringkasan (baca saja). Format selaras dengan filter aktif.
     */
    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->range($request);
        $data = $this->summary->summary($from, $to);
        $filename = 'ringkasan-direktorat-'.$from->toDateString().'_'.$to->toDateString().'.csv';

        return response()->streamDownload(function () use ($data, $from, $to) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
            $put = fn (array $row) => fputcsv($out, array_map([$this, 'safeCell'], $row));

            $put(['Ringkasan Direktorat PNJ Prime']);
            $put(['Periode', $from->toDateString(), $to->toDateString()]);
            $put([]);
            $put(['PENJUALAN (order selesai)']);
            $put(['Jumlah transaksi', $data['sales']['kpi']['transaksi']]);
            $put(['Omzet total (termasuk pajak)', $data['sales']['kpi']['omzet_total']]);
            $put(['Omzet sebelum pajak', $data['sales']['kpi']['omzet_subtotal']]);
            $put([]);
            $put(['Periode', 'Transaksi', 'Omzet total']);
            foreach ($data['sales']['series'] as $r) {
                $put([$r['label'], $r['transaksi'], $r['total']]);
            }
            $put([]);
            $put(['Kategori', 'Jumlah terjual', 'Penjualan sebelum pajak']);
            foreach ($data['sales']['per_kategori'] as $r) {
                $put([$r['kategori'], $r['qty'], $r['total']]);
            }
            $put([]);
            $put(['10 produk terlaris', 'Jumlah terjual', 'Penjualan sebelum pajak']);
            foreach ($data['sales']['terlaris'] as $r) {
                $put([$r['nama'], $r['qty'], $r['total']]);
            }
            $put([]);
            $put(['ALUR PRODUK', 'Jumlah']);
            foreach ($data['funnel']['tahap'] as $r) {
                $put([$r['label'], $r['jumlah']]);
            }
            $put([]);
            $put(['AKUN TERDAFTAR', 'Jumlah']);
            foreach ($data['accounts']['per_role'] as $r) {
                $put([$r['label'], $r['jumlah']]);
            }
            $put([]);
            $put(['Pendaftaran per bulan', 'Jumlah']);
            foreach ($data['accounts']['pertumbuhan'] as $r) {
                $put([$r['label'], $r['jumlah']]);
            }
            $put([]);
            $put(['NEGOSIASI HARGA (sedang berjalan)', $data['negotiation']['berjalan']]);
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Cegah CSV/formula injection: sel teks diawali = + - @ diberi tanda kutip.
     */
    private function safeCell(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    /**
     * Rentang tanggal tervalidasi. Default: 30 hari terakhir. Preset "tahun"
     * = tahun berjalan. Input tidak valid ditolak (422 untuk Inertia).
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function range(Request $request): array
    {
        $validated = Validator::make($request->query(), [
            'preset' => ['nullable', 'in:30hari,tahun,90hari'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ], [
            'from.date_format' => 'Tanggal awal tidak valid.',
            'to.date_format' => 'Tanggal akhir tidak valid.',
            'to.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal awal.',
            'preset.in' => 'Pilihan periode tidak dikenal.',
        ])->validate();

        $today = now()->startOfDay();

        if (! empty($validated['from']) && ! empty($validated['to'])) {
            $from = Carbon::createFromFormat('Y-m-d', $validated['from'])->startOfDay();
            $to = Carbon::createFromFormat('Y-m-d', $validated['to'])->startOfDay();
        } else {
            $preset = $validated['preset'] ?? '30hari';
            $to = $today->copy();
            $from = match ($preset) {
                'tahun' => $today->copy()->startOfYear(),
                '90hari' => $today->copy()->subDays(89),
                default => $today->copy()->subDays(29),
            };
        }

        abort_if(
            $from->diffInDays($to) > DirekturSummaryService::MAX_RANGE_DAYS,
            422,
            'Rentang tanggal maksimal 2 tahun.'
        );

        return [$from, $to];
    }
}
