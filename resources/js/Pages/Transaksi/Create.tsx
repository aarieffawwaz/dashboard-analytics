import { useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import type { Produk } from '@/types';

interface Props {
  produkList: Produk[];
}

export default function Create({ produkList }: Props) {
  const { data, setData, post, processing } = useForm({
    tipe: 'beli' as 'beli' | 'jual',
    produk_id: produkList[0]?.id ?? '',
    nama_pihak: '',
    volume: '',
    satuan: produkList[0]?.satuan_default ?? 'kg',
    harga_satuan: '',
  });

  const total = useMemo(() => {
    const v = parseFloat(data.volume) || 0;
    const h = parseFloat(data.harga_satuan) || 0;
    return v * h;
  }, [data.volume, data.harga_satuan]);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/transaksi');
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <PageHeader
          title="Catat transaksi"
          subtitle={data.tipe === 'beli' ? 'Pembelian hasil panen dari petani' : 'Penjualan ke buyer / offtaker'}
        />

        <div className="card">
          <form onSubmit={submit}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setData('tipe', 'beli')}
                style={{ flex: '1 1 140px', fontWeight: 600, borderColor: data.tipe === 'beli' ? 'var(--teal-600)' : undefined, color: data.tipe === 'beli' ? 'var(--teal-700)' : undefined, background: data.tipe === 'beli' ? 'var(--teal-100)' : undefined }}
              >
                Beli dari petani
              </button>
              <button
                type="button"
                onClick={() => setData('tipe', 'jual')}
                style={{ flex: '1 1 140px', fontWeight: 600, borderColor: data.tipe === 'jual' ? 'var(--teal-600)' : undefined, color: data.tipe === 'jual' ? 'var(--teal-700)' : undefined, background: data.tipe === 'jual' ? 'var(--teal-100)' : undefined }}
              >
                Jual ke buyer
              </button>
            </div>

            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {data.tipe === 'beli' ? 'Nama petani / anggota' : 'Nama buyer'}
            </label>
            <input
              value={data.nama_pihak}
              onChange={(e) => setData('nama_pihak', e.target.value)}
              placeholder={data.tipe === 'beli' ? 'Pak Budi' : 'Katering RS Kecamatan'}
              style={{ width: '100%', marginBottom: 14 }}
              required
            />

            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Produk</label>
            <select value={data.produk_id} onChange={(e) => setData('produk_id', e.target.value as any)} style={{ width: '100%', marginBottom: 14 }}>
              {produkList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 160px' }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Volume</label>
                <input type="number" value={data.volume} onChange={(e) => setData('volume', e.target.value)} style={{ width: '100%' }} required />
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Satuan</label>
                <select value={data.satuan} onChange={(e) => setData('satuan', e.target.value)} style={{ width: '100%' }}>
                  <option>kg</option>
                  <option>ikat</option>
                  <option>karung</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Harga per satuan</label>
            <input type="number" value={data.harga_satuan} onChange={(e) => setData('harga_satuan', e.target.value)} style={{ width: '100%', marginBottom: 16 }} required />

            <div className="metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</span>
              <span className="metric-value" style={{ fontSize: 20 }}>Rp {Math.round(total).toLocaleString('id-ID')}</span>
            </div>

            <button type="submit" className="primary" disabled={processing} style={{ width: '100%', padding: 13 }}>
              {processing ? 'Menyimpan...' : 'Simpan transaksi'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
