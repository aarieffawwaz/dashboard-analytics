import { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { LineChart, TrendingUp, Store, BellRing, AlertTriangle, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import type { Ringkasan, SurplusItem, Transaksi, TrenItem } from '@/types';

interface Props {
  ringkasan: Ringkasan;
  tren: TrenItem[];
  surplus: SurplusItem[];
  transaksiTerbaru: Transaksi[];
}

const metricConfig = [
  { key: 'volume_bulan_ini' as const, label: 'Volume bulan ini', Icon: LineChart, color: 'var(--accent-blue)', bg: 'var(--blue-100)', isRupiah: true },
  { key: 'growth_persen' as const, label: 'Growth', Icon: TrendingUp, color: 'var(--green-600)', bg: 'var(--green-100)', isPercent: true },
  { key: 'listing_aktif' as const, label: 'Listing aktif', Icon: Store, color: 'var(--purple-600)', bg: 'var(--purple-100)' },
  { key: 'minat_pending' as const, label: 'Minat menunggu', Icon: BellRing, color: 'var(--amber-600)', bg: 'var(--amber-100)' },
];

const rupiah = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

export default function Dashboard({ ringkasan, tren, surplus, transaksiTerbaru }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [postingItem, setPostingItem] = useState<SurplusItem | null>(null);
  const [harga, setHarga] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!window.Chart || !chartRef.current) return;

    const labels = tren.map((d) => {
      const [y, m] = d.bulan.split('-');
      return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short' });
    });
    const values = tren.map((d) => d.total);

    const ctx = chartRef.current.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.16)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#2563EB',
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#2563EB',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
          y: {
            grid: { color: '#F1F3F6' },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (v: number) => 'Rp ' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'jt' : (v / 1000).toFixed(0) + 'rb'),
            },
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [tren]);

  function openPosting(item: SurplusItem) {
    setPostingItem(item);
    setHarga('5000');
  }

  function submitPosting() {
    if (!postingItem || !harga) return;
    setSaving(true);
    router.post('/listing', {
      produk_id: postingItem.produk_id,
      volume_tersedia: postingItem.surplus,
      satuan: postingItem.satuan_default,
      harga_satuan: harga,
    }, {
      onFinish: () => {
        setSaving(false);
        setPostingItem(null);
      },
    });
  }

  function formatMetric(cfg: typeof metricConfig[number], value: number | null) {
    if (value === null || value === undefined) return '-';
    if (cfg.isRupiah) return rupiah(value);
    if (cfg.isPercent) return `${value}%`;
    return value;
  }

  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="Ringkasan performa koperasi kamu" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        {metricConfig.map((cfg) => (
          <div className="metric" key={cfg.key}>
            <div className="icon-badge" style={{ background: cfg.bg, color: cfg.color }}>
              <cfg.Icon size={19} strokeWidth={2.2} />
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{cfg.label}</p>
            <p className="metric-value">{formatMetric(cfg, ringkasan[cfg.key])}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14 }}>Tren penjualan 6 bulan terakhir</p>
        <div style={{ height: 220 }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {surplus.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle size={16} style={{ color: 'var(--amber-600)', marginRight: 6, verticalAlign: -3 }} />
            {surplus.length} produk surplus siap diposting
          </p>
          {surplus.map((item) => (
            <div key={item.produk_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13 }}>{item.nama_produk} · sisa {item.surplus} {item.satuan_default}</span>
              <button onClick={() => openPosting(item)}>Posting</button>
            </div>
          ))}
        </div>
      )}

      <Link href="/transaksi/baru" className="primary" style={{ display: 'block', textAlign: 'center', width: '100%', padding: 12, marginBottom: 24, textDecoration: 'none', boxSizing: 'border-box', borderRadius: 10 }}>
        <Plus size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
        Catat transaksi
      </Link>

      <div className="card">
        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>Transaksi terakhir</p>
        {transaksiTerbaru.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>Belum ada transaksi tercatat.</p>
        )}
        {transaksiTerbaru.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge" style={{ background: t.tipe === 'beli' ? 'var(--teal-100)' : 'var(--amber-100)', color: t.tipe === 'beli' ? 'var(--teal-600)' : 'var(--amber-600)' }}>
                {t.tipe}
              </span>
              <span style={{ fontSize: 13 }}>{t.produk.nama} · {t.nama_pihak}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rupiah(Number(t.total))}</span>
          </div>
        ))}
      </div>

      <Modal open={!!postingItem} onClose={() => setPostingItem(null)} title="Posting ke marketplace">
        {postingItem && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {postingItem.nama_produk} · sisa {postingItem.surplus} {postingItem.satuan_default}
            </p>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Harga jual per {postingItem.satuan_default}
            </label>
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              style={{ width: '100%', marginBottom: 20 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1 }} onClick={() => setPostingItem(null)}>Batal</button>
              <button className="primary" style={{ flex: 1 }} disabled={saving || !harga} onClick={submitPosting}>
                {saving ? 'Memposting...' : 'Posting'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </AppLayout>
  );
}
