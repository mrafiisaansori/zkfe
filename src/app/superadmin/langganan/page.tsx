'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, Badge, type Column } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { SubscriptionPayment, SubscriptionStatus } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';

const statusTone: Record<SubscriptionStatus, 'amber' | 'blue' | 'green' | 'red' | 'slate'> = {
  UNPAID: 'slate', PENDING: 'amber', PAID: 'green', EXPIRED: 'slate', CANCELLED: 'red', FAILED: 'red',
  WAITING_VERIFICATION: 'blue', VERIFIED: 'green', REJECTED: 'red',
};
const statusLabel: Record<SubscriptionStatus, string> = {
  UNPAID: 'Belum Dibayar', PENDING: 'Menunggu Pembayaran', PAID: 'Berhasil', EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan', FAILED: 'Gagal', WAITING_VERIFICATION: 'Manual: Menunggu',
  VERIFIED: 'Manual: Terverifikasi', REJECTED: 'Manual: Ditolak',
};
const TABS: { value?: SubscriptionStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' }, { value: 'PAID', label: 'Paid' },
  { value: 'EXPIRED', label: 'Expired' }, { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' },
  { value: undefined, label: 'Semua' },
];

export default function SuperadminLanggananPage() {
  const [data, setData] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [tab, setTab] = useState<SubscriptionStatus | undefined>('PENDING');
  const [detail, setDetail] = useState<SubscriptionPayment | null>(null);

  const load = useCallback(async (status?: SubscriptionStatus) => {
    setLoading(true);
    try { setData((await subscriptionService.listPayments(status)) || []); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  async function openDetail(id: number) {
    try { setDetail(await subscriptionService.getPayment(id)); }
    catch (error) { toast.error(getErrorMessage(error)); }
  }

  const columns: Column<SubscriptionPayment>[] = [
    { header: 'Merchant', accessor: (row) => <span className="font-semibold text-slate-800">{row.merchant?.NAMA || `#${row.ID}`}</span> },
    { header: 'Plan', accessor: (row) => row.TARGET_PLAN || 'PRO' },
    { header: 'Durasi', accessor: (row) => row.PAKET },
    { header: 'Nominal', accessor: (row) => <span className="font-semibold">{formatRupiah(row.TOTAL_BAYAR)}</span> },
    { header: 'Provider', accessor: (row) => row.PROVIDER || 'manual' },
    { header: 'Tanggal', accessor: (row) => formatDateTime(row.PAID_AT || row.CREATED_AT || '') },
    { header: 'Status', accessor: (row) => <Badge tone={statusTone[row.STATUS]} dot>{statusLabel[row.STATUS]}</Badge> },
    { header: 'Aksi', accessor: (row) => <Button size="sm" variant="outline" onClick={() => openDetail(row.ID)}>Detail</Button> },
  ];

  return (
    <div>
      <PageHeader title="Pembayaran Langganan" description="Riwayat pembayaran upgrade plan melalui Midtrans. Aktivasi dilakukan otomatis oleh sistem." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item.label} onClick={() => setTab(item.value)}
            className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              tab === item.value ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50')}>
            {item.label}
          </button>
        ))}
      </div>
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(row) => row.ID} showRowNumber emptyTitle="Tidak ada pembayaran" /></CardBody></Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Pembayaran" size="sm">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Merchant</span><span className="font-semibold">{detail.merchant?.NAMA || '-'}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Email</span><span>{detail.merchant?.EMAIL || '-'}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Plan</span><span>{detail.TARGET_PLAN || 'PRO'}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Durasi</span><span>{detail.PAKET}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><span>Total</span><span className="text-primary">{formatRupiah(detail.TOTAL_BAYAR)}</span></div>
            </div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><Badge tone={statusTone[detail.STATUS]} dot>{statusLabel[detail.STATUS]}</Badge></div>
            <div className="rounded-xl border border-line p-3 text-xs text-slate-600">
              <p><span className="text-slate-400">Order ID:</span> {detail.MIDTRANS_ORDER_ID || '-'}</p>
              <p className="mt-1"><span className="text-slate-400">Transaction ID:</span> {detail.MIDTRANS_TRANSACTION_ID || '-'}</p>
              <p className="mt-1"><span className="text-slate-400">Aktif pada:</span> {detail.ACTIVATED_AT ? formatDateTime(detail.ACTIVATED_AT) : '-'}</p>
            </div>
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-slate-600">Status ini read-only. Pembayaran divalidasi menggunakan signature Midtrans dan plan diaktifkan otomatis.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
