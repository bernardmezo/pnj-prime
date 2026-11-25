<?php

namespace App\Http\Controllers;

use App\Models\AcademicCalendarDate;
use App\Models\Pengajuan;
use App\Notifications\ScheduleRescheduleRequired;
use App\Services\RoomBookingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicCalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isRtpu = $user->role === 'admin_rtpu';
        $month = $request->date('month') ?? now();
        $monthStart = $month->copy()->startOfMonth();
        $monthEnd = $month->copy()->endOfMonth();

        $query = Pengajuan::with(['product:id,name,owner_id', 'buyer:id,name'])
            ->where(function ($q) use ($monthStart, $monthEnd) {
                $q->where(fn ($q) => $q->where('rental_start', '<=', $monthEnd)->where('rental_end', '>=', $monthStart))
                    ->orWhere(fn ($q) => $q->where('jadwal_mulai', '<=', $monthEnd)->where('jadwal_selesai', '>=', $monthStart));
            })
            ->whereNotIn('status', ['Ditolak', 'Dibatalkan', 'Kedaluwarsa']);

        if (! $isRtpu) {
            $query->whereHas('product', fn ($q) => $q->where('owner_id', $user->id));
        }

        $bookings = $query->get()->map(fn ($p) => [
            'id' => $p->id,
            'code' => $p->code,
            'product' => $p->product?->name,
            'customer' => $p->buyer?->name,
            'type' => $p->tipe,
            'start' => ($p->rental_start ?? $p->jadwal_mulai)?->format('Y-m-d H:i'),
            'end' => ($p->rental_end ?? $p->jadwal_selesai)?->format('Y-m-d H:i'),
            'status' => $p->status,
            'reschedule_required' => (bool) $p->reschedule_required,
        ])->values();

        $closedDates = AcademicCalendarDate::whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->orderBy('date')->get()->map(fn ($d) => [
                'id' => $d->id,
                'date' => $d->date->format('Y-m-d'),
                'title' => $d->title,
                'type' => $d->type,
            ])->values();

        return Inertia::render('Calendar/Master', [
            'month' => $monthStart->format('Y-m-d'),
            'bookings' => $bookings,
            'closedDates' => $closedDates,
            'canManage' => $isRtpu,
        ]);
    }

    public function storeClosedDate(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role === 'admin_rtpu', 403);
        $data = $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:255',
        ]);

        $affected = DB::transaction(function () use ($data) {
            $closedDate = AcademicCalendarDate::whereDate('date', $data['date'])->lockForUpdate()->first();
            if ($closedDate) {
                $closedDate->update(['title' => $data['title'], 'type' => 'academic_closed', 'created_by' => Auth::id()]);
            } else {
                $closedDate = AcademicCalendarDate::create([
                    'date' => $data['date'], 'title' => $data['title'], 'type' => 'academic_closed', 'created_by' => Auth::id(),
                ]);
            }
            $start = $closedDate->date->copy()->startOfDay();
            $end = $start->copy()->addDay();
            $affected = Pengajuan::with(['product.owner', 'buyer'])
                ->whereNotIn('status', ['Selesai', 'Ditolak', 'Dibatalkan', 'Kedaluwarsa'])
                ->where(function ($q) use ($start, $end) {
                    $q->where(fn ($q) => $q->where('rental_start', '<', $end)->where('rental_end', '>', $start))
                        ->orWhere(fn ($q) => $q->where('jadwal_mulai', '<', $end)->where('jadwal_selesai', '>', $start));
                })
                ->where('reschedule_required', false)
                ->lockForUpdate()
                ->get();

            foreach ($affected as $locked) {
                $locked->reschedule_required = true;
                $locked->reschedule_reason = "Tanggal akademik tidak tersedia: {$closedDate->title} ({$closedDate->date->format('d/m/Y')}).";
                $locked->reschedule_requested_at = now();
                $locked->save();
                app(RoomBookingService::class)->releaseForPengajuan($locked->id);
            }

            DB::afterCommit(function () use ($affected) {
                foreach ($affected as $locked) {
                    $locked->buyer?->notify(new ScheduleRescheduleRequired($locked));
                    $locked->product?->owner?->notify(new ScheduleRescheduleRequired($locked));
                }
            });

            return $affected;
        });

        return back()->with('success', "Tanggal ditandai tidak tersedia. {$affected->count()} pesanan perlu dijadwalkan ulang.");
    }

    public function destroyClosedDate(Request $request, AcademicCalendarDate $academicCalendarDate): RedirectResponse
    {
        abort_unless($request->user()->role === 'admin_rtpu', 403);
        $academicCalendarDate->delete();

        return back()->with('success', 'Tanggal akademik kembali tersedia untuk pengajuan baru.');
    }
}
