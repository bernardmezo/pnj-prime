<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExternalLink;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExternalLinkController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/ExternalLinks', [
            'links' => ExternalLink::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'label'        => 'required|string|max:100',
            'url'          => 'required|url|max:500',
            'description'  => 'nullable|string|max:255',
            'is_active'    => 'boolean',
            'open_new_tab' => 'boolean',
            'sort_order'   => 'integer',
        ]);

        ExternalLink::create($request->validated());

        return redirect()->route('admin.external-links.index')->with('success', 'Link ditambahkan.');
    }

    public function update(Request $request, ExternalLink $externalLink)
    {
        $request->validate([
            'label'        => 'required|string|max:100',
            'url'          => 'required|url|max:500',
            'description'  => 'nullable|string|max:255',
            'is_active'    => 'boolean',
            'open_new_tab' => 'boolean',
            'sort_order'   => 'integer',
        ]);

        $externalLink->update($request->validated());

        return back()->with('success', 'Link diperbarui.');
    }

    public function destroy(ExternalLink $externalLink)
    {
        $externalLink->delete();

        return redirect()->route('admin.external-links.index')->with('success', 'Link dihapus.');
    }
}
