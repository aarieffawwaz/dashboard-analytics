# Product Requirements Document (PRD) - Dashboard Analytics (Simkopdes)

Dokumen ini menjelaskan detail fitur, logika bisnis, dan perhitungan data pada modul Dashboard Analytics (Simkopdes).

---

## 1. Overview & Stack
*   **Tujuan:** Dashboard analisis potensi regional, kesehatan internal, dan perluasan pasar B2B bagi koperasi berdasarkan dataset riil Kementerian Koperasi (Kemenkop).
*   **Stack:** Monolith Laravel 13 (PHP) + React 19 (TypeScript) + TailwindCSS v4 + Inertia.js.

---

## 2. Detail Fitur & Logika Bisnis Utama

Dashboard dirancang dalam satu halaman utama yang terbagi menjadi 4 modul (Tab) berbasis data koperasi yang terpilih pada sesi login.

### A. Login & Management Session Koperasi
*   **Fitur:** Peta pilihan koperasi di halaman login. Hanya menampilkan koperasi yang datanya memiliki titik koordinat (`koordinat_dibulatkan`).
*   **Logika Bisnis:** Saat user memilih satu koperasi, sistem menyimpan `koperasi_ref` dan `nama_koperasi` ke dalam session. Seluruh data di dashboard utama otomatis terfilter hanya untuk koperasi yang aktif di session ini.

---

### B. Tab 1: Analisis Usaha (Cooperative Health Index)
Fitur ini mengukur kesehatan internal koperasi secara real-time dengan menghitung skor indeks (1-100) menggunakan **rata-rata tertimbang (weighted average)** dari 7 indikator kinerja operasional:

| Indikator | Bobot | Logika & Cara Perhitungan Skor |
| :--- | :---: | :--- |
| **Keaktifan Anggota** | 15% | Persentase anggota berstatus `Approved` dari total pendaftar. Jika anggota > 0, skor = `(anggota_aktif / total_anggota) * 100`. Jika 0, skor default = `40`. |
| **Kolektibilitas Simpanan** | 15% | Persentase nominal simpanan wajib berstatus `Paid` dari total tagihan simpanan wajib anggota. Skor = `(simpanan_paid / total_tagihan) * 100`. Jika tidak ada tagihan, skor default = `40`. |
| **Pelaksanaan RAT** | 20% | Diukur dari tahun buku Rapat Anggota Tahunan (RAT) terakhir yang dilaporkan. Selisih <= 1 tahun dari tahun berjalan = `100`; selisih 2 tahun = `70`; selisih > 2 tahun = `40`; belum pernah RAT = `30`. |
| **Aktivitas Gerai Fisik** | 10% | Diukur dari jumlah gerai fisik yang berstatus `Aktif`. Jika gerai aktif > 0, skor = `80 + (min(gerai_aktif, 4) * 5)` (maksimal 100). Jika ada gerai tapi tidak aktif = `50`. Jika tidak punya gerai = `30`. |
| **Pengelolaan Aset** | 15% | Rasio inventaris/lahan koperasi yang telah diverifikasi oleh dinas. Jika aset > 0, skor = `70 + ((aset_terverifikasi / total_aset) * 30)`. Jika tidak memiliki aset terdaftar = `40`. |
| **Kelengkapan Legalitas** | 10% | Kelengkapan unggahan berkas hukum (NIB, SIUP, Akta Pendirian, dll). Jika berkas terunggah >= 3 dokumen = `100`; jika > 0 dokumen = `75`; jika kosong = `30`. |
| **Volume Transaksi** | 15% | Diukur dari frekuensi penjualan koperasi. Jika jumlah transaksi > 50 = `100`; jika > 0 transaksi = `70`; jika tidak ada transaksi terekam = `30`. |

#### Logika Status Umum & Rekomendasi Pintar (Action Items):
*   **Total Skor:** Dijumlahkan berdasarkan hasil perkalian skor kategori dengan bobotnya masing-masing.
*   **Kategori Status:**
    *   **Sehat:** Skor Total `>= 75`.
    *   **Cukup Sehat:** Skor Total `50 - 74`.
    *   **Kurang Sehat:** Skor Total `< 50`.
*   **Pemicu Rekomendasi:** Jika salah satu indikator mendapat skor di bawah ambang batas (threshold), sistem otomatis memicu rekomendasi taktis (misal: *"Tingkatkan collection rate simpanan wajib anggota"* jika skor Simpanan < 70%).

---

### C. Tab 2: Potensi Desa (Regional Resource Mapping)
Fitur ini memetakan komoditas unggulan desa di sekitar wilayah operasi koperasi untuk memandu ekspansi wilayah kerja atau kemitraan petani.

*   **Logika Penentuan Skor Potensi Desa (Percent Rank):**
    Sistem melakukan kalkulasi peringkat nasional menggunakan fungsi window `PERCENT_RANK()` terhadap total nilai potensi desa dari tabel `referensi_komoditas_desa`.
    $$\text{Skor Potensi (Persentil)} = \text{ROUND}(\text{PERCENT\_RANK}() \times 100)$$
    *Nilai ini menunjukkan seberapa unggul potensi ekonomi komoditas suatu desa dibanding seluruh desa lain di Indonesia.*
*   **Logika Filter Wilayah Kerja Koperasi:**
    Sistem mengambil data kecamatan/kabupaten yang dicakup oleh koperasi terpilih (dari tabel `referensi_koperasi_wilayah`). Hasil skor potensi desa nasional di atas kemudian difilter sehingga hanya memunculkan desa-desa yang berada di kecamatan cakupan koperasi tersebut.
*   **Peta & Klasifikasi Kepemilikan Wilayah:**
    Desa diklasifikasikan menjadi dua status pada peta:
    1.  **Milik Koperasi (Active Territory):** Desa yang memang sudah masuk ke wilayah binaan koperasi aktif.
    2.  **Potensi Ekspansi (Potential Territory):** Desa di kecamatan sekitar yang belum dibina oleh koperasi aktif tersebut, tetapi memiliki komoditas unggulan bernilai tinggi.
*   **AI Narrative Generator:**
    Sistem merangkum data tabel komoditas desa secara otomatis menjadi narasi bahasa alami, misal: *"Potensi ekonomi komoditas di desa ini diperkirakan senilai Rp X, melibatkan Y orang di Z jenis usaha (Komoditas A, B, C)."*

---

### D. Tab 3: Data Buyer (B2B Matchmaking & Outreach)
Fitur ini mencocokkan komoditas yang diproduksi koperasi dengan kebutuhan pembeli institusional terdekat untuk memotong rantai distribusi.

*   **Logika Matchmaking B2B:**
    Aplikasi memetakan komoditas koperasi ke 3 dataset program prioritas nasional terdekat:
    1.  **Program Makan Bergizi Gratis (MBG):** Mengintegrasikan data Dapodik/BGN untuk mencocokkan pasokan bahan pangan koperasi (sayur, telur, jagung) dengan kebutuhan dapur umum sekolah (SDN) terdekat.
    2.  **Kesehatan (SatuSehat):** Mencocokkan pasokan produk obat herbal / jamu milik koperasi dengan kebutuhan pengadaan faskes/puskesmas terdekat.
    3.  **Bantuan Sosial (DTKS/Bappenas):** Mencocokkan stok sembako (beras premium, minyak goreng, gula) milik koperasi dengan agen penyalur bantuan sosial di desa prioritas.
*   **WhatsApp Outreach Automation:**
    Sistem otomatis mengonversi data kontak pembeli (misal format lokal `08...`) menjadi format internasional (`62...`), melakukan URL encoding pada pesan penawaran terstruktur yang memuat nama koperasi, spesifikasi komoditas yang dicocokkan, jarak pengiriman (km), serta template ajakan kerja sama resmi, dan menyediakannya sebagai tombol *Direct Chat*.

---

### E. Tab 4: Nilai Tambah (Value-Add Recommendations)
Fitur ini mendorong hilirisasi komoditas mentah anggota koperasi agar dapat diproses menjadi produk olahan dengan margin keuntungan lebih tinggi.

*   **Katalog Analisis Produk Mentah:**
    Menampilkan data jumlah komoditas mentah yang saat ini diproduksi oleh anggota (misal: Gabah Kering Giling, Susu Sapi Segar).
*   **Logika Rekomendasi Skalabilitas (Hilirisasi):**
    Untuk setiap komoditas mentah, sistem menyediakan:
    1.  **Insight Gabungan:** Penjelasan potensi peningkatan nilai (misal: *"Mengolah Susu Sapi Segar menjadi Mentega atau Keju Olahan meningkatkan margin keuntungan hingga 120%"*).
    2.  **Action Item Taktis:** Langkah nyata yang harus diambil pengurus koperasi (misal: *"Pengadaan mesin pemisah krim susu skala mikro"* atau *"Pengajuan sertifikasi BPOM produk beras"*).
    3.  **Estimasi Dampak Finansial:** Proyeksi persentase peningkatan margin usaha setelah hilirisasi dieksekusi.
