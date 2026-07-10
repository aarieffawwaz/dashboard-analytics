import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import type { MinatBeliItem } from '@/types';

interface Props {
  items: MinatBeliItem[];
}

const statusColor: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'var(--amber-100)', text: 'var(--amber-600)' },
  approved: { bg: 'var(--green-100)', text: 'var(--green-600)' },
  rejected: { bg: 'var(--red-100)', text: 'var(--red-600)' },
};

export default function MinatBeli({ items }: Props) {
  const [confirmItem, setConfirmItem] = useState<{ item: MinatBeliItem; action: 'approve' | 'reject' } | null>(null);

  function runConfirm() {
    if (!confirmItem) return;
    router.patch(`/minat-beli/${confirmItem.item.id}/${confirmItem.action}`, {}, {
      onFinish: () => setConfirmItem(null),
    });
  }

  return (
    <AppLayout>
      <PageHeader
        title="Minat beli"
        subtitle={`${items.filter((i) => i.status === 'pending').length} menunggu persetujuan`}
      />

      {items.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Belum ada minat beli yang masuk.</p>
      )}

      {items.map((item) => {
        const color = statusColor[item.status];
        return (
          <div key={item.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{item.produk.nama}</p>
              <span className="badge" style={{ background: color.bg, color: color.text }}>{item.status}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 13 }}>{item.nama_buyer}</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
              {item.kontak_wa} · minat {item.volume_diminati ?? '-'} {item.produk.satuan_default}
            </p>
            {item.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary" style={{ flex: 1 }} onClick={() => setConfirmItem({ item, action: 'approve' })}>
                  Approve
                </button>
                <button className="danger" style={{ flex: 1 }} onClick={() => setConfirmItem({ item, action: 'reject' })}>
                  Tolak
                </button>
              </div>
            )}
          </div>
        );
      })}

      <Modal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title={confirmItem?.action === 'approve' ? 'Approve minat beli ini?' : 'Tolak minat beli ini?'}
      >
        {confirmItem && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {confirmItem.action === 'approve'
                ? `Kontak WA "${confirmItem.item.nama_buyer}" akan terhubung ke koperasi.`
                : `Minat beli dari "${confirmItem.item.nama_buyer}" akan ditolak.`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1 }} onClick={() => setConfirmItem(null)}>Batal</button>
              <button className={confirmItem.action === 'approve' ? 'primary' : 'danger'} style={{ flex: 1 }} onClick={runConfirm}>
                {confirmItem.action === 'approve' ? 'Ya, approve' : 'Ya, tolak'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </AppLayout>
  );
}
