<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnalisisController extends Controller
{
    public function index(Request $request): Response
    {
        $koperasiId = $request->user()->koperasi_id;

        $rows = DB::table('transaksis')
            ->join('produks', 'produks.id', '=', 'transaksis.produk_id')
            ->select(
                'produks.nama as produk',
                DB::raw("SUM(CASE WHEN tipe = 'beli' THEN volume ELSE 0 END) as total_beli"),
                DB::raw("SUM(CASE WHEN tipe = 'jual' THEN volume ELSE 0 END) as total_jual"),
                DB::raw("SUM(CASE WHEN tipe = 'beli' THEN total ELSE 0 END) as nilai_beli"),
                DB::raw("SUM(CASE WHEN tipe = 'jual' THEN total ELSE 0 END) as nilai_jual")
            )
            ->where('koperasi_id', $koperasiId)
            ->groupBy('produks.nama')
            ->get()
            ->map(function ($row) {
                $row->rasio_terjual = $row->total_beli > 0 ? round(($row->total_jual / $row->total_beli) * 100, 1) : 0;
                $row->margin_persen = $row->nilai_beli > 0 ? round((($row->nilai_jual - $row->nilai_beli) / $row->nilai_beli) * 100, 1) : null;
                return $row;
            })
            ->sortBy('rasio_terjual')
            ->values();

        return Inertia::render('Analisis', ['rows' => $rows]);
    }
}
