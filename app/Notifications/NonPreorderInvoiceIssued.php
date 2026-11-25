<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NonPreorderInvoiceIssued extends Notification implements ShouldQueue
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
        $p = $this->invoice->pengajuan;
        $msg = (new MailMessage)
            ->subject('Invoice diterbitkan — '.$this->invoice->invoice_number)
            ->line('Invoice telah diterbitkan untuk pesanan Anda.');

        if ($p->product) {
            $msg->line('Produk: '.$p->product->name);
            if ($p->jumlah) {
                $msg->line('Jumlah: '.($p->jumlah == 1 ? '1 unit' : $p->jumlah.' units'));
            }
        }

        $msg->line('Total: Rp '.number_format($this->invoice->total, 0, ',', '.'));

        // Add due date if available
        if ($this->invoice->due_at) {
            $msg->line('Jatuh tempo: '.$this->invoice->due_at->format('d F Y'));
        }

        // Add shipping info if applicable
        if ($p->courier_name) {
            $msg->line('Kurir: '.$p->courier_name);
            $msg->line('Resi: '.$p->tracking_number);
        }

        return $msg->action('Lihat invoice', route('customer.pengajuan.invoice', $p->id));
    }

    public function toArray(object $notifiable): array
    {
        $p = $this->invoice->pengajuan;
        return [
            'title' => 'Invoice diterbitkan',
            'message' => 'Invoice '.$this->invoice->invoice_number.' diterbitkan untuk pesanan '.$p->code.'. Total: Rp '.number_format($this->invoice->total, 0, ',', '.'),
            'url' => route('customer.pengajuan.invoice', $p->id),
            'invoice_number' => $this->invoice->invoice_number,
            'code' => $p->code,
        ];
    }
}