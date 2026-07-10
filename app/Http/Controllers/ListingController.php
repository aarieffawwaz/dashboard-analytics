<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'produk_id' => ['required', 'exists:produks,id'],
            'volume_tersedia' => ['required', 'numeric', 'min:0.01'],
            'satuan' => ['required', 'string', 'max:20'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
        ]);

        Listing::create([
            ...$data,
            'koperasi_id' => $request->user()->koperasi_id,
            'status' => 'aktif',
        ]);

        return back()->with('success', 'Produk diposting ke marketplace.');
    }
}
