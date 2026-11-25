<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'title' => $n->data['title'] ?? 'Notifikasi',
                'message' => $n->data['message'] ?? '',
                'url' => $n->data['url'] ?? null,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
