<?php

use App\Http\Controllers\Admin\CurationController;
use App\Http\Controllers\Admin\ExternalLinkController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Catalog\CatalogController;
use App\Http\Controllers\Products\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Reports\ReportController;
use App\Http\Controllers\Transactions\TransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [CatalogController::class, 'index'])->name('home');
Route::get('/catalog/{product:slug}', [CatalogController::class, 'show'])->name('catalog.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('/create', [ProductController::class, 'create'])->name('create')
            ->middleware('role:dosen_peneliti,mahasiswa,admin_rtpu');
        Route::post('/', [ProductController::class, 'store'])->name('store')
            ->middleware('role:dosen_peneliti,mahasiswa,admin_rtpu');
        Route::get('/{product}', [ProductController::class, 'show'])->name('show');
        Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('edit')
            ->middleware('role:dosen_peneliti,mahasiswa,admin_rtpu');
        Route::patch('/{product}', [ProductController::class, 'update'])->name('update')
            ->middleware('role:dosen_peneliti,mahasiswa,admin_rtpu');
        Route::delete('/{product}', [ProductController::class, 'destroy'])->name('destroy')
            ->middleware('role:dosen_peneliti,mahasiswa,admin_rtpu');
    });

    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [TransactionController::class, 'index'])->name('index');
        Route::get('/checkout', [TransactionController::class, 'checkout'])->name('checkout');
        Route::post('/', [TransactionController::class, 'store'])->name('store');
        Route::get('/{order}', [TransactionController::class, 'show'])->name('show');
        Route::post('/{order}/proof', [TransactionController::class, 'uploadProof'])->name('upload-proof');
    });

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    Route::middleware('role:admin_rtpu')->prefix('admin')->name('admin.')->group(function () {
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserManagementController::class, 'index'])->name('index');
            Route::get('/create', [UserManagementController::class, 'create'])->name('create');
            Route::post('/', [UserManagementController::class, 'store'])->name('store');
            Route::get('/{user}/edit', [UserManagementController::class, 'edit'])->name('edit');
            Route::patch('/{user}', [UserManagementController::class, 'update'])->name('update');
            Route::delete('/{user}', [UserManagementController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('curation')->name('curation.')->group(function () {
            Route::get('/', [CurationController::class, 'index'])->name('index');
            Route::patch('/{product}/approve', [CurationController::class, 'approve'])->name('approve');
            Route::patch('/{product}/reject', [CurationController::class, 'reject'])->name('reject');
        });

        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::patch('settings', [SettingController::class, 'update'])->name('settings.update');
        Route::resource('external-links', ExternalLinkController::class)
            ->except(['show', 'create', 'edit'])
            ->names('external-links');
    });
});

require __DIR__.'/auth.php';
