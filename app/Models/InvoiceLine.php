<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $invoice_id
 * @property string $item_type
 * @property int|null $item_id
 * @property string $description
 * @property int $quantity
 * @property int $unit_price
 * @property int $amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Invoice $invoice
 *
 * @mixin \Eloquent
 */
class InvoiceLine extends Model
{
    use HasFactory;

    protected $table = 'invoice_lines';

    protected $fillable = [
        'invoice_id',
        'item_type',
        'item_id',
        'description',
        'quantity',
        'unit_price',
        'amount',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'integer',
            'amount' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
