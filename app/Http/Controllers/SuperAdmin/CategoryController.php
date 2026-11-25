<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $parents = ProductCategory::with(['children' => fn($q) => $q->withCount('products')])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'name'     => $p->name,
                'slug'     => $p->slug,
                'is_active'=> $p->is_active,
                'children' => $p->children->map(fn($c) => [
                    'id'            => $c->id,
                    'name'          => $c->name,
                    'parent_id'     => $c->parent_id,
                    'slug'          => $c->slug,
                    'is_active'     => $c->is_active,
                    'sort_order'    => $c->sort_order,
                    'products_count'=> $c->products_count,
                ]),
            ]);

        return Inertia::render('SuperAdmin/Kategori/Index', ['parents' => $parents]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:100', $this->uniqueSlugRule()],
            'parent_id' => 'required|exists:product_categories,id',
            'sort_order'=> 'nullable|integer|min:0',
        ]);

        // Pastikan parent adalah level-1 (parent_id NULL)
        $parent = ProductCategory::findOrFail($data['parent_id']);
        if ($parent->parent_id !== null) {
            return back()->withErrors(['parent_id' => 'Parent harus kategori level-1 (tipe).']);
        }

        ProductCategory::create([
            'name'       => $data['name'],
            'slug'       => Str::slug($data['name']),
            'parent_id'  => $data['parent_id'],
            'is_active'  => true,
            'sort_order' => $data['sort_order'] ?? 50,
        ]);

        return back()->with('success', 'Sub-kategori berhasil ditambahkan.');
    }

    public function update(Request $request, ProductCategory $category): RedirectResponse
    {
        // Hanya sub-kategori yang bisa diubah via UI ini
        if ($category->parent_id === null) {
            return back()->withErrors(['category' => 'Kategori tipe tidak dapat diubah dari sini.']);
        }

        $data = $request->validate([
            'name'       => ['required', 'string', 'max:100', $this->uniqueSlugRule($category)],
            'parent_id'  => 'sometimes|required|exists:product_categories,id',
            'is_active'  => 'required|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        if (isset($data['parent_id']) && ProductCategory::findOrFail($data['parent_id'])->parent_id !== null) {
            return back()->withErrors(['parent_id' => 'Parent harus kategori level-1 (tipe).']);
        }

        $category->update([
            'name'       => $data['name'],
            'parent_id'  => $data['parent_id'] ?? $category->parent_id,
            'slug'       => Str::slug($data['name']),
            'is_active'  => $data['is_active'],
            'sort_order' => $data['sort_order'] ?? $category->sort_order,
        ]);

        return back()->with('success', 'Sub-kategori berhasil diperbarui.');
    }

    public function toggle(ProductCategory $category): RedirectResponse
    {
        if ($category->parent_id === null) {
            return back()->withErrors(['category' => 'Kategori tipe tidak dapat dinonaktifkan.']);
        }

        $category->update(['is_active' => ! $category->is_active]);

        return back()->with('success', $category->is_active ? 'Sub-kategori diaktifkan.' : 'Sub-kategori dinonaktifkan.');
    }

    private function uniqueSlugRule(?ProductCategory $ignore = null): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($ignore): void {
            $slug = Str::slug((string) $value);

            if ($slug === '') {
                $fail('Nama kategori harus mengandung huruf atau angka.');

                return;
            }

            $exists = ProductCategory::where('slug', $slug)
                ->when($ignore, fn ($q) => $q->whereKeyNot($ignore->getKey()))
                ->exists();

            if ($exists) {
                $fail('Nama kategori sudah dipakai.');
            }
        };
    }
}
