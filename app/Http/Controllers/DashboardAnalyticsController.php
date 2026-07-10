<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardAnalyticsController extends Controller
{
    public function index()
    {
        $ref = session('koperasi_ref');

        $koperasi = DB::connection('dataset_kemenkop')->selectOne("
            SELECT
                koperasi_ref,
                nama_koperasi,
                SPLIT_PART(koordinat_dibulatkan, ',', 1)::numeric AS lat,
                SPLIT_PART(koordinat_dibulatkan, ',', 2)::numeric AS lng
            FROM profil_koperasi
            WHERE koperasi_ref = ?
              AND koordinat_dibulatkan IS NOT NULL
            LIMIT 1
        ", [$ref]);

        // Session menunjuk koperasi yang sudah tidak ada / koordinatnya dihapus.
        if (! $koperasi) {
            session()->forget(['koperasi_ref', 'koperasi_nama']);
            return redirect()->route('login');
        }

        /*
         * Skor potensi tetap dihitung terhadap SELURUH desa nasional (percent rank),
         * baru sesudah itu hasilnya dipotong ke wilayah koperasi terpilih.
         */
        $rows = DB::connection('dataset_kemenkop')->select("
            WITH potensi_desa AS (
                SELECT
                    kode_wilayah,
                    SUM(nilai_potensi_desa) FILTER (WHERE nilai_potensi_desa > 0) AS total_potensi,
                    STRING_AGG(DISTINCT nama_komoditas, ', ' ORDER BY nama_komoditas) AS daftar_komoditas,
                    COUNT(*) AS jumlah_komoditas_total,
                    SUM(jumlah_sdm_terlibat) AS total_sdm
                FROM referensi_komoditas_desa
                GROUP BY kode_wilayah
            ),
            skor_nasional AS (
                SELECT
                    p.*,
                    CASE
                        WHEN p.total_potensi IS NULL OR p.total_potensi = 0 THEN NULL
                        ELSE ROUND((PERCENT_RANK() OVER (ORDER BY p.total_potensi))::numeric * 100)
                    END AS skor_potensi
                FROM potensi_desa p
            ),
            wilayah_koperasi AS (
                SELECT DISTINCT w.provinsi, w.kab_kota, w.kecamatan
                FROM referensi_koperasi_wilayah rkw
                JOIN referensi_wilayah w ON w.kode_wilayah = rkw.kode_wilayah
                WHERE rkw.koperasi_ref = ?
            ),
            desa_koperasi AS (
                SELECT DISTINCT kode_wilayah
                FROM referensi_koperasi_wilayah
                WHERE koperasi_ref = ?
            ),
            koperasi_per_desa AS (
                SELECT DISTINCT ON (rkw.kode_wilayah)
                    rkw.kode_wilayah,
                    kp.nama_koperasi,
                    kp.koordinat_dibulatkan
                FROM referensi_koperasi_wilayah rkw
                JOIN profil_koperasi kp ON kp.koperasi_ref = rkw.koperasi_ref
                WHERE kp.koordinat_dibulatkan IS NOT NULL
                ORDER BY rkw.kode_wilayah, (rkw.koperasi_ref = ?) DESC, kp.koperasi_ref
            )
            SELECT
                w.kode_wilayah,
                w.provinsi,
                w.kab_kota,
                w.kecamatan,
                w.desa_kelurahan AS nama_desa,
                kd.nama_koperasi,
                SPLIT_PART(kd.koordinat_dibulatkan, ',', 1)::numeric AS lat,
                SPLIT_PART(kd.koordinat_dibulatkan, ',', 2)::numeric AS lng,
                p.daftar_komoditas,
                p.total_potensi,
                p.total_sdm,
                p.jumlah_komoditas_total,
                p.skor_potensi,
                (dk.kode_wilayah IS NOT NULL) AS milik_koperasi
            FROM referensi_wilayah w
            JOIN wilayah_koperasi wk
              ON wk.provinsi = w.provinsi
             AND wk.kab_kota = w.kab_kota
             AND wk.kecamatan = w.kecamatan
            JOIN koperasi_per_desa kd ON kd.kode_wilayah = w.kode_wilayah
            LEFT JOIN desa_koperasi dk ON dk.kode_wilayah = w.kode_wilayah
            LEFT JOIN skor_nasional p ON p.kode_wilayah = w.kode_wilayah
            ORDER BY milik_koperasi DESC, p.skor_potensi DESC NULLS LAST
        ", [$ref, $ref, $ref]);

        $desaList = collect($rows)->map(function ($r) {
            $adaData = ! is_null($r->skor_potensi);
            $skor    = $adaData ? (int) $r->skor_potensi : 15;

            return [
                'nama'          => $r->nama_desa ?? 'Desa tanpa nama',
                'lat'           => (float) $r->lat,
                'lng'           => (float) $r->lng,
                'komoditas'     => $r->daftar_komoditas ?? 'Belum ada komoditas terdata',
                'skorPotensi'   => $skor,
                'catatanAI'     => $this->buatNarasiDesa($r, $adaData),
                'koperasi'      => $r->nama_koperasi,
                'kecamatan'     => $r->kecamatan,
                'milikKoperasi' => (bool) $r->milik_koperasi,
            ];
        })->values();

        $totalDesa      = $desaList->count();
        $skorTinggi     = $desaList->where('skorPotensi', '>=', 70)->count();
        $totalKomoditas = collect($rows)->sum('jumlah_komoditas_total');

        // Label wilayah: kecamatan yang benar-benar dicakup koperasi ini.
        $kecamatan = collect($rows)
            ->filter(fn ($r) => $r->milik_koperasi)
            ->pluck('kecamatan')
            ->filter()
            ->unique()
            ->values();

        $baris        = collect($rows)->firstWhere('milik_koperasi', true) ?? collect($rows)->first();
        $labelKec     = $kecamatan->isEmpty() ? null : 'Kec. ' . $kecamatan->implode(', ');
        $wilayahLabel = collect([$labelKec, $baris->kab_kota ?? null])->filter()->implode(' • ');

        $dataKesehatan = $this->kalkulasiKesehatanKoperasi($ref);

        $dataKesehatan['stats'] = [
            'produkDianalisis'  => 0,
            'kategoriOptimal'   => 0,
            'kategoriPerhatian' => 0,
        ];
        $dataKesehatan['insights'] = [];

        // =========================================================
        // MENGHITUNG DATA BUYER & RIWAYAT TRANSAKSI (DARI DATABASE)
        // =========================================================
        $db = DB::connection('dataset_kemenkop');

        try {
            // Pakai COUNT(*) karena tabel transaksi nggak punya kolom 'id'
            $buyerStats = $db->selectOne("
                SELECT
                    COUNT(DISTINCT nama_pelanggan) as total_buyer,
                    COUNT(*) as total_transaksi
                FROM transaksi_penjualan
                WHERE koperasi_ref = ?
            ", [$ref]);

            $totalBuyer     = $buyerStats->total_buyer ?? 0;
            $totalTransaksi = $buyerStats->total_transaksi ?? 0;

            $topBuyers = $db->select("
                SELECT
                    nama_pelanggan as nama,
                    COUNT(*) as frekuensi,
                    SUM(total_pembayaran) as total_belanja
                FROM transaksi_penjualan
                WHERE koperasi_ref = ?
                GROUP BY nama_pelanggan
                ORDER BY frekuensi DESC, total_belanja DESC
                LIMIT 5
            ", [$ref]);

            $riwayatBuyer = collect($topBuyers)->map(function ($b) {
                return [
                    'nama'               => $b->nama ?: 'Pelanggan Anonim',
                    'produkDibeli'       => 'Komoditas Koperasi',
                    'frekuensi'          => (int) $b->frekuensi,
                    'kategoriPreferensi' => 'Reguler',
                ];
            })->toArray();
        } catch (\Exception $e) {
            $totalBuyer     = 0;
            $totalTransaksi = 0;
            $riwayatBuyer   = [];
        }

        // =========================================================
        // SMART MATCHING KORA THINK (MOCK API PROGRAM TEMATIK)
        // =========================================================
        $namaKoperasi = $koperasi->nama_koperasi ?? 'Koperasi';
        $namaDesa     = $baris->nama_desa ?? 'Wilayah Sekitar';
        $namaKota     = $baris->kab_kota ?? 'Pusat Kota';

        /*
         * PRODUK YANG DITAWARKAN — MASIH DUMMY.
         * Disesuaikan per kategori biar pesan WhatsApp-nya nyambung sama kebutuhan buyer:
         *   - mbg       -> bahan makanan bergizi (buat dapur MBG)
         *   - kesehatan -> produk herbal / jamu (buat faskes)
         *   - bansos    -> sembako / kebutuhan pokok (buat penyaluran bansos)
         *
         * NANTI kalau data produk koperasi sudah ada di DB, tinggal ganti isi array ini
         * dengan hasil query produk milik koperasi yang login.
         */
        $produkPerKategori = [
            'mbg' => [
                'Bayam Organik — 5 kg/hari',
                'Telur Ayam Negeri — 10 kg/hari',
                'Jagung Manis — 8 kg/hari',
                'Wortel Segar — 5 kg/hari',
            ],
            'kesehatan' => [
                'Jamu Herbal Instan — 50 box',
                'Madu Murni — 20 botol',
                'Temulawak Kering — 10 kg',
                'Jahe Merah — 8 kg',
            ],
            'bansos' => [
                'Beras Premium — 500 kg',
                'Minyak Goreng — 100 liter',
                'Gula Pasir — 50 kg',
                'Telur Ayam — 30 kg',
            ],
        ];

        $rekomendasiBuyer = [
            [
                'kategori'  => 'mbg',                 // <- nentuin tema + logo di frontend
                'sumberApi' => 'Dapodik · BGN',
                'desa'      => $namaDesa,
                'buyer'     => 'Dapur Umum MBG SDN 01',
                'alasan'    => 'Dapur Makan Bergizi Gratis membutuhkan suplai harian 50kg Bayam Organik & 30kg Telur.',
                'kontak'    => '0821-2326-5167 (Ibu Rina - PIC Dapur)',
                'jarak'     => 1.2,
                'logo'      => '/logos/bgn.png',
            ],
            [
                'kategori'  => 'kesehatan',
                'sumberApi' => 'SatuSehat Kemenkes',
                'desa'      => $namaDesa,
                'buyer'     => 'Puskesmas Kecamatan',
                'alasan'    => 'Faskes membutuhkan pengadaan 100 Box Jamu Herbal & Suplemen Madu per bulan.',
                'kontak'    => '0856-9288-9159 (Bag. Pengadaan)',
                'jarak'     => 2.5,
                'logo'      => '/logos/kemenkes.png',
            ],
            [
                'kategori'  => 'bansos',
                'sumberApi' => 'Bappenas · DTKS',
                'desa'      => $namaKota,
                'buyer'     => 'Agen Bansos Desa Prioritas',
                'alasan'    => 'Spesifikasi vendor terpenuhi untuk Bantuan Sosial Beras Premium 5 Ton.',
                'kontak'    => '0821-2326-5167 (Bpk. Agus - Kades)',
                'jarak'     => 5.8,
                'logo'      => '/logos/kemensos.png',
            ],
        ];

        // Tempelkan link WhatsApp + pesan yang sudah dikustom per mitra.
        foreach ($rekomendasiBuyer as &$r) {
            $produk = $produkPerKategori[$r['kategori']] ?? ['Komoditas Unggulan Koperasi'];

            // Susun jadi daftar bernomor yang rapi: "1. Bayam Organik - 5 kg/hari"
            $daftarProduk = collect($produk)
                ->map(fn ($p, $i) => ($i + 1) . '. ' . $p)
                ->implode("\n");

            $pesan =
                "Kepada Yth. Pengelola {$r['buyer']},\n\n" .
                "Perkenalkan, kami dari {$namaKoperasi}. Melalui platform Kora Think, " .
                "kami memperoleh informasi bahwa institusi Bapak/Ibu membutuhkan pasokan sebagai berikut:\n\n" .
                "\"{$r['alasan']}\"\n\n" .
                "Sehubungan dengan hal tersebut, koperasi kami menyediakan komoditas yang sesuai dan siap kami suplai:\n\n" .
                "{$daftarProduk}\n\n" .
                "Kami bermaksud menawarkan kerja sama pengadaan untuk memenuhi kebutuhan tersebut. " .
                "Kami terbuka untuk berdiskusi lebih lanjut mengenai jumlah, harga, serta jadwal pengiriman " .
                "sesuai spesifikasi yang dibutuhkan.\n\n" .
                "Atas perhatian dan kesempatan kerja samanya, kami ucapkan terima kasih.\n\n" .
                "Hormat kami,\n" .
                "{$namaKoperasi}";

            $r['wa'] = $this->waLink($r['kontak'], $pesan);
        }
        unset($r); // wajib: putus referensi setelah foreach by-reference

        return Inertia::render('DashboardAnalytics/Index', [
            'koperasi' => [
                'ref'     => $koperasi->koperasi_ref,
                'nama'    => $koperasi->nama_koperasi ?? 'Koperasi tanpa nama',
                'wilayah' => $wilayahLabel ?: 'Wilayah belum tercatat',
                'lat'     => (float) $koperasi->lat,
                'lng'     => (float) $koperasi->lng,
            ],
            'petaPotensi' => [
                'stats' => [
                    'desaTerpetakan'         => $totalDesa,
                    'potensiTeridentifikasi' => (int) $totalKomoditas,
                    'kecocokanTinggi'        => $skorTinggi,
                ],
                'pusat' => [
                    'lat' => (float) $koperasi->lat,
                    'lng' => (float) $koperasi->lng,
                ],
                'desaList' => $desaList->all(),
            ],
            // Data Kesehatan dimasukkan ke prop analisisUsaha
            'analisisUsaha' => $dataKesehatan,

            'buyerHistory' => [
                'stats' => [
                    'totalBuyer'            => $totalBuyer,
                    'transaksiTercatat'     => $totalTransaksi,
                    'rekomendasiDihasilkan' => count($rekomendasiBuyer),
                ],
                'riwayat'     => $riwayatBuyer,
                'rekomendasi' => $rekomendasiBuyer,
            ],
        ]);
    }

    /**
     * Bikin link WhatsApp click-to-chat dari string kontak + pesan.
     * Contoh input kontak: "0812-3456-7890 (Ibu Rina - PIC Dapur)".
     * Nomor diambil dari deretan angka pertama, lalu dinormalisasi ke format 62.
     */
    private function waLink(string $kontakMentah, string $pesan): string
    {
        // Ambil potongan angka pertama (minimal 8 digit termasuk pemisah).
        preg_match('/[\d\-\s]{8,}/', $kontakMentah, $m);
        $digits = preg_replace('/\D/', '', $m[0] ?? $kontakMentah);

        // Normalisasi ke format internasional Indonesia (62).
        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        } elseif (! str_starts_with($digits, '62')) {
            $digits = '62' . $digits;
        }

        return 'https://wa.me/' . $digits . '?text=' . rawurlencode($pesan);
    }

    /**
     * Hitung Scoring Kesehatan Koperasi dari DB (1-100)
     */
    private function kalkulasiKesehatanKoperasi(string $ref): array
    {
        $kategori            = [];
        $totalSkorTertimbang = 0;
        $rekomendasi         = [];

        $db = DB::connection('dataset_kemenkop');

        // ==========================================
        // 1. ANGGOTA (Bobot: 15%) - DATA ASLI
        // ==========================================
        try {
            $anggota = $db->selectOne("
                SELECT
                    COUNT(*) as total_anggota,
                    SUM(CASE WHEN LOWER(status_keanggotaan) = 'approved' THEN 1 ELSE 0 END) as anggota_aktif
                FROM anggota_koperasi
                WHERE koperasi_ref = ?
            ", [$ref]);

            $totalAnggota = $anggota->total_anggota ?? 0;
            $aktifAnggota = $anggota->anggota_aktif ?? 0;
        } catch (\Exception $e) {
            $totalAnggota = 0; $aktifAnggota = 0;
        }

        $persenAktif = $totalAnggota > 0 ? ($aktifAnggota / $totalAnggota) * 100 : 0;
        $skorAnggota = $totalAnggota > 0 ? round($persenAktif) : 40;

        if ($skorAnggota < 60) $rekomendasi[] = "Percepat proses approval anggota (status 'Requested') atau reaktivasi anggota pasif.";

        $kategori[] = [
            'key'     => 'anggota',
            'label'   => 'Keaktifan Anggota',
            'skor'    => $skorAnggota,
            'bobot'   => 15,
            'status'  => $this->tentukanStatus($skorAnggota),
            'catatan' => $totalAnggota > 0 ? "Terdapat {$aktifAnggota} anggota aktif (Approved) dari total {$totalAnggota} pendaftar." : "Belum ada pendaftaran anggota.",
            'detail'  => [
                ['label' => 'Total Terdaftar', 'nilai' => $totalAnggota],
                ['label' => 'Anggota Approved', 'nilai' => $aktifAnggota],
            ],
        ];
        $totalSkorTertimbang += ($skorAnggota * 0.15);

        // ==========================================
        // 2. SIMPANAN (Bobot: 15%) - DATA ASLI
        // ==========================================
        try {
            $simpanan = $db->selectOne("
                SELECT
                    SUM(jumlah_simpanan) as total_tagihan,
                    SUM(CASE WHEN LOWER(status) = 'paid' THEN jumlah_simpanan ELSE 0 END) as total_terbayar
                FROM simpanan_anggota
                WHERE koperasi_ref = ?
            ", [$ref]);

            $tagihan  = $simpanan->total_tagihan ?? 0;
            $terbayar = $simpanan->total_terbayar ?? 0;
        } catch (\Exception $e) {
            $tagihan = 0; $terbayar = 0;
        }

        $persenSimpanan = $tagihan > 0 ? ($terbayar / $tagihan) * 100 : 0;
        $skorSimpanan   = $tagihan > 0 ? round($persenSimpanan) : 40;

        if ($skorSimpanan < 70 && $tagihan > 0) $rekomendasi[] = "Tingkatkan *collection rate* simpanan wajib anggota (Masih banyak yang 'UNPAID').";

        $kategori[] = [
            'key'     => 'simpanan',
            'label'   => 'Kolektibilitas Simpanan',
            'skor'    => $skorSimpanan,
            'bobot'   => 15,
            'status'  => $this->tentukanStatus($skorSimpanan),
            'catatan' => $tagihan > 0 ? "Rasio simpanan terbayar mencapai {$skorSimpanan}% dari kewajiban." : "Belum ada pencatatan simpanan.",
            'detail'  => [
                ['label' => 'Total Tagihan', 'nilai' => 'Rp ' . number_format($tagihan, 0, ',', '.')],
                ['label' => 'Telah Dibayar (Paid)', 'nilai' => 'Rp ' . number_format($terbayar, 0, ',', '.')],
            ],
        ];
        $totalSkorTertimbang += ($skorSimpanan * 0.15);

        // ==========================================
        // 3. RAT (Bobot: 20%) - DATA ASLI
        // ==========================================
        try {
            $rat = $db->selectOne("
                SELECT tahun_buku, status_rat
                FROM rat_koperasi
                WHERE koperasi_ref = ?
                ORDER BY tahun_buku DESC LIMIT 1
            ", [$ref]);
            $tahunRat = $rat->tahun_buku ?? null;
        } catch (\Exception $e) {
            $tahunRat = null;
        }

        $tahunSekarang = (int) date('Y'); // Mengingat hackathon ini di 2026
        if ($tahunRat) {
            $selisih = $tahunSekarang - (int) $tahunRat;
            if ($selisih <= 1) $skorRat = 100;
            elseif ($selisih == 2) $skorRat = 70;
            else $skorRat = 40;
        } else {
            $skorRat = 30; // Belum pernah RAT sama sekali
            $rekomendasi[] = "Koperasi belum melaporkan Rapat Anggota Tahunan (RAT) di sistem.";
        }

        $kategori[] = [
            'key'     => 'rat',
            'label'   => 'Pelaksanaan RAT',
            'skor'    => $skorRat,
            'bobot'   => 20,
            'status'  => $this->tentukanStatus($skorRat),
            'catatan' => $tahunRat ? "RAT Terakhir dilakukan untuk tahun buku {$tahunRat}." : "Riwayat RAT tidak ditemukan.",
            'detail'  => [
                ['label' => 'Tahun Buku Terakhir', 'nilai' => $tahunRat ?? '-'],
            ],
        ];
        $totalSkorTertimbang += ($skorRat * 0.20);

        // ==========================================
        // 4. GERAI (Bobot: 10%) - DATA ASLI
        // ==========================================
        try {
            $gerai = $db->selectOne("
                SELECT
                    COUNT(*) as jml_gerai,
                    SUM(CASE WHEN LOWER(status_gerai) = 'aktif' THEN 1 ELSE 0 END) as gerai_aktif
                FROM gerai_koperasi
                WHERE koperasi_ref = ?
            ", [$ref]);

            $jmlGerai   = $gerai->jml_gerai ?? 0;
            $geraiAktif = $gerai->gerai_aktif ?? 0;
        } catch (\Exception $e) {
            $jmlGerai = 0; $geraiAktif = 0;
        }

        $skorGerai = $geraiAktif > 0 ? 80 + (min($geraiAktif, 4) * 5) : ($jmlGerai > 0 ? 50 : 30);

        $kategori[] = [
            'key'     => 'gerai',
            'label'   => 'Aktivitas Gerai Fisik',
            'skor'    => $skorGerai,
            'bobot'   => 10,
            'status'  => $this->tentukanStatus($skorGerai),
            'catatan' => $jmlGerai > 0 ? "Memiliki {$geraiAktif} gerai aktif dari {$jmlGerai} gerai." : "Koperasi tidak mendaftarkan gerai fisik.",
            'detail'  => [
                ['label' => 'Total Gerai', 'nilai' => $jmlGerai],
                ['label' => 'Gerai Aktif', 'nilai' => $geraiAktif],
            ],
        ];
        $totalSkorTertimbang += ($skorGerai * 0.10);

        // ==========================================
        // 5. ASET (Bobot: 15%) - DATA ASLI
        // ==========================================
        try {
            $aset = $db->selectOne("
                SELECT
                    COUNT(*) as total_aset,
                    SUM(CASE WHEN LOWER(status) = 'terverifikasi' THEN 1 ELSE 0 END) as aset_terverifikasi
                FROM aset_koperasi
                WHERE koperasi_ref = ?
            ", [$ref]);
            $jmlAset   = $aset->total_aset ?? 0;
            $verifAset = $aset->aset_terverifikasi ?? 0;
        } catch (\Exception $e) {
            $jmlAset = 0; $verifAset = 0;
        }

        $skorAset = $jmlAset > 0 ? 70 + (($verifAset / $jmlAset) * 30) : 40;

        $kategori[] = [
            'key'     => 'aset',
            'label'   => 'Pengelolaan Aset',
            'skor'    => round($skorAset),
            'bobot'   => 15,
            'status'  => $this->tentukanStatus($skorAset),
            'catatan' => $jmlAset > 0 ? "Memiliki {$jmlAset} aset yang didaftarkan ({$verifAset} terverifikasi)." : "Belum ada pencatatan aset inventaris/lahan.",
            'detail'  => [
                ['label' => 'Total Aset', 'nilai' => $jmlAset],
            ],
        ];
        $totalSkorTertimbang += ($skorAset * 0.15);

        // ==========================================
        // 6. DOKUMEN (Bobot: 10%) - DATA ASLI
        // ==========================================
        try {
            $dokumen = $db->selectOne("
                SELECT COUNT(*) as jml_dokumen FROM dokumen_koperasi WHERE koperasi_ref = ?
            ", [$ref]);
            $jmlDokumen = $dokumen->jml_dokumen ?? 0;
        } catch (\Exception $e) {
            $jmlDokumen = 0;
        }

        $skorDokumen = $jmlDokumen >= 3 ? 100 : ($jmlDokumen > 0 ? 75 : 30);
        if ($jmlDokumen == 0) $rekomendasi[] = "Unggah dokumen legalitas koperasi agar sistem dapat memverifikasi operasional.";

        $kategori[] = [
            'key'     => 'dokumen',
            'label'   => 'Kelengkapan Legalitas',
            'skor'    => $skorDokumen,
            'bobot'   => 10,
            'status'  => $this->tentukanStatus($skorDokumen),
            'catatan' => $jmlDokumen > 0 ? "Terdapat {$jmlDokumen} dokumen legal yang terunggah ke sistem." : "Berkas dokumen tidak lengkap.",
            'detail'  => [],
        ];
        $totalSkorTertimbang += ($skorDokumen * 0.10);

        // ==========================================
        // 7. PRODUK & TRANSAKSI (Bobot: 15%) - DATA ASLI
        // ==========================================
        try {
            $transaksi = $db->selectOne("
                SELECT
                    COUNT(*) as total_transaksi,
                    SUM(total_pembayaran) as total_omset
                FROM transaksi_penjualan
                WHERE koperasi_ref = ?
            ", [$ref]);

            $jmlTransaksi = $transaksi->total_transaksi ?? 0;
            $totalOmset   = $transaksi->total_omset ?? 0;
        } catch (\Exception $e) {
            $jmlTransaksi = 0; $totalOmset = 0;
        }

        $skorProduk = $jmlTransaksi > 50 ? 100 : ($jmlTransaksi > 0 ? 70 : 30);
        $kategori[] = [
            'key'     => 'produk_transaksi',
            'label'   => 'Volume Usaha (Transaksi)',
            'skor'    => $skorProduk,
            'bobot'   => 15,
            'status'  => $this->tentukanStatus($skorProduk),
            'catatan' => $jmlTransaksi > 0 ? "Tercatat transaksi sebesar Rp " . number_format($totalOmset, 0, ',', '.') . "." : "Belum ada transaksi terekam pada sistem.",
            'isBeta'  => false,
            'detail'  => [
                ['label' => 'Total Transaksi', 'nilai' => $jmlTransaksi],
                ['label' => 'Omset (Pembayaran)', 'nilai' => 'Rp ' . number_format($totalOmset, 0, ',', '.')],
            ],
        ];
        $totalSkorTertimbang += ($skorProduk * 0.15);

        // ==========================================
        // FINALISASI HASIL
        // ==========================================
        $skorAkhir = round($totalSkorTertimbang);

        if ($skorAkhir >= 80 && count($rekomendasi) == 0) {
            $rekomendasi[] = "Kondisi koperasi sangat sehat. Koperasi siap untuk eskalasi bisnis dan penyaluran permodalan/kredit.";
        }

        return [
            'skorTotal'        => $skorAkhir,
            'statusUmum'       => $this->tentukanStatus($skorAkhir),
            'kategori'         => $kategori,
            'rekomendasi'      => $rekomendasi,
            'terakhirDihitung' => \Carbon\Carbon::now()->isoFormat('D MMM Y, HH:mm') . ' WIB',

            // Mencegah frontend React (layar putih) karena masih mencari objek lama 'stats'
            'stats' => ['produkDianalisis' => 0],
        ];
    }

    /**
     * Konversi nilai menjadi string status
     */
    private function tentukanStatus(int $skor): string
    {
        if ($skor >= 75) return 'sehat';
        if ($skor >= 50) return 'cukup';
        return 'kurang';
    }

    private function buatNarasiDesa($r, bool $adaData): string
    {
        if (! $adaData) {
            return "Belum ada data nilai potensi komoditas yang tercatat untuk desa ini. "
                 . "Ini bukan berarti potensinya rendah — datanya saja yang belum diinput.";
        }

        $rupiah = 'Rp ' . number_format($r->total_potensi, 0, ',', '.');
        $sdm    = $r->total_sdm ? (int) $r->total_sdm : 0;

        return "Potensi ekonomi komoditas di desa ini diperkirakan senilai {$rupiah}, "
             . "melibatkan sekitar {$sdm} orang di {$r->jumlah_komoditas_total} jenis usaha "
             . "({$r->daftar_komoditas}).";
    }
}