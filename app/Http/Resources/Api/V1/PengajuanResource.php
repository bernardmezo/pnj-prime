<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Pengajuan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Pengajuan
 */
class PengajuanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'tipe' => $this->tipe,
            'status' => $this->status,
            'total_biaya' => (float) $this->total_biaya,
            'total_biaya_formatted' => 'Rp '.number_format((float) $this->total_biaya, 0, ',', '.'),
            'tanggal_mulai' => $this->tanggal_mulai?->format('Y-m-d'),
            'tanggal_selesai' => $this->tanggal_selesai?->format('Y-m-d'),
            'jumlah_peserta' => $this->jumlah_peserta,
            'catatan' => $this->catatan,
            'product' => new ProductResource($this->whenLoaded('product')),
            'buyer' => new UserResource($this->whenLoaded('buyer')),
            'order' => new OrderResource($this->whenLoaded('order')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
