<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $otp
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode Verifikasi Reset Password PNJ PRIME')
            ->greeting('Halo!')
            ->line('Berikut adalah kode verifikasi untuk mengatur ulang password Anda:')
            ->line('')
            ->line('')
            ->line('**' . $this->otp . '**')
            ->line('')
            ->line('Kode ini berlaku selama 10 menit.')
            ->line('Jika Anda tidak meminta reset password, abaikan email ini.')
            ->salutation('Salam, PNJ PRIME');
    }
}
