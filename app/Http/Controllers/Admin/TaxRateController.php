<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TaxRate;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaxRateController extends Controller
{
    public function index(): Response
    {
        $rates = TaxRate::with('updater:id,name')
            ->orderBy('id')
            ->get();

        return Inertia::render('Admin/TaxRates/Index', [
            'rates' => $rates,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:tax_rates,code',
            'name' => 'required|string|max:150',
            'rate' => 'required|numeric|min:0|max:100',
            'category' => 'nullable|string|max:50',
            'threshold_amount' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $data['updated_by'] = Auth::id();
        $taxRate = TaxRate::create($data);

        AuditLogger::log('create_tax_rate', $taxRate, $taxRate->id, null, $taxRate->toArray());

        return back()->with('success', 'Tarif pajak berhasil ditambahkan.');
    }

    public function update(Request $request, TaxRate $taxRate)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'rate' => 'sometimes|numeric|min:0|max:100',
            'category' => 'nullable|string|max:50',
            'threshold_amount' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $old = $taxRate->toArray();
        $data['updated_by'] = Auth::id();
        $taxRate->update($data);

        AuditLogger::log('update_tax_rate', $taxRate, $taxRate->id, $old, $taxRate->fresh()->toArray());

        return back()->with('success', 'Tarif pajak berhasil diperbarui.');
    }

    public function destroy(TaxRate $taxRate)
    {
        $old = $taxRate->toArray();
        $taxRate->delete();

        AuditLogger::log('delete_tax_rate', $taxRate, $taxRate->id, $old, null);

        return back()->with('success', 'Tarif pajak dinonaktifkan.');
    }
}
