<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ProdukUnggulan extends Model
{
    protected $table = 'produk_unggulan';

    protected $fillable = [
        'code', 'owner_id', 'name', 'description', 'researcher', 'team',
        'category', 'price', 'documents', 'status', 'catatan', 'history',
    ];

    protected function casts(): array
    {
        return ['documents' => 'array', 'history' => 'array', 'price' => 'integer'];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function opsi(): MorphMany
    {
        return $this->morphMany(Opsi::class, 'opsi');
    }

    public function pushHistory(string $status, ?string $note = null, ?string $by = null): void
    {
        $history = $this->history ?? [];
        $history[] = [
            'from' => $this->status,
            'status' => $status,
            'at' => now()->format('Y-m-d H:i'),
            'note' => $note,
            'by' => $by,
        ];
        $this->history = $history;
    }

    public function setStatus(string $status, ?string $note = null, ?string $by = null): void
    {
        $this->pushHistory($status, $note, $by);
        $this->status = $status;
    }
}
