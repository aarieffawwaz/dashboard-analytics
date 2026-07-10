<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Pengganti middleware 'auth' untuk prototipe.
 * Halaman hanya terbuka kalau session sudah memuat koperasi_ref.
 */
class EnsureKoperasiSelected
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->session()->has('koperasi_ref')) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}