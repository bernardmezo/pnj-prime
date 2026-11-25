<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PickupReady extends Notification implements ShouldQueue
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
        return (new MailMessage)->subject('Barang siap diambil — '.$this->pengajuan->code)
            ->line('Barang pesanan '.$this->pengajuan->code.' siap diambil di PNJ pada pukul 08.00–16.00 WIB.')
            ->action('Lihat pesanan', route('customer.pengajuan.show', $this->pengajuan));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Barang siap diambil',
            'message' => 'Barang pesanan '.$this->pengajuan->code.' siap diambil di PNJ (08.00-16.00 WIB).',
            'url' => route('customer.pengajuan.show', $this->pengajuan),
            'code' => $this->pengajuan->code,
        ];
    }
}
