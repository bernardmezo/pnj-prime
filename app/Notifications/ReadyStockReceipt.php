<?php

namespace App\Notifications;

use App\Models\Invoice;
use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi kwitansi pembelian untuk pesanan ready stock (Jalur B)
 * yang sudah selesai. Dikirim ke customer berserta info kurir bila ada.
 */
class ReadyStockReceipt extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invoice $invoice)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $p = $this->invoice->pengajuan;
        $msg = (new MailMessage)
            ->subject('Kwitansi Pembelian — '.$this->invoice->invoice_number)
            ->line('Pesanan Anda telah selesai. Berikut rincian pembelian:')
            ->line('Nomor pesanan: '.$p->code)
            ->line('Total dibayar: Rp '.number_format($this->invoice->total, 0, ',', '.'));

        // Info kurir bila dikirim via ekspedisi
        if ($p->courier_name) {
            $msg->line('Kurir: '.$p->courier_name);
            $msg->line('Nomor resi: '.$p->tracking_number);
        }

        return $msg->action('Lihat invoice', route('customer.pengajuan.invoice', $p->id));
    }
}
