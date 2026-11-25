<?php

namespace App\Notifications;

use App\Models\Pengajuan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProductPaymentReceived extends Notification implements ShouldQueue
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

        return (new MailMessage)
            ->subject('Pembayaran lunas — '.$p->code)
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Pembayaran pesanan produk Anda telah dikonfirmasi lunas. Silakan siapkan pesanan berikut.')
            ->line('Kode pengajuan: '.$p->code)
            ->line('Produk: '.($p->product?->name ?? 'Belum tersedia'))
            ->line('Jumlah: '.($p->jumlah ?? 1))
            ->line('Pemesan: '.($p->buyer?->name ?? 'Belum tersedia'))
            ->line('Telepon pemesan: '.($p->buyer?->phone ?? 'Belum diisi'))
            ->line('Pengiriman / pengambilan: '.($p->metode_pengambilan ?: 'Belum diisi'))
            ->line('Catatan pemesan: '.($p->catatan ?: 'Tidak ada'));
    }

    public function toArray(object $notifiable): array
    {
        $p = $this->pengajuan->loadMissing(['product']);
        return [
            'title' => 'Pembayaran lunas',
            'message' => 'Pesanan '.$p->code.' ('.($p->product?->name ?? 'produk').') telah lunas. Siapkan pesanan.',
            'url' => route($notifiable->role === 'admin_rtpu' ? 'rtpu.pesanan.index' : 'pengelola.pesanan.index'),
            'code' => $p->code,
        ];
    }
}
