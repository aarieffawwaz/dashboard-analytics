<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\MinatBeli;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $koperasiId = $request->user()->koperasi_id;

        $awalBulanIni = now()->startOfMonth();
        $awalBulanLalu = now()->subMonthNoOverflow()->startOfMonth();
        $akhirBulanLalu = now()->startOfMonth()->subDay();

        $volumeBulanIni = Transaksi::where('koperasi_id', $koperasiId)
            ->where('tipe', 'jual')->where('tanggal', '>=', $awalBulanIni)->sum('total');

        $volumeBulanLalu = Transaksi::where('koperasi_id', $koperasiId)
            ->where('tipe', 'jual')->whereBetween('tanggal', [$awalBulanLalu, $akhirBulanLalu])->sum('total');

        $growth = $volumeBulanLalu > 0
            ? round((($volumeBulanIni - $volumeBulanLalu) / $volumeBulanLalu) * 100, 1)
            : null;

        $bulanList = collect(range(5, 0))->map(fn ($i) => now()->subMonthsNoOverflow($i)->format('Y-m'));
        $trenData = Transaksi::where('koperasi_id', $koperasiId)
            ->where('tipe', 'jual')
            ->where('tanggal', '>=', now()->subMonthsNoOverflow(5)->startOfMonth())
            ->get()
            ->groupBy(fn ($t) => $t->tanggal->format('Y-m'))
            ->map(fn ($g) => (float) $g->sum('total'));

        $tren = $bulanList->map(fn ($b) => ['bulan' => $b, 'total' => $trenData[$b] ?? 0])->values();

        $surplusRows = DB::table('transaksis')
            ->join('produks', 'produks.id', '=', 'transaksis.produk_id')
            ->select(
                'produk_id', 'produks.nama as nama_produk', 'produks.satuan_default',
                DB::raw("SUM(CASE WHEN tipe = 'beli' THEN volume ELSE 0 END) as total_beli"),
                DB::raw("SUM(CASE WHEN tipe = 'jual' THEN volume ELSE 0 END) as total_jual")
            )
            ->where('koperasi_id', $koperasiId)
            ->groupBy('produk_id', 'produks.nama', 'produks.satuan_default')
            ->get()
            ->map(function ($row) {
                $row->surplus = round($row->total_beli - $row->total_jual, 2);
                return $row;
            })
            ->filter(fn ($row) => $row->surplus >= 10)
            ->values();

        $transaksiTerbaru = Transaksi::with('produk')
            ->where('koperasi_id', $koperasiId)
            ->orderByDesc('tanggal')->orderByDesc('id')
            ->limit(5)->get();

        return Inertia::render('Dashboard', [
            'ringkasan' => [
                'volume_bulan_ini' => (float) $volumeBulanIni,
                'growth_persen' => $growth,
                'listing_aktif' => Listing::where('koperasi_id', $koperasiId)->where('status', 'aktif')->count(),
                'minat_pending' => MinatBeli::where('koperasi_id', $koperasiId)->where('status', 'pending')->count(),
            ],
            'tren' => $tren,
            'surplus' => $surplusRows,
            'transaksiTerbaru' => $transaksiTerbaru,
        ]);
    }
}
