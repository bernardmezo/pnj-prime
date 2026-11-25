<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ScheduleRescheduleRequired extends Notification implements ShouldQueue
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
        return (new MailMessage)
            ->subject('Jadwal perlu diubah — '.$this->pengajuan->code)
            ->line('Jadwal pesanan Anda berada pada tanggal akademik yang tidak tersedia.')
            ->line($this->pengajuan->reschedule_reason)
            ->line($this->isBuyer($notifiable)
                ? 'Tidak ada pembatalan atau pengembalian dana. Silakan pilih tanggal pengganti.'
                : 'Tidak ada pembatalan atau pengembalian dana. Customer perlu memilih tanggal pengganti.')
            ->action($this->isBuyer($notifiable) ? 'Pilih jadwal pengganti' : 'Lihat pesanan', $this->urlFor($notifiable));
    }

    private function isBuyer(object $notifiable): bool
    {
        return (string) $notifiable->getKey() === (string) $this->pengajuan->buyer_id;
    }

    private function urlFor(object $notifiable): string
    {
        return $this->isBuyer($notifiable)
            ? route('customer.pengajuan.show', $this->pengajuan)
            : route($notifiable->role === 'admin_rtpu' ? 'rtpu.pesanan.index' : 'pengelola.pesanan.index');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Jadwal perlu diubah',
            'message' => $this->isBuyer($notifiable)
                ? 'Pilih tanggal pengganti untuk pesanan '.$this->pengajuan->code.'.'
                : 'Pesanan '.$this->pengajuan->code.' memerlukan jadwal pengganti.',
            'url' => $this->urlFor($notifiable),
            'code' => $this->pengajuan->code,
        ];
    }
}
