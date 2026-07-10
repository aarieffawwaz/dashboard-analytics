# Product Requirements Document (PRD) - Dashboard Analytics (Simkopdes)

Dokumen singkat untuk memahami alur proses bisnis, logika data, dan arsitektur aplikasi.

---

## 1. Overview & Stack
*   **Tujuan:** Dashboard analisis potensi ekonomi dan kesehatan koperasi berbasis dataset Kementerian Koperasi (Kemenkop).
*   **Arsitektur:** Monolith Laravel 13 (PHP) + React 19 (TypeScript) + TailwindCSS v4.
*   **Jembatan:** Inertia.js (routing ditangani Laravel, data dilempar sebagai props langsung ke React).

---

## 2. Proses Bisnis & Fitur Utama

Aplikasi ini berjalan sebagai prototipe satu halaman utama dengan 4 Tab:

### A. Login (Pilih Koperasi)
*   **Logic:** Tanpa password. User memilih nama koperasi dari database PostgreSQL `profil_koperasi` yang memiliki koordinat geografis.
*   **Session:** ID koperasi disimpan di session (`koperasi_ref` dan `koperasi_nama`).

### B. Tab 1: Analisis Usaha (Scoring Kesehatan Koperasi)
Menghitung skor kesehatan koperasi (skala 1-100) menggunakan rata-rata tertimbang dari **7 Kategori Data Asli**:
1.  **Keaktifan Anggota (Bobot 15%):** Rasio anggota berstatus *Approved* dibanding total terdaftar.
2.  **Kolektibilitas Simpanan (Bobot 15%):** Rasio simpanan berstatus *Paid* (telah dibayar) dari total tagihan.
3.  **Pelaksanaan RAT (Bobot 20%):** Kecepatan laporan Rapat Anggota Tahunan (RAT terbaru = 100, 2 tahun lalu = 70, belum pernah = 30).
4.  **Aktivitas Gerai Fisik (Bobot 10%):** Skor berdasarkan jumlah gerai fisik yang berstatus *Aktif*.
5.  **Pengelolaan Aset (Bobot 15%):** Rasio aset yang berstatus *Terverifikasi* dibanding total aset terdaftar.
6.  **Kelengkapan Legalitas (Bobot 10%):** Kelengkapan berkas dokumen legalitas (>=3 file = 100, 0 file = 30).
7.  **Volume Usaha/Transaksi (Bobot 15%):** Skor keaktifan transaksi penjualan (>50 transaksi = 100, 0 transaksi = 30).

*   **Output Status:** `sehat` (Skor >= 75), `cukup` (Skor >= 50), `kurang` (Skor < 50).

### C. Tab 2: Potensi Desa
*   **Logic:** Menghitung total potensi ekonomi komoditas desa nasional menggunakan `PERCENT_RANK()` di PostgreSQL (`referensi_komoditas_desa`), kemudian memotong hasilnya untuk desa-desa di sekitar wilayah koperasi terpilih.
*   **Output:** List desa terdekat, peta koordinat, jenis komoditas, jumlah SDM terlibat, dan skor potensi desa (persentil).

### D. Tab 3: Data Buyer (B2B Smart Matching)
*   **Logic:** Mencocokkan komoditas unggulan koperasi dengan program/institusi eksternal terdekat melalui algoritma pencocokan mock data:
    1.  **Program Makan Bergizi Gratis (MBG):** Dapur umum sekolah (SDN) terdekat yang butuh sayur/telur.
    2.  **Kesehatan (SatuSehat):** Puskesmas terdekat yang butuh jamu/herbal.
    3.  **Bantuan Sosial (DTKS):** Agen bansos terdekat yang butuh beras/minyak premium.
*   **WhatsApp Integration:** Menghasilkan link WhatsApp template penawaran otomatis berdasarkan nama PIC, jarak wilayah, dan rincian produk koperasi.

### E. Tab 4: Nilai Tambah (Skalabilitas Usaha)
*   **Logic:** Memberikan rekomendasi taktis peningkatan margin komoditas (misalnya mengolah gabah menjadi beras kemasan daripada menjual gabah mentah).

---

## 3. Desain Database
Aplikasi menggunakan **dua koneksi database**:
1.  **Database Utama (SQLite - `database.sqlite`):** Digunakan secara lokal untuk menyimpan log session, cache, dan data dummy migration.
2.  **Database Dataset Kemenkop (PostgreSQL):** Di-host secara remote di Google Cloud (`34.101.155.200`). Semua query analisis, data profil koperasi, wilayah, transaksi, dan komoditas langsung ditarik dari database cloud ini.

---

## ⚠️ Temuan Kritis / Bug di Backend
Pada file `DashboardAnalyticsController.php`, Inertia mengembalikan data untuk render halaman `Index.tsx`. Namun, ada **data yang hilang**:
*   React frontend (`Index.tsx`) membutuhkan prop `nilaiTambah` (`props.nilaiTambah` berisi data statistik dan daftar rekomendasi nilai tambah).
*   **Masalah:** Controller backend **lupa mengirimkan key `nilaiTambah`** di return payload-nya. 
*   **Akibat:** Jika Anda menjalankan aplikasi dan mengklik **Tab "Nilai Tambah"**, aplikasi React akan langsung **crash (layar putih / JavaScript TypeError)** karena mencoba membaca properti dari `undefined`.

*Rekomendasi Perbaikan:* Backend perlu ditambahkan query/mock data untuk key `nilaiTambah` sesuai tipe data interface React (`type.ts`) agar tab tersebut dapat diakses tanpa crash.
