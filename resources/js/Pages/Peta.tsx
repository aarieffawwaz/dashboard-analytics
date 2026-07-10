import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import type { Koperasi, Listing } from '@/types';

interface Props {
  koperasiSaya: Koperasi;
  listings: Listing[];
}

export default function Peta({ koperasiSaya, listings }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!window.L || !containerRef.current) {
      setError(true);
      return;
    }

    const hasHome = Boolean(koperasiSaya?.lat && koperasiSaya?.lng);
    const centerLat = hasHome ? Number(koperasiSaya.lat) : -2.5;
    const centerLng = hasHome ? Number(koperasiSaya.lng) : 118;
    const zoom = hasHome ? 11 : 5;

    const map = window.L.map(containerRef.current).setView([centerLat, centerLng], zoom);
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 18,
    }).addTo(map);

    if (hasHome) {
      window.L.circleMarker([centerLat, centerLng], { radius: 9, color: '#166534', fillColor: '#166534', fillOpacity: 1, weight: 2 })
        .addTo(map)
        .bindPopup(`<strong>${koperasiSaya.nama}</strong><br>Koperasi kamu`);
    }

    listings.forEach((l) => {
      if (!l.koperasi?.lat) return;
      window.L.circleMarker([Number(l.koperasi.lat), Number(l.koperasi.lng)], { radius: 7, color: '#C2610D', fillColor: '#C2610D', fillOpacity: 0.85, weight: 1 })
        .addTo(map)
        .bindPopup(`<strong>${l.produk.nama}</strong><br>${l.koperasi.nama}<br>Rp ${Math.round(Number(l.harga_satuan)).toLocaleString('id-ID')} / ${l.satuan}`);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [koperasiSaya, listings]);

  return (
    <AppLayout>
      <PageHeader title="Peta permintaan" subtitle={`${listings.length} koperasi lain sedang menawarkan produk`} />

      {error && <p style={{ fontSize: 13, color: 'var(--red-600)' }}>Peta gagal dimuat. Cek koneksi internet.</p>}

      <div ref={containerRef} style={{ height: 420, borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface-1)' }}></div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        Titik hijau adalah koperasi kamu. Titik oranye adalah koperasi lain yang punya listing aktif di marketplace.
      </p>
    </AppLayout>
  );
}
