<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\MinatBeli;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    public function index(): Response
    {
        $listings = Listing::with(['produk', 'koperasi'])
            ->where('status', 'aktif')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($listing) {
                $listing->badge = $this->badgeFor($listing);
                return $listing;
            });

        return Inertia::render('Marketplace', ['listings' => $listings]);
    }

    public function kirimMinat(Request $request, Listing $listing)
    {
        $data = $request->validate([
            'nama_buyer' => ['required', 'string', 'max:255'],
            'kontak_wa' => ['required', 'string', 'max:30'],
            'volume_diminati' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        MinatBeli::create([
            ...$data,
            'koperasi_id' => $listing->koperasi_id,
            'produk_id' => $listing->produk_id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Minat beli terkirim.');
    }

    private function badgeFor(Listing $listing): string
    {
        $adaMinat = MinatBeli::where('koperasi_id', $listing->koperasi_id)
            ->where('produk_id', $listing->produk_id)->exists();

        if ($listing->created_at->gt(now()->subDay())) return 'baru diposting';
        if (! $adaMinat && $listing->created_at->lt(now()->subDays(3))) return 'butuh pembeli';

        return $adaMinat ? 'cepat laku' : 'tersedia';
    }
}
