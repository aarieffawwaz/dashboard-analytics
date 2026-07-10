export interface Koperasi {
  id: number;
  nama: string;
  wilayah: string | null;
  lat: string | null;
  lng: string | null;
  no_telp: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  koperasi_id: number;
  koperasi: Koperasi;
}

export interface Produk {
  id: number;
  nama: string;
  kategori: string | null;
  satuan_default: string;
}

export interface Transaksi {
  id: number;
  tipe: 'beli' | 'jual';
  nama_pihak: string;
  volume: string;
  satuan: string;
  harga_satuan: string;
  total: string;
  tanggal: string;
  produk: Produk;
}

export interface Listing {
  id: number;
  volume_tersedia: string;
  satuan: string;
  harga_satuan: string;
  status: 'aktif' | 'selesai';
  badge?: string;
  produk: Produk;
  koperasi: Koperasi;
}

export interface MinatBeliItem {
  id: number;
  nama_buyer: string;
  kontak_wa: string;
  volume_diminati: string | null;
  status: 'pending' | 'approved' | 'rejected';
  produk: Produk;
}

export interface SurplusItem {
  produk_id: number;
  nama_produk: string;
  satuan_default: string;
  total_beli: number;
  total_jual: number;
  surplus: number;
}

export interface Ringkasan {
  volume_bulan_ini: number;
  growth_persen: number | null;
  listing_aktif: number;
  minat_pending: number;
}

export interface TrenItem {
  bulan: string;
  total: number;
}

export interface AnalisisRow {
  produk: string;
  total_beli: number;
  total_jual: number;
  rasio_terjual: number;
  margin_persen: number | null;
}

export interface PageProps {
  auth: { user: User | null };
  flash?: { success?: string };
  [key: string]: unknown;
}

declare global {
  interface Window {
    L: any;
    Chart: any;
  }
}
