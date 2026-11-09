<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Invoice #{{ $invoice->invoice_number }} - PNJ PRIME</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            margin: 0;
            padding: 20px;
        }
        .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 10px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 22px;
            font-weight: 700;
            color: #0284c7;
            margin: 0 0 4px 0;
        }
        .header .subtitle {
            font-size: 12px;
            color: #475569;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            border-radius: 9999px;
            border: 1px solid #cbd5e1;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }
        .meta-col h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin: 0 0 6px 0;
        }
        .meta-col p {
            margin: 0 0 3px 0;
            font-size: 13px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            padding: 10px;
            text-align: left;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals-table {
            margin-left: auto;
            width: 300px;
            margin-bottom: 20px;
        }
        .totals-table td {
            padding: 6px 10px;
            border: none;
        }
        .totals-table .total-row td {
            font-size: 15px;
            font-weight: 700;
            color: #0284c7;
            border-top: 2px solid #0284c7;
        }
        .footer-note {
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 4px;
            font-size: 11px;
            color: #475569;
            margin-top: 20px;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="invoice-card">
        <div class="header">
            <div>
                <h1>PNJ PRIME &mdash; INVOICE RESMI</h1>
                <div class="subtitle">Unit Pengelola Usaha & Bisnis (RTPU) — Politeknik Negeri Jakarta</div>
                <div class="subtitle">Jl. Prof. Dr. G.A. Siwabessy, Kampus UI Depok 16425</div>
            </div>
            <div style="text-align: right;">
                <span class="badge">{{ strtoupper($invoice->status) }}</span>
                <div style="margin-top: 8px; font-weight: 700; font-size: 15px;">{{ $invoice->invoice_number }}</div>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-col">
                <h3>Ditagihkan Kepada</h3>
                <p><strong>{{ $invoice->pengajuan?->buyer?->name ?? 'Pelanggan' }}</strong></p>
                <p>{{ $invoice->pengajuan?->buyer?->email ?? '-' }}</p>
                @if($invoice->pengajuan?->buyer?->phone)
                    <p>Telp: {{ $invoice->pengajuan?->buyer?->phone }}</p>
                @endif
                @if($invoice->pengajuan?->buyer?->institution)
                    <p>Instansi: {{ $invoice->pengajuan?->buyer?->institution }}</p>
                @endif
            </div>
            <div class="meta-col" style="text-align: right;">
                <h3>Informasi Invoice</h3>
                <p><strong>Tanggal Terbit:</strong> {{ optional($invoice->issued_at)->format('d F Y H:i') ?? '-' }}</p>
                <p><strong>Jatuh Tempo:</strong> {{ optional($invoice->due_at)->format('d F Y') ?? '-' }}</p>
                <p><strong>Nomor Pengajuan:</strong> {{ $invoice->pengajuan?->code ?? '-' }}</p>
                @if($invoice->paid_at)
                    <p><strong>Dibayar Pada:</strong> {{ optional($invoice->paid_at)->format('d F Y H:i') }}</p>
                @endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item Deskripsi</th>
                    <th class="text-center">Kuantitas</th>
                    <th class="text-right">Harga Satuan</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @forelse($invoice->lines as $line)
                    <tr>
                        <td>
                            <strong>{{ $line->description }}</strong>
                        </td>
                        <td class="text-center">{{ $line->quantity }}</td>
                        <td class="text-right">Rp {{ number_format($line->unit_price, 0, ',', '.') }}</td>
                        <td class="text-right">Rp {{ number_format($line->amount, 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="text-center" style="color: #94a3b8;">Tidak ada rincian item.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <table class="totals-table">
            <tr>
                <td>Subtotal</td>
                <td class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>PPN ({{ $invoice->tax_rate_snapshot }}%)</td>
                <td class="text-right">Rp {{ number_format($invoice->tax_amount, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td>Total Tagihan</td>
                <td class="text-right">Rp {{ number_format($invoice->total, 0, ',', '.') }}</td>
            </tr>
        </table>

        <div class="footer-note">
            <strong>Catatan & Pembayaran:</strong>
            <p style="margin: 4px 0 0 0;">
                Pembayaran dapat dilakukan melalui gerbang pembayaran resmi PNJ PRIME (Midtrans) atau transfer ke Rekening BLU Politeknik Negeri Jakarta.
                Invoice ini sah dan diterbitkan secara digital oleh sistem resmi PNJ PRIME.
            </p>
            @if($invoice->notes)
                <p style="margin: 4px 0 0 0; font-style: italic;">
                    "{{ $invoice->notes }}"
                </p>
            @endif
        </div>
    </div>
</body>
</html>
