<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $owner_id
 * @property int $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $short_description
 * @property string|null $description
 * @property string|null $thumbnail
 * @property int $base_price
 * @property int $final_price
 * @property string $curation_status
 * @property string|null $rejection_reason
 * @property Carbon|null $approved_at
 * @property int|null $approved_by
 * @property int|null $stock
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property array<array-key, mixed>|null $meta
 * @property int|null $produk_unggulan_id
 * @property int|null $tax_rate_id
 * @property-read User|null $approver
 * @property-read ProductCategory $category
 * @property-read Collection<int, Opsi> $opsi
 * @property-read int|null $opsi_count
 * @property-read Collection<int, OrderItem> $orderItems
 * @property-read int|null $order_items_count
 * @property-read User $owner
 * @property-read TaxRate|null $taxRate
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereApprovedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereApprovedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereBasePrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereCategoryId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereCurationStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereFinalPrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereMeta($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereOwnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereProdukUnggulanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereShortDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereStock($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereTaxRateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereThumbnail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Product withoutTrashed()
 *
 * @mixin \Eloquent
 */
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'category_id',
        'target_audience',
        'name',
        'slug',
        'short_description',
        'description',
        'thumbnail',
        'images',
        'video_url',
        'video_path',
        'base_price',
        'final_price',
        'curation_status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'stock',
        'is_active',
        'tax_rate_id',
        'meta',
        'produk_unggulan_id',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'integer',
            'final_price' => 'integer',
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
            'stock' => 'integer',
            'images' => 'array',
            'meta' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function opsi(): MorphMany
    {
        return $this->morphMany(Opsi::class, 'opsi');
    }

    /**
     * Layanan type derived from the owning category slug: jasa|ruangan|produk.
     */
    public function layananTipe(): string
    {
        $slug = $this->category?->slug ?? '';

        return str_contains($slug, 'jasa') ? 'jasa'
            : (str_contains($slug, 'sewa') || str_contains($slug, 'fasilitas') ? 'ruangan' : 'produk');
    }

    /**
     * Base pricing unit for a listing: ruangan is quoted per hari by default,
     * or per jam when its meta says so. Jasa/produk are always per unit.
     */
    public function layananSatuan(): string
    {
        if ($this->layananTipe() !== 'ruangan') {
            return 'per_unit';
        }

        return ($this->meta['satuan'] ?? 'hari') === 'jam' ? 'per_jam' : 'per_hari';
    }

    public function isApproved(): bool
    {
        return $this->curation_status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->curation_status === 'pending';
    }

    public function isVerified(): bool
    {
        return $this->curation_status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->curation_status === 'rejected';
    }

    public function isDraft(): bool
    {
        return $this->curation_status === 'draft';
    }
}
