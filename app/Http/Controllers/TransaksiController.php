<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransaksiController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Transaksi/Create', [
            'produkList' => Produk::orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'produk_id' => ['required', 'exists:produks,id'],
            'tipe' => ['required', 'in:beli,jual'],
            'nama_pihak' => ['required', 'string', 'max:255'],
            'volume' => ['required', 'numeric', 'min:0.01'],
            'satuan' => ['required', 'string', 'max:20'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
        ]);

        Transaksi::create([
            'koperasi_id' => $request->user()->koperasi_id,
            'produk_id' => $data['produk_id'],
            'tipe' => $data['tipe'],
            'nama_pihak' => $data['nama_pihak'],
            'volume' => $data['volume'],
            'satuan' => $data['satuan'],
            'harga_satuan' => $data['harga_satuan'],
            'total' => $data['volume'] * $data['harga_satuan'],
            'tanggal' => now()->toDateString(),
        ]);

        return redirect('/')->with('success', 'Transaksi tersimpan.');
    }
}
