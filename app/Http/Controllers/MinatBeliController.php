<?php

namespace App\Http\Controllers;

use App\Models\MinatBeli;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MinatBeliController extends Controller
{
    public function index(Request $request): Response
    {
        $items = MinatBeli::with('produk')
            ->where('koperasi_id', $request->user()->koperasi_id)
            ->orderByDesc('id')->get();

        return Inertia::render('MinatBeli', ['items' => $items]);
    }

    public function approve(Request $request, MinatBeli $minatBeli)
    {
        abort_unless($minatBeli->koperasi_id === $request->user()->koperasi_id, 403);
        $minatBeli->update(['status' => 'approved']);
        return back();
    }

    public function reject(Request $request, MinatBeli $minatBeli)
    {
        abort_unless($minatBeli->koperasi_id === $request->user()->koperasi_id, 403);
        $minatBeli->update(['status' => 'rejected']);
        return back();
    }
}
