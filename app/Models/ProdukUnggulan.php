<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property int $owner_id
 * @property string $name
 * @property string|null $description
 * @property string|null $researcher
 * @property string|null $team
 * @property string|null $category
 * @property int|null $price
 * @property array<array-key, mixed>|null $documents
 * @property string $status
 * @property string|null $catatan
 * @property array<array-key, mixed>|null $history
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Opsi> $opsi
 * @property-read int|null $opsi_count
 * @property-read User $owner
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereCatatan($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereDocuments($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereHistory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereOwnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan wherePrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereResearcher($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereTeam($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProdukUnggulan whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
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
