<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'total_amount' => (float) $this->total_amount,
            'total_amount_formatted' => 'Rp '.number_format((float) $this->total_amount, 0, ',', '.'),
            'tax_name_snapshot' => $this->tax_name_snapshot,
            'tax_rate_snapshot' => $this->tax_rate_snapshot !== null ? (float) $this->tax_rate_snapshot : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
