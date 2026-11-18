<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JasaProgressUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param 'scheduled'|'result' $event */
    public function __construct(public Pengajuan $pengajuan, public string $event)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $p = $this->pengajuan;
        $mail = new MailMessage;

        if ($this->event === 'scheduled') {
            $mail->subject('Jadwal pengerjaan jasa — '.$p->code)
                ->line('Pesanan jasa '.$p->code.' telah dijadwalkan.')
                ->line('Mulai: '.$p->jadwal_mulai?->locale('id')->translatedFormat('d F Y H:i'))
                ->line('Perkiraan selesai: '.$p->jadwal_selesai?->locale('id')->translatedFormat('d F Y H:i'));
        } else {
            $mail->subject('Hasil pengerjaan tersedia — '.$p->code)
                ->line('Hasil pengerjaan untuk pesanan '.$p->code.' sudah diunggah.')
                ->line('Periksa hasilnya, lalu konfirmasi selesai atau ajukan revisi (maksimal '.Pengajuan::MAX_REVISIONS.' kali).');
        }

        return $mail->action('Lihat pesanan', route('customer.pengajuan.show', $p));
    }
}
