<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PreorderInvoiceIssued extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invoice $invoice)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $bank = $this->invoice->bank_snapshot;

        return (new MailMessage)->subject('Invoice pre-order BLU — '.$this->invoice->invoice_number)
            ->line('Pengajuan pre-order disetujui. Silakan transfer sesuai invoice resmi.')
            ->line('Total transfer tepat: Rp '.number_format($this->invoice->total, 0, ',', '.'))
            ->line('Bank: '.$bank['name'].'; rekening: '.$bank['account'].'; atas nama: '.$bank['holder'])
            ->line('Total sudah termasuk nominal unik tambahan bebas pajak. Unggah bukti transfer untuk verifikasi RTPU.')
            ->action('Lihat invoice', route('customer.pengajuan.invoice', $this->invoice->pengajuan_id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Invoice pre-order diterbitkan',
            'message' => 'Invoice '.$this->invoice->invoice_number.' siap dibayar. Total: Rp '.number_format($this->invoice->total, 0, ',', '.'),
            'url' => route('customer.pengajuan.invoice', $this->invoice->pengajuan_id),
            'invoice_number' => $this->invoice->invoice_number,
        ];
    }
}
