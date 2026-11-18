<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\JasaProgressUpdated;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Pemenuhan jasa / test lab oleh Admin Pengelola (tanpa ongkir dan stok).
 * Alur: Lunas -> Diproses -> Dijadwalkan -> Dikerjakan -> Hasil Diunggah -> Selesai
 * (Customer dapat meminta revisi: Hasil Diunggah -> Dikerjakan, maksimal Pengajuan::MAX_REVISIONS kali).
 */
class JasaFulfillment
{
    public const ALLOWED_MIMES = 'pdf,docx,xlsx,jpg,jpeg,png,zip';

    public const MAX_FILES = 5;

    public const MAX_KB = 20480; // 20 MB per file

    public function handle(Pengajuan $p, Request $request, PengajuanWorkflow $workflow): void
    {
        $status = $request->input('status');
        $actor = $request->user()->name;

        match ($status) {
            'Diproses' => $this->start($p, $workflow, $actor),
            'Dijadwalkan' => $this->schedule($p, $request, $workflow, $actor),
            'Dikerjakan' => $this->work($p, $workflow, $actor),
            'Hasil Diunggah' => $this->uploadResult($p, $request, $workflow, $actor),
            default => throw ValidationException::withMessages(['status' => 'Tindakan tidak dikenali untuk pesanan jasa.']),
        };
    }

    private function expect(Pengajuan $p, string $from, string $message): void
    {
        if ($p->status !== $from) {
            throw ValidationException::withMessages(['status' => $message]);
        }
    }

    private function start(Pengajuan $p, PengajuanWorkflow $workflow, string $actor): void
    {
        $this->expect($p, 'Lunas', 'Pesanan telah berubah. Muat ulang halaman.');
        $workflow->transition($p, 'Diproses', 'Pesanan jasa mulai ditindaklanjuti pemilik layanan.', $actor);
    }

    private function schedule(Pengajuan $p, Request $request, PengajuanWorkflow $workflow, string $actor): void
    {
        $this->expect($p, 'Diproses', 'Mulai proses pesanan sebelum menetapkan jadwal. Muat ulang halaman.');

        $data = $request->validate([
            'jadwal_mulai' => 'required|date|after_or_equal:today',
            'jadwal_selesai' => 'required|date|after_or_equal:jadwal_mulai',
        ], [
            'jadwal_mulai.required' => 'Tanggal mulai pengerjaan wajib diisi.',
            'jadwal_mulai.after_or_equal' => 'Tanggal mulai tidak boleh di masa lalu.',
            'jadwal_selesai.required' => 'Perkiraan selesai wajib diisi.',
            'jadwal_selesai.after_or_equal' => 'Perkiraan selesai tidak boleh lebih awal dari tanggal mulai.',
        ]);

        $p->jadwal_mulai = $data['jadwal_mulai'];
        $p->jadwal_selesai = $data['jadwal_selesai'];
        $p->save();
        $p->refresh();

        $workflow->transition(
            $p,
            'Dijadwalkan',
            'Jadwal pengerjaan: '.$p->jadwal_mulai->locale('id')->translatedFormat('d F Y H:i').' sampai '.$p->jadwal_selesai->locale('id')->translatedFormat('d F Y H:i').'.',
            $actor,
        );
        $p->buyer?->notify(new JasaProgressUpdated($p, 'scheduled'));
    }

    private function work(Pengajuan $p, PengajuanWorkflow $workflow, string $actor): void
    {
        $this->expect($p, 'Dijadwalkan', 'Tetapkan jadwal pengerjaan terlebih dahulu. Muat ulang halaman.');
        $workflow->transition($p, 'Dikerjakan', 'Pengerjaan dimulai.', $actor);
    }

    private function uploadResult(Pengajuan $p, Request $request, PengajuanWorkflow $workflow, string $actor): void
    {
        $this->expect($p, 'Dikerjakan', 'Pesanan belum berstatus Dikerjakan. Muat ulang halaman.');

        $request->validate([
            'hasil_files' => 'required|array|min:1|max:'.self::MAX_FILES,
            'hasil_files.*' => 'file|mimes:'.self::ALLOWED_MIMES.'|max:'.self::MAX_KB,
        ], [
            'hasil_files.required' => 'Unggah minimal satu berkas hasil.',
            'hasil_files.max' => 'Maksimal '.self::MAX_FILES.' berkas per unggahan.',
            'hasil_files.*.mimes' => 'Format berkas harus PDF, DOCX, XLSX, JPG, PNG, atau ZIP.',
            'hasil_files.*.max' => 'Ukuran tiap berkas maksimal 20 MB.',
            'hasil_files.*.file' => 'Berkas gagal diunggah. Coba lagi.',
        ]);

        $round = (int) $p->revision_count;
        $stored = [];
        foreach ($request->file('hasil_files') as $file) {
            $stored[] = [
                'path' => $file->store('hasil-jasa/'.$p->id, 'local'),
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'round' => $round,
                'uploaded_at' => now()->toDateTimeString(),
            ];
        }
        $p->hasil_files = array_merge($p->hasil_files ?? [], $stored);
        $p->save();
        $p->refresh();

        $workflow->transition(
            $p,
            'Hasil Diunggah',
            count($stored).' berkas hasil diunggah'.($round > 0 ? ' (revisi ke-'.$round.')' : '').'.',
            $actor,
        );
        $p->buyer?->notify(new JasaProgressUpdated($p, 'result'));
    }
}
