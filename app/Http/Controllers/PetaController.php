<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetaController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user()->load('koperasi');

        $listings = Listing::with(['produk', 'koperasi'])
            ->where('status', 'aktif')
            ->where('koperasi_id', '!=', $me->koperasi_id)
            ->get();

        return Inertia::render('Peta', [
            'koperasiSaya' => $me->koperasi,
            'listings' => $listings,
        ]);
    }
}
