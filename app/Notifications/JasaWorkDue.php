<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JasaWorkDue extends Notification implements ShouldQueue
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

    private function urlFor(object $notifiable): string
    {
        return route($notifiable->role === 'admin_rtpu' ? 'rtpu.pesanan.index' : 'pengelola.pesanan.index');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Pengerjaan jasa dimulai — '.$this->pengajuan->code)
            ->line('Jadwal pengerjaan jasa telah tiba. Silakan kerjakan pesanan '.$this->pengajuan->code.'.')
            ->action('Lihat pesanan', $this->urlFor($notifiable));
    }

    public function toArray(object $notifiable): array
    {
        return ['title' => 'Pengerjaan jasa dimulai', 'message' => 'Silakan kerjakan pesanan '.$this->pengajuan->code.'.', 'url' => $this->urlFor($notifiable), 'code' => $this->pengajuan->code];
    }
}
