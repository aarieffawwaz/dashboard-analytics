export interface AnalisisInsight {
    produk: string;
    status: "optimal" | "perhatian";
    confidence: number;
    catatan: string;
}

// ====== KESEHATAN KOPERASI (baru — pengganti makna "Analisis Usaha") ======
export type StatusKesehatan = "sehat" | "cukup" | "kurang";

export interface KesehatanKategoriDetail {
    label: string;
    nilai: string | number;
    keterangan?: string;
}

export interface KesehatanKategori {
    key:
        | "anggota"
        | "simpanan"
        | "rat"
        | "gerai"
        | "aset"
        | "dokumen"
        | "produk_transaksi";
    label: string;
    skor: number; // 0-100
    bobot: number; // persentase bobot kategori ini terhadap skorTotal
    status: StatusKesehatan;
    catatan: string;
    detail: KesehatanKategoriDetail[];
    isBeta?: boolean; // true utk kategori yang datanya masih dalam pengembangan (Produk & Transaksi)
}

export interface KesehatanKoperasi {
    skorTotal: number; // rata-rata tertimbang seluruh kategori
    statusUmum: StatusKesehatan;
    kategori: KesehatanKategori[];
    rekomendasi: string[]; // saran aksi dari Kora Think
    terakhirDihitung: string; // ditampilkan sebagai teks, mis. "10 Jul 2026, 08:30 WIB"
}
// ====== END KESEHATAN KOPERASI ======

export interface DesaPotensi {
    nama: string;
    lat: number;
    lng: number;
    komoditas: string;
    skorPotensi: number;
    catatanAI: string;
    koperasi?: string;
    kecamatan?: string;
    produksiTon?: number;
    kebutuhanPasar?: number;
    milikKoperasi?: boolean;
}

export interface BuyerRiwayat {
    nama: string;
    produkDibeli: string;
    frekuensi: number;
    kategoriPreferensi: string;
}

export interface RekomendasiBuyer {
    desa: string;
    buyer: string;
    alasan: string;
    kontak: string; // Tambahan baru
    jarak: number; // Tambahan baru (angka dalam km)
    logo: string; // Tambahan baru (url gambar)
}

export interface RekomendasiNilaiTambah {
    produk: string;
    insightGabungan: string;
    aksi: string;
    dampakEstimasi: string;
}

// Samain persis sama payload 'koperasi' di DashboardAnalyticsController@index
export interface KoperasiProfil {
    ref: string;
    nama: string;
    wilayah: string;
    lat: number;
    lng: number;
}

export interface DashboardProps {
    koperasi: KoperasiProfil; // WAJIB ada, controller selalu redirect ke login kalau kosong
    analisisUsaha: KesehatanKoperasi;
    petaPotensi: {
        stats: Record<string, number>;
        desaList: DesaPotensi[];
        pusat?: { lat: number; lng: number };
    };
    buyerHistory: {
        stats: Record<string, number>;
        riwayat: BuyerRiwayat[];
        rekomendasi: RekomendasiBuyer[];
    };
    nilaiTambah: {
        stats: Record<string, number>;
        rekomendasi: RekomendasiNilaiTambah[];
    };
}
