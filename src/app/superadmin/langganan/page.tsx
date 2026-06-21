'use client';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, Badge, type Column } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { SubscriptionPayment, SubscriptionStatus } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';

const statusTone: Record<SubscriptionStatus, 'amber' | 'blue' | 'green' | 'red' | 'slate'> = {
  PENDING: 'amber', WAITING_VERIFICATION: 'blue', VERIFIED: 'green', REJECTED: 'red', EXPIRED: 'slate',
};
const statusLabel: Record<SubscriptionStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  WAITING_VERIFICATION: 'Menunggu Verifikasi',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
};
const TABS: { v?: SubscriptionStatus; label: string }[] = [
  { v: 'WAITING_VERIFICATION', label: 'Menunggu' },
  { v: 'VERIFIED', label: 'Terverifikasi' },
  { v: 'REJECTED', label: 'Ditolak' },
  { v: undefined, label: 'Semua' },
];

export default function SuperadminLanggananPage() {
  const [data, setData] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [tab, setTab] = useState<SubscriptionStatus | undefined>('WAITING_VERIFICATION');
  const [detail, setDetail] = useState<SubscriptionPayment | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (status?: SubscriptionStatus) => {
    setLoading(true);
    try { setData((await subscriptionService.listPayments(status)) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  async function openDetail(id: number) {
    try { setDetail(await subscriptionService.getPayment(id)); setRejectMode(false); setReason(''); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function verify() {
    if (!detail) return; setBusy(true);
    try { await subscriptionService.verify(detail.ID); toast.success('Pembayaran diverifikasi, merchant menjadi PRO'); setDetail(null); load(tab); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function reject() {
    if (!detail) return; setBusy(true);
    try { await subscriptionService.reject(detail.ID, reason); toast.success('Pembayaran ditolak'); setDetail(null); load(tab); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const columns: Column<SubscriptionPayment>[] = [
    { header: 'Merchant', accessor: (r) => <span className="font-semibold text-slate-800">{r.merchant?.NAMA || `#${r.ID}`}</span> },
    { header: 'Paket', accessor: (r) => r.PAKET },
    { header: 'Nominal asli', accessor: (r) => formatRupiah(r.HARGA) },
    { header: 'Kode', accessor: (r) => <span className="font-mono">{r.KODE_UNIK}</span> },
    { header: 'Total bayar', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL_BAYAR)}</span> },
    { header: 'Tanggal', accessor: (r) => formatDateTime(r.PAID_AT || r.CREATED_AT || '') },
    { header: 'Status', accessor: (r) => <Badge tone={statusTone[r.STATUS]} dot>{statusLabel[r.STATUS]}</Badge> },
    { header: 'Aksi', accessor: (r) => <Button size="sm" variant="outline" onClick={() => openDetail(r.ID)}>Detail</Button> },
  ];

  return (
    <div>
      <PageHeader title="Pembayaran Langganan" description="Verifikasi pembayaran PRO dari merchant (QRIS manual Zona Kasir)." />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button key={t.label} onClick={() => setTab(t.v)}
            className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.v ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50')}>
            {t.label}
          </button>
        ))}
      </div>
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber emptyTitle="Tidak ada pembayaran" /></CardBody></Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Pembayaran" size="sm">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Merchant</span><span className="font-semibold">{detail.merchant?.NAMA}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Email</span><span>{detail.merchant?.EMAIL || '-'}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Paket</span><span>{detail.PAKET}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Nominal asli</span><span>{formatRupiah(detail.HARGA)}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Kode unik</span><span className="font-mono font-bold">{detail.KODE_UNIK}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><span>Total bayar</span><span className="text-primary">{formatRupiah(detail.TOTAL_BAYAR)}</span></div>
            </div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><Badge tone={statusTone[detail.STATUS]} dot>{statusLabel[detail.STATUS]}</Badge></div>
            {detail.BUKTI_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.BUKTI_URL} alt="Bukti bayar" className="max-h-72 w-full rounded-xl border object-contain" />
            ) : <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Tidak ada bukti diupload.</p>}

            {rejectMode ? (
              <div className="space-y-2">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan..."
                  className="h-20 w-full rounded-xl border border-line p-3 text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRejectMode(false)} disabled={busy}>Batal</Button>
                  <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={reject} loading={busy}>Tolak</Button>
                </div>
              </div>
            ) : (detail.STATUS === 'WAITING_VERIFICATION' || detail.STATUS === 'PENDING') ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setRejectMode(true)}>
                  <XCircle className="h-4 w-4" /> Tolak
                </Button>
                <Button className="flex-1" onClick={verify} loading={busy}>
                  <CheckCircle2 className="h-4 w-4" /> Verifikasi
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
