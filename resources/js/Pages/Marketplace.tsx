import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import Logo from '@/Components/Logo';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import type { Listing } from '@/types';

interface Props {
  listings: Listing[];
}

const badgeColor: Record<string, { bg: string; text: string }> = {
  'baru diposting': { bg: 'var(--blue-100)', text: 'var(--blue-600)' },
  'butuh pembeli': { bg: 'var(--amber-100)', text: 'var(--amber-600)' },
  'cepat laku': { bg: 'var(--green-100)', text: 'var(--green-600)' },
  tersedia: { bg: 'var(--surface-2)', text: 'var(--text-secondary)' },
};

export default function Marketplace({ listings }: Props) {
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function openMinat(listing: Listing) {
    setActiveListing(listing);
    setNama('');
    setKontak('');
    setSent(false);
  }

  function submitMinat() {
    if (!activeListing || !nama || !kontak) return;
    setSending(true);
    router.post(`/marketplace/${activeListing.id}/minat`, {
      nama_buyer: nama,
      kontak_wa: kontak,
      volume_diminati: activeListing.volume_tersedia,
    }, {
      onFinish: () => {
        setSending(false);
        setSent(true);
      },
    });
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 20px 3rem' }}>
      <div style={{ marginBottom: 28 }}>
        <Logo height={26} />
      </div>

      <PageHeader title="Produk desa tersedia" subtitle={`${listings.length} listing aktif`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {listings.map((listing) => {
          const color = badgeColor[listing.badge ?? 'tersedia'] ?? badgeColor.tersedia;
          return (
            <div key={listing.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <span className="badge" style={{ background: color.bg, color: color.text }}>{listing.badge}</span>
              </div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15 }}>{listing.produk.nama}</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{listing.koperasi.nama}</p>
              <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>
                Rp {Math.round(Number(listing.harga_satuan)).toLocaleString('id-ID')} / {listing.satuan}
              </p>
              <button className="primary" style={{ width: '100%' }} onClick={() => openMinat(listing)}>Kirim minat beli</button>
            </div>
          );
        })}
      </div>

      {listings.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Belum ada produk yang ditawarkan.</p>}

      <Modal open={!!activeListing} onClose={() => setActiveListing(null)} title={sent ? 'Terkirim' : 'Kirim minat beli'}>
        {activeListing && !sent && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18 }}>
              {activeListing.produk.nama} · {activeListing.koperasi.nama}
            </p>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama kamu</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} style={{ width: '100%', marginBottom: 14 }} autoFocus />
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Nomor WhatsApp</label>
            <input value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="0812xxxxxxxx" style={{ width: '100%', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1 }} onClick={() => setActiveListing(null)}>Batal</button>
              <button className="primary" style={{ flex: 1 }} disabled={sending || !nama || !kontak} onClick={submitMinat}>
                {sending ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </>
        )}
        {sent && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--green-600)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Minat beli terkirim. Koperasi akan menghubungi kamu lewat WhatsApp.
            </p>
            <button className="primary" style={{ width: '100%' }} onClick={() => setActiveListing(null)}>Tutup</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
