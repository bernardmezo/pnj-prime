<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CatalogController extends Controller
{
    /**
     * Display a paginated listing of curated catalog products.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['category'])
            ->where('is_active', true)
            ->where('curation_status', 'approved');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->query('category'));
            });
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->query('tipe'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                    ->orWhere('description', 'ilike', $search);
            });
        }

        $perPage = (int) $request->query('per_page', 12);
        $perPage = max(1, min(50, $perPage));

        $products = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Display detailed product specifications.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with(['category', 'opsi'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where('curation_status', 'approved')
            ->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan katalog tidak ditemukan atau belum disetujui kurasi.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ], Response::HTTP_OK);
    }
}
