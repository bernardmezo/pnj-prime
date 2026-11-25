<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ScheduleReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Pengajuan $pengajuan, public string $recipient = 'customer')
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $p = $this->pengajuan;
        $start = $p->rental_start ?? $p->jadwal_mulai;
        $subject = $p->isRental() ? 'Pengingat jadwal sewa H-1' : 'Pengingat jadwal jasa H-1';

        return (new MailMessage)
            ->subject($subject.' — '.$p->code)
            ->line('Jadwal Anda akan dimulai besok.')
            ->line('Layanan: '.$p->product?->name)
            ->line('Mulai: '.$start?->locale('id')->translatedFormat('d F Y H:i'))
            ->action('Lihat pesanan', $this->urlFor($notifiable));
    }

    private function urlFor(object $notifiable): string
    {
        return (string) $notifiable->getKey() === (string) $this->pengajuan->buyer_id
            ? route('customer.pengajuan.show', $this->pengajuan)
            : route($notifiable->role === 'admin_rtpu' ? 'rtpu.pesanan.index' : 'pengelola.pesanan.index');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pengingat jadwal H-1',
            'message' => 'Jadwal '.$this->pengajuan->code.' dimulai besok.',
            'url' => $this->urlFor($notifiable),
            'code' => $this->pengajuan->code,
        ];
    }
}
