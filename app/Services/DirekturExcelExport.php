<?php

namespace App\Services;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DirekturExcelExport
{
    public function build(array $data, Carbon $from, Carbon $to): Spreadsheet
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet();
        $sheet->setTitle('Ringkasan');
        $sheet->mergeCells('A1:C1');
        $sheet->setCellValue('A1', 'Ringkasan Direktorat PNJ Prime');
        $sheet->setCellValue('A2', 'Periode: '.$from->toDateString().' sampai '.$to->toDateString());
        $sheet->fromArray([
            ['Penjualan (pesanan selesai)', 'Jumlah'],
            ['Jumlah transaksi', $data['sales']['kpi']['transaksi']],
            ['Omzet total (termasuk pajak)', $data['sales']['kpi']['omzet_total']],
            ['Omzet sebelum pajak', $data['sales']['kpi']['omzet_subtotal']],
        ], null, 'A4');
        $sheet->getStyle('B6:B7')->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getColumnDimension('A')->setWidth(38);
        $sheet->getColumnDimension('B')->setWidth(22);
        $sheet->getColumnDimension('C')->setWidth(28);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FF005F6E');
        $this->header($sheet, 'A4:B4');

        $sections = [
            ['Tren Penjualan', ['Periode', 'Transaksi', 'Omzet total'], $data['sales']['series'], ['label', 'transaksi', 'total']],
            ['Kategori', ['Kategori', 'Jumlah terjual', 'Penjualan sebelum pajak'], $data['sales']['per_kategori'], ['kategori', 'qty', 'total']],
            ['Produk Terlaris', ['Produk', 'Jumlah terjual', 'Penjualan sebelum pajak'], $data['sales']['terlaris'], ['nama', 'qty', 'total']],
            ['Alur Produk', ['Tahap', 'Jumlah'], $data['funnel']['tahap'], ['label', 'jumlah']],
            ['Akun', ['Peran', 'Jumlah'], $data['accounts']['per_role'], ['label', 'jumlah']],
            ['Pendaftaran', ['Bulan', 'Jumlah'], $data['accounts']['pertumbuhan'], ['label', 'jumlah']],
        ];

        foreach ($sections as [$name, $headers, $rows, $keys]) {
            $tab = $book->createSheet()->setTitle($name);
            $tab->fromArray($headers, null, 'A1');
            $this->header($tab, 'A1:'.(count($headers) === 3 ? 'C' : 'B').'1');
            foreach ($rows as $index => $row) {
                foreach ($keys as $column => $key) {
                    $cell = chr(65 + $column).($index + 2);
                    $value = $row[$key] ?? '';
                    if (is_string($value)) {
                        $tab->setCellValueExplicit($cell, $value, DataType::TYPE_STRING);
                    } else {
                        $tab->setCellValue($cell, $value);
                    }
                }
            }
            $tab->freezePane('A2');
            $tab->getColumnDimension('A')->setWidth(36);
            $tab->getColumnDimension('B')->setWidth(22);
            $tab->getColumnDimension('C')->setWidth(30);
            if (count($rows) > 0 && in_array($name, ['Tren Penjualan', 'Kategori'], true)) {
                $this->chart($tab, $name, count($rows), $name === 'Kategori');
            }
        }
        $book->setActiveSheetIndex(0);

        return $book;
    }

    private function header(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF005F6E']],
        ]);
    }

    private function chart(Worksheet $sheet, string $name, int $count, bool $pie): void
    {
        $end = $count + 1;
        $quoted = "'".str_replace("'", "''", $name)."'";
        $labels = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, $quoted.'!$A$2:$A$'.$end, null, $count)];
        $values = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, $quoted.'!$C$2:$C$'.$end, null, $count)];
        $series = new DataSeries($pie ? DataSeries::TYPE_PIECHART : DataSeries::TYPE_LINECHART, null, [0], [], $labels, $values);
        $chart = new Chart('chart_'.($pie ? 'kategori' : 'tren'), new Title($pie ? 'Penjualan per kategori (sebelum pajak)' : 'Tren omzet total'), new Legend(Legend::POSITION_RIGHT), new PlotArea(null, [$series]));
        $chart->setTopLeftPosition('E2');
        $chart->setBottomRightPosition('N18');
        $sheet->addChart($chart);
    }
}
