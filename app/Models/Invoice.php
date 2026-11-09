<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $invoice_number
 * @property int $pengajuan_id
 * @property int|null $order_id
 * @property int|null $issued_by
 * @property Carbon $issued_at
 * @property Carbon|null $due_at
 * @property int $subtotal
 * @property numeric $tax_rate_snapshot
 * @property int $tax_amount
 * @property int $total
 * @property string $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Pengajuan $pengajuan
 * @property-read Order|null $order
 * @property-read User|null $issuer
 * @property-read Collection<int, InvoiceLine> $lines
 * @property-read int|null $lines_count
 *
 * @mixin \Eloquent
 */
class Invoice extends Model
{
    use HasFactory;

    protected $table = 'invoices';

    protected $fillable = [
        'invoice_number',
        'pengajuan_id',
        'order_id',
        'issued_by',
        'issued_at',
        'due_at',
        'subtotal',
        'tax_rate_snapshot',
        'tax_amount',
        'total',
        'status',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'due_at' => 'datetime',
            'subtotal' => 'integer',
            'tax_rate_snapshot' => 'decimal:2',
            'tax_amount' => 'integer',
            'total' => 'integer',
        ];
    }

    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class, 'pengajuan_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class, 'invoice_id');
    }
}
