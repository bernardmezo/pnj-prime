<?php

use App\Http\Controllers\Admin\ExternalLinkController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Auth\SsoController;
use App\Http\Controllers\Catalog\CatalogController;
use App\Http\Controllers\Customer\PengajuanController as CustomerPengajuanController;
use App\Http\Controllers\Customer\RiwayatController as CustomerRiwayatController;
use App\Http\Controllers\Direktur\PemantauanController as DirekturController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\P3M\ProdukUnggulanController;
use App\Http\Controllers\Pimpinan\VerifikasiController as PimpinanController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Rtpu\LayananController as RtpuLayananController;
use App\Http\Controllers\Rtpu\MetodeController as RtpuMetodeController;
use App\Http\Controllers\Rtpu\RiwayatController as RtpuRiwayatController;
use App\Http\Controllers\Rtpu\StatusController as RtpuStatusController;
use App\Http\Controllers\Rtpu\VerifikasiController as RtpuVerifikasiController;
use App\Http\Controllers\SuperAdmin\FiturController as SuperAdminFiturController;
use App\Http\Controllers\SuperAdmin\HakAksesController as SuperAdminHakController;
use App\Http\Controllers\SuperAdmin\UsersController as SuperAdminUsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [CatalogController::class, 'index'])->name('home')->middleware('fitur:katalog');
Route::get('/katalog', [CatalogController::class, 'browse'])->name('catalog.index')->middleware('fitur:katalog');
Route::get('/catalog/{product:slug}', [CatalogController::class, 'show'])->name('catalog.show')->middleware('fitur:katalog');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/berkas/{kind}/{id}/{index}', [FileController::class, 'show'])
        ->whereNumber(['id', 'index'])
        ->whereIn('kind', ['pengajuan-dokumen', 'produk-dokumen', 'bukti'])
        ->name('berkas.show');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ---- Use-case model: Customer ----
    Route::middleware('role:customer')->prefix('pengajuan')->name('customer.pengajuan.')->group(function () {
        Route::get('/', [CustomerPengajuanController::class, 'index'])->name('index')->middleware(['fitur:pengajuan', 'permission:pengajuan,Lihat']);
        Route::get('/create', [CustomerPengajuanController::class, 'create'])->name('create')->middleware(['fitur:pengajuan', 'permission:pengajuan,Tambah']);
        Route::post('/', [CustomerPengajuanController::class, 'store'])->name('store')->middleware(['fitur:pengajuan', 'permission:pengajuan,Tambah']);
        Route::get('/{pengajuan}', [CustomerPengajuanController::class, 'show'])->name('show')->middleware(['fitur:pengajuan', 'permission:pengajuan,Lihat']);
        Route::get('/{pengajuan}/edit', [CustomerPengajuanController::class, 'edit'])->name('edit')->middleware(['fitur:pengajuan', 'permission:pengajuan,Ubah']);
        Route::patch('/{pengajuan}', [CustomerPengajuanController::class, 'update'])->name('update')->middleware(['fitur:pengajuan', 'permission:pengajuan,Ubah']);
        Route::patch('/{pengajuan}/cancel', [CustomerPengajuanController::class, 'cancel'])->name('cancel')->middleware(['fitur:pengajuan', 'permission:pengajuan,Ubah']);
        Route::get('/{pengajuan}/bayar', [CustomerPengajuanController::class, 'bayar'])->name('bayar')->middleware(['fitur:pembayaran', 'permission:pembayaran,Lihat']);
        Route::post('/{pengajuan}/bukti', [CustomerPengajuanController::class, 'proof'])->name('proof')->middleware(['fitur:pembayaran', 'permission:pembayaran,Tambah']);
    });
    Route::get('/riwayat', [CustomerRiwayatController::class, 'index'])->name('customer.riwayat')->middleware('role:customer', 'fitur:pengajuan', 'permission:pengajuan,Lihat');

    // ---- Use-case model: Admin P3M ----
    Route::middleware('role:admin_p3m')->prefix('p3m/produk-unggulan')->name('p3m.produk.')->group(function () {
        Route::get('/', [ProdukUnggulanController::class, 'index'])->name('index')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
        Route::get('/create', [ProdukUnggulanController::class, 'create'])->name('create')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Tambah']);
        Route::post('/', [ProdukUnggulanController::class, 'store'])->name('store')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Tambah']);
        Route::get('/{produk}', [ProdukUnggulanController::class, 'show'])->name('show')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
        Route::get('/{produk}/edit', [ProdukUnggulanController::class, 'edit'])->name('edit')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Ubah']);
        Route::patch('/{produk}', [ProdukUnggulanController::class, 'update'])->name('update')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Ubah']);
        Route::patch('/{produk}/cancel', [ProdukUnggulanController::class, 'cancel'])->name('cancel')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Ubah']);
    });
    Route::get('/p3m/riwayat', [ProdukUnggulanController::class, 'riwayat'])->name('p3m.riwayat')->middleware('role:admin_p3m', 'fitur:produk-unggulan', 'permission:produk-unggulan,Lihat');

    // ---- Use-case model: Admin RTPU ----
    Route::middleware('role:admin_rtpu')->prefix('rtpu')->name('rtpu.')->group(function () {
        Route::get('/verifikasi/layanan', [RtpuVerifikasiController::class, 'layanan'])->name('verify.layanan')->middleware(['fitur:verifikasi', 'permission:verifikasi,Lihat']);
        Route::patch('/verifikasi/layanan/{pengajuan}/approve', [RtpuVerifikasiController::class, 'approveLayanan'])->name('verify.layanan.approve')->middleware(['fitur:verifikasi', 'permission:verifikasi,Verifikasi']);
        Route::patch('/verifikasi/layanan/{pengajuan}/reject', [RtpuVerifikasiController::class, 'rejectLayanan'])->name('verify.layanan.reject')->middleware(['fitur:verifikasi', 'permission:verifikasi,Verifikasi']);
        Route::get('/verifikasi/pembayaran', [RtpuVerifikasiController::class, 'pembayaran'])->name('verify.bayar')->middleware(['fitur:pembayaran', 'permission:pembayaran,Lihat']);
        Route::patch('/verifikasi/pembayaran/{proof}/accept', [RtpuVerifikasiController::class, 'acceptBayar'])->name('verify.bayar.accept')->middleware(['fitur:pembayaran', 'permission:pembayaran,Verifikasi']);
        Route::patch('/verifikasi/pembayaran/{proof}/reject', [RtpuVerifikasiController::class, 'rejectBayar'])->name('verify.bayar.reject')->middleware(['fitur:pembayaran', 'permission:pembayaran,Verifikasi']);
        Route::get('/status', [RtpuStatusController::class, 'index'])->name('status')->middleware(['fitur:pengajuan', 'permission:pengajuan,Lihat']);
        Route::patch('/status/{pengajuan}', [RtpuStatusController::class, 'update'])->name('status.update')->middleware(['fitur:pengajuan', 'permission:pengajuan,Ubah']);
        Route::get('/layanan', [RtpuLayananController::class, 'index'])->name('layanan')->middleware(['fitur:katalog', 'permission:katalog,Lihat']);
        Route::get('/layanan/create', [RtpuLayananController::class, 'create'])->name('layanan.form')->middleware(['fitur:katalog', 'permission:katalog,Tambah']);
        Route::post('/layanan', [RtpuLayananController::class, 'store'])->name('layanan.store')->middleware(['fitur:katalog', 'permission:katalog,Tambah']);
        Route::get('/layanan/{product}/edit', [RtpuLayananController::class, 'edit'])->name('layanan.edit')->middleware(['fitur:katalog', 'permission:katalog,Ubah']);
        Route::patch('/layanan/{product}', [RtpuLayananController::class, 'update'])->name('layanan.update')->middleware(['fitur:katalog', 'permission:katalog,Ubah']);
        Route::delete('/layanan/{product}', [RtpuLayananController::class, 'destroy'])->name('layanan.destroy')->middleware(['fitur:katalog', 'permission:katalog,Hapus']);
        Route::get('/metode', [RtpuMetodeController::class, 'index'])->name('metode')->middleware(['fitur:pembayaran', 'permission:pembayaran,Lihat']);
        Route::post('/metode', [RtpuMetodeController::class, 'store'])->name('metode.store')->middleware(['fitur:pembayaran', 'permission:pembayaran,Tambah']);
        Route::patch('/metode/{metode}', [RtpuMetodeController::class, 'update'])->name('metode.update')->middleware(['fitur:pembayaran', 'permission:pembayaran,Ubah']);
        Route::delete('/metode/{metode}', [RtpuMetodeController::class, 'destroy'])->name('metode.destroy')->middleware(['fitur:pembayaran', 'permission:pembayaran,Hapus']);
        Route::get('/riwayat', [RtpuRiwayatController::class, 'index'])->name('riwayat')->middleware(['fitur:pengajuan', 'permission:pengajuan,Lihat']);
    });

    // ---- Use-case model: Pimpinan RTPU ----
    Route::middleware('role:pimpinan_rtpu')->prefix('pimpinan')->name('pimpinan.')->group(function () {
        Route::get('/verifikasi', [PimpinanController::class, 'index'])->name('verify')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
        Route::patch('/verifikasi/{produk}/approve', [PimpinanController::class, 'approve'])->name('verify.approve')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Verifikasi']);
        Route::patch('/verifikasi/{produk}/reject', [PimpinanController::class, 'reject'])->name('verify.reject')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Verifikasi']);
        Route::get('/pemantauan', [PimpinanController::class, 'monitor'])->name('monitor')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
        Route::get('/riwayat', [PimpinanController::class, 'riwayat'])->name('riwayat')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
    });

    // ---- Use-case model: Direktur (read-only) ----
    Route::middleware('role:direktur')->prefix('direktur')->name('direktur.')->group(function () {
        Route::get('/pemantauan', [DirekturController::class, 'monitor'])->name('monitor')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
        Route::get('/riwayat', [DirekturController::class, 'riwayat'])->name('riwayat')->middleware(['fitur:produk-unggulan', 'permission:produk-unggulan,Lihat']);
    });

    // ---- Use-case model: Super Admin ----
    Route::middleware('role:super_admin')->prefix('superadmin')->name('superadmin.')->group(function () {
        Route::get('/users', [SuperAdminUsersController::class, 'index'])->name('users')->middleware('fitur:pengguna');
        Route::post('/users', [SuperAdminUsersController::class, 'store'])->name('users.store')->middleware('fitur:pengguna');
        Route::patch('/users/{user}', [SuperAdminUsersController::class, 'update'])->name('users.update')->middleware('fitur:pengguna');
        Route::delete('/users/{user}', [SuperAdminUsersController::class, 'destroy'])->name('users.destroy')->middleware('fitur:pengguna');
        Route::patch('/users/{user}/toggle', [SuperAdminUsersController::class, 'toggle'])->name('users.toggle')->middleware('fitur:pengguna');
        Route::get('/hak-akses', [SuperAdminHakController::class, 'index'])->name('hakakses')->middleware('fitur:hak-akses');
        Route::post('/hak-akses', [SuperAdminHakController::class, 'save'])->name('hakakses.save')->middleware('fitur:hak-akses');
        Route::get('/fitur', [SuperAdminFiturController::class, 'index'])->name('fitur')->middleware('fitur:fitur');
        Route::post('/fitur', [SuperAdminFiturController::class, 'store'])->name('fitur.store')->middleware('fitur:fitur');
        Route::patch('/fitur/{fitur}', [SuperAdminFiturController::class, 'update'])->name('fitur.update')->middleware('fitur:fitur');
        Route::delete('/fitur/{fitur}', [SuperAdminFiturController::class, 'destroy'])->name('fitur.destroy')->middleware('fitur:fitur');
    });

    Route::middleware('role:admin_rtpu')->prefix('admin')->name('admin.')->group(function () {
        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::patch('settings', [SettingController::class, 'update'])->name('settings.update');
        Route::resource('external-links', ExternalLinkController::class)
            ->except(['show', 'create', 'edit'])
            ->names('external-links');
    });
});

// SSO PNJ — registered only when the flag is on, so both URIs 404 otherwise.
if (config('services.sso.enabled')) {
    Route::middleware('guest')->group(function () {
        Route::get('/sso/redirect', [SsoController::class, 'redirect'])->name('sso.redirect');
        Route::get('/sso/callback', [SsoController::class, 'callback'])->name('sso.callback');
    });
}

require __DIR__.'/auth.php';
