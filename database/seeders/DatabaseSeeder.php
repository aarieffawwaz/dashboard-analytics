<?php

namespace Database\Seeders;

use App\Models\Koperasi;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $koperasi = Koperasi::create([
            'nama' => 'Koperasi Desa Sukamaju',
            'wilayah' => 'Kecamatan Sukamaju',
            'lat' => -6.914744,
            'lng' => 107.609810,
            'no_telp' => '081234567890',
        ]);

        User::create([
            'koperasi_id' => $koperasi->id,
            'name' => 'Admin Sukamaju',
            'email' => 'admin@sikora.test',
            'password' => Hash::make('password'),
        ]);

        foreach (['Bayam', 'Cabai rawit', 'Tomat', 'Jagung manis', 'Kangkung'] as $nama) {
            Produk::create(['nama' => $nama, 'kategori' => 'Sayuran', 'satuan_default' => 'kg']);
        }
    }
}
