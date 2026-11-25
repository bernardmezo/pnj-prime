<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerPaymentConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Pengajuan $pengajuan)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $p = $this->pengajuan->loadMissing(['product', 'buyer']);
        $invoice = $p->latestInvoice;

        $msg = (new MailMessage)
            ->subject('Pembayaran dikonfirmasi — Pesanan '.$p->code)
            ->line('Pembayaran Anda untuk pesanan ini telah dikonfirmasi.');

        if ($p->product) {
            $msg->line('Produk: '.($p->product->name ?? 'Layanan '.ucfirst($p->tipe)));
        }

        if ($invoice) {
            $msg->line('Invoice: '.$invoice->invoice_number);
            $msg->line('Total: Rp '.number_format($invoice->total, 0, ',', '.'));
        }

        $msg->line('Kode pengajuan: '.$p->code);

        return $msg->action('Lihat pesanan', route('customer.pengajuan.show', $p));
    }

    public function toArray(object $notifiable): array
    {
        $p = $this->pengajuan->loadMissing(['product']);
        return [
            'title' => 'Pembayaran dikonfirmasi',
            'message' => 'Pembayaran pesanan '.$p->code.' telah dikonfirmasi. Produk siap disiapkan oleh pemilik.',
            'url' => route('customer.pengajuan.show', $p),
            'code' => $p->code,
        ];
    }
}