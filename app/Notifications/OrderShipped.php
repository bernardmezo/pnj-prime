<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShipped extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Pengajuan $pengajuan)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Pesanan dikirim — '.$this->pengajuan->code)
            ->line('Pesanan '.$this->pengajuan->code.' telah dikirim melalui '.$this->pengajuan->courier_name.'.')
            ->line('Nomor resi: '.$this->pengajuan->tracking_number)
            ->line('Lacak pengiriman secara manual di situs resmi kurir.')
            ->action('Lihat pesanan', route('customer.pengajuan.show', $this->pengajuan));
    }
}
