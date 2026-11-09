<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice->invoice_number }} - PNJ PRIME</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px 20px;
        }
        .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 24px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #0284c7;
            margin: 0 0 6px 0;
        }
        .header .subtitle {
            font-size: 13px;
            color: #64748b;
        }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            border-radius: 9999px;
            letter-spacing: 0.05em;
        }
        .badge-unpaid { background-color: #fef3c7; color: #b45309; }
        .badge-paid { background-color: #dcfce7; color: #15803d; }
        .badge-cancelled { background-color: #fee2e2; color: #b91c1c; }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 30px;
        }
        .meta-col h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #94a3b8;
            margin: 0 0 8px 0;
            letter-spacing: 0.05em;
        }
        .meta-col p {
            margin: 0 0 4px 0;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            padding: 12px;
            text-align: left;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }
        td {
            padding: 14px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals-table {
            margin-left: auto;
            width: 320px;
            margin-bottom: 30px;
        }
        .totals-table td {
            padding: 8px 12px;
            border: none;
        }
        .totals-table .total-row td {
            font-size: 16px;
            font-weight: 700;
            color: #0284c7;
            border-top: 2px solid #0284c7;
        }
        .footer-note {
            background: #f8fafc;
            border-left: 4px solid #0284c7;
            padding: 16px;
            border-radius: 4px;
            font-size: 13px;
            color: #475569;
            margin-top: 20px;
        }
        .actions-bar {
            max-width: 800px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn {
            display: inline-block;
            background: #0284c7;
            color: white;
            padding: 8px 18px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border: none;
        }
        .btn:hover { background: #0369a1; }
        .btn-outline {
            background: transparent;
            color: #64748b;
            border: 1px solid #cbd5e1;
        }
        .btn-outline:hover { background: #f1f5f9; }
        @media print {
            body { background: white; padding: 0; }
            .invoice-card { box-shadow: none; padding: 0; }
            .actions-bar { display: none; }
        }
    </style>
</head>
<body>
    <div class="actions-bar">
        <a href="javascript:history.back()" class="btn btn-outline">&larr; Kembali</a>
        <button onclick="window.print()" class="btn">Cetak Invoice</button>
    </div>

    <div class="invoice-card">
        <div class="header">
            <div>
                <h1>PNJ PRIME &mdash; INVOICE RESMI</h1>
                <div class="subtitle">Unit Pengelola Usaha & Bisnis (RTPU) — Politeknik Negeri Jakarta</div>
                <div class="subtitle">Jl. Prof. Dr. G.A. Siwabessy, Kampus UI Depok 16425</div>
            </div>
            <div style="text-align: right;">
                <span class="badge badge-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span>
                <div style="margin-top: 10px; font-weight: 700; font-size: 16px;">{{ $invoice->invoice_number }}</div>
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
            <p style="margin: 6px 0 0 0;">
                Pembayaran dapat dilakukan melalui gerbang pembayaran resmi PNJ PRIME (Midtrans) atau transfer ke Rekening BLU Politeknik Negeri Jakarta.
                Invoice ini sah dan diterbitkan secara digital oleh sistem resmi PNJ PRIME.
            </p>
            @if($invoice->notes)
                <p style="margin: 6px 0 0 0; font-style: italic;">
                    "{{ $invoice->notes }}"
                </p>
            @endif
        </div>
    </div>
</body>
</html>
