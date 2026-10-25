<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'base_price' => (float) $this->base_price,
            'final_price' => (float) ($this->final_price ?? $this->base_price),
            'price_formatted' => 'Rp '.number_format((float) ($this->final_price ?? $this->base_price), 0, ',', '.'),
            'stock' => $this->stock,
            'thumbnail' => $this->thumbnail,
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
            'curation_status' => $this->curation_status,
            'tax_rate_id' => $this->tax_rate_id,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
