<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Menggantikan AuthenticatedSessionController untuk kebutuhan prototipe.
 * Tidak ada password: pengguna memilih koperasi, pilihannya disimpan di session,
 * dan seluruh dashboard membaca session tersebut.
 */
class KoperasiSessionController extends Controller
{
    public function create()
    {
        $rows = DB::connection('dataset_kemenkop')->select("
            SELECT DISTINCT ON (kp.koperasi_ref)
                kp.koperasi_ref,
                kp.nama_koperasi,
                w.kecamatan,
                w.kab_kota,
                w.provinsi
            FROM profil_koperasi kp
            JOIN referensi_koperasi_wilayah rkw ON rkw.koperasi_ref = kp.koperasi_ref
            JOIN referensi_wilayah w ON w.kode_wilayah = rkw.kode_wilayah
            WHERE kp.koordinat_dibulatkan IS NOT NULL
            ORDER BY kp.koperasi_ref, w.kode_wilayah
        ");

        $koperasiList = collect($rows)
            ->map(fn ($k) => [
                'ref'     => $k->koperasi_ref,
                'nama'    => $k->nama_koperasi ?? 'Koperasi tanpa nama',
                'wilayah' => collect([
                    $k->kecamatan ? "Kec. {$k->kecamatan}" : null,
                    $k->kab_kota,
                    $k->provinsi,
                ])->filter()->implode(', '),
            ])
            ->sortBy('nama', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();

        // Nama komponen mengikuti path file: resources/js/Pages/Auth/Login.tsx
        return Inertia::render('Auth/Login', [
            'koperasiList' => $koperasiList,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'koperasi_ref' => ['required', 'string'],
        ], [
            'koperasi_ref.required' => 'Pilih dulu koperasi yang ingin dilihat.',
        ]);

        $koperasi = DB::connection('dataset_kemenkop')->selectOne("
            SELECT kp.koperasi_ref, kp.nama_koperasi
            FROM profil_koperasi kp
            WHERE kp.koperasi_ref = ?
              AND kp.koordinat_dibulatkan IS NOT NULL
            LIMIT 1
        ", [$request->input('koperasi_ref')]);

        if (! $koperasi) {
            return back()->withErrors([
                'koperasi_ref' => 'Koperasi itu tidak ada di dataset, atau titik koordinatnya belum terisi.',
            ]);
        }

        $request->session()->regenerate();
        $request->session()->put('koperasi_ref', $koperasi->koperasi_ref);
        $request->session()->put('koperasi_nama', $koperasi->nama_koperasi);

        return redirect()->route('dashboard');
    }

    public function destroy(Request $request)
    {
        $request->session()->flush();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}