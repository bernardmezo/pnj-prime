<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PesananDiverifikasi extends Notification implements ShouldQueue
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
        $p = $this->pengajuan->loadMissing(['product', 'order']);
        $msg = (new MailMessage)
            ->subject('Pesanan diverifikasi — '.$p->code)
            ->greeting('Halo, '.$notifiable->name)
            ->line('Pengajuan Anda telah diverifikasi oleh Admin RTPU. Silakan selesaikan pembayaran untuk melanjutkan proses pesanan.');

        if ($p->product) {
            $msg->line('Produk/Layanan: '.$p->product->name);
        }
        $msg->line('Kode pengajuan: '.$p->code);

        if ($p->order) {
            $msg->line('Total tagihan: Rp '.number_format($p->order->total, 0, ',', '.'));
        }

        return $msg->action('Bayar sekarang', route('customer.pengajuan.bayar', $p->id));
    }

    public function toArray(object $notifiable): array
    {
        $p = $this->pengajuan;
        return [
            'title' => 'Pesanan diverifikasi',
            'message' => 'Pengajuan '.$p->code.' telah diverifikasi Admin RTPU. Silakan lakukan pembayaran.',
            'url' => route('customer.pengajuan.bayar', $p->id),
            'code' => $p->code,
        ];
    }
}
