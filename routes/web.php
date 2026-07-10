<?php

use App\Http\Controllers\DashboardAnalyticsController;
use App\Http\Controllers\KoperasiSessionController;
use App\Http\Middleware\EnsureKoperasiSelected;
use Illuminate\Support\Facades\Route;

// "Login" prototipe: cuma memilih koperasi, tanpa password.
Route::get('/login', [KoperasiSessionController::class, 'create'])->name('login');
Route::post('/login', [KoperasiSessionController::class, 'store']);
Route::post('/logout', [KoperasiSessionController::class, 'destroy'])->name('logout');

Route::middleware(EnsureKoperasiSelected::class)->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));

    Route::get('/dashboard', [DashboardAnalyticsController::class, 'index'])->name('dashboard');

    // Ganti koperasi tanpa keluar sepenuhnya.
    Route::get('/ganti-koperasi', function () {
        session()->forget(['koperasi_ref', 'koperasi_nama']);

        return redirect()->route('login');
    })->name('koperasi.ganti');
});