<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CalculateQuoteApiRequest;
use App\Http\Requests\Api\StorePengajuanApiRequest;
use App\Http\Resources\Api\V1\PengajuanResource;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Services\PricingService;
use App\Services\TaxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PengajuanController extends Controller
{
    public function __construct(
        private readonly PricingService $pricing,
        private readonly TaxService $taxService,
    ) {}

    /**
     * Compute a server-side quote and tax calculation.
     */
    public function quote(CalculateQuoteApiRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $product = Product::with(['category', 'taxRate'])->findOrFail($validated['product_id']);

        $selection = [
            'qty' => 1,
            'peserta' => $validated['jumlah_peserta'] ?? null,
            'jam' => null,
            'addons' => array_map(fn ($id) => ['id' => $id, 'qty' => 1], $validated['opsi_ids'] ?? []),
        ];

        $quote = $this->pricing->quote($product, $selection);
        $taxCalc = $this->taxService->calculate(
            (int) $quote['subtotal'],
            $product->taxRate,
            $product->category?->slug
        );

        return response()->json([
            'success' => true,
            'data' => [
                'quote' => $quote,
                'tax' => $taxCalc,
            ],
        ], Response::HTTP_OK);
    }

    /**
     * List user's pengajuan.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $pengajuans = Pengajuan::query()
            ->with(['product.category', 'order'])
            ->where('buyer_id', $user->id)
            ->latest()
            ->paginate((int) $request->query('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => PengajuanResource::collection($pengajuans),
            'meta' => [
                'current_page' => $pengajuans->currentPage(),
                'last_page' => $pengajuans->lastPage(),
                'total' => $pengajuans->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Store a new pengajuan order.
     */
    public function store(StorePengajuanApiRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $product = null;
        $quote = null;
        if (! empty($validated['product_id'])) {
            $product = Product::with(['category', 'taxRate'])->find($validated['product_id']);
            if ($product) {
                $selection = [
                    'qty' => PricingService::parseQty($validated['jumlah'] ?? null),
                    'peserta' => isset($validated['peserta']) ? (int) $validated['peserta'] : null,
                    'jam' => PricingService::parseHours($validated['jam_mulai'] ?? null, $validated['jam_selesai'] ?? null),
                    'addons' => array_values(array_filter($validated['opsi'] ?? [], fn ($row) => ! empty($row['id']))),
                ];
                $quote = $this->pricing->quote($product, $selection);
            }
        }

        $pengajuan = DB::transaction(function () use ($validated, $user, $quote) {
            $pengajuan = new Pengajuan(Arr::except($validated, ['opsi']));
            $pengajuan->buyer_id = $user->id;
            $pengajuan->status = 'Menunggu Review';
            $pengajuan->dokumen = [];

            if ($quote !== null) {
                $pengajuan->total = $quote['subtotal'];
            }

            $nextId = (int) (Pengajuan::max('id') ?? 0) + 1;
            $pengajuan->code = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) $nextId, 4, '0', STR_PAD_LEFT);
            $pengajuan->save();

            return $pengajuan;
        });

        $pengajuan->load(['product.category', 'buyer', 'order']);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan berhasil dibuat.',
            'data' => new PengajuanResource($pengajuan),
        ], Response::HTTP_CREATED);
    }

    /**
     * View detailed pengajuan record.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $pengajuan = Pengajuan::with(['product.category', 'buyer', 'order'])->find($id);

        if (! $pengajuan) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak ditemukan.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Authorization: only buyer or staff can view
        $isStaff = in_array($user->role, ['super_admin', 'admin_rtpu', 'pimpinan_rtpu', 'direktur'], true);
        if ($pengajuan->buyer_id !== $user->id && ! $isStaff) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki wewenang melihat pengajuan ini.',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'success' => true,
            'data' => new PengajuanResource($pengajuan),
        ], Response::HTTP_OK);
    }
}
