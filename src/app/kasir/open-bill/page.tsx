'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, CreditCard, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, ConfirmDialog, Badge, SearchInput, Pagination, type Column } from '@/components/ui';
import { Crown } from 'lucide-react';
import { openBillService, getErrorMessage } from '@/services';
import { formatRupiah } from '@/utils/format';
import type { OpenBill, OpenBillStatus } from '@/types';
import type { PaginationMeta } from '@/services/api';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

const STATUS_TABS: { value: OpenBillStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PAID', label: 'Lunas' },
  { value: 'CANCELLED', label: 'Batal' },
];

function statusBadge(s: OpenBillStatus) {
  if (s === 'OPEN') return <Badge tone="amber" dot>OPEN</Badge>;
  if (s === 'PAID') return <Badge tone="green" dot>PAID</Badge>;
  return <Badge tone="red" dot>CANCELLED</Badge>;
}

function formatTime(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function OpenBillPage() {
  const router = useRouter();
  const plan = useAuthStore((s) => s.user?.merchant?.plan);
  const isPro = plan === 'PRO' || plan === 'BUSINESS'; // BUSINESS = superset PRO
  const [data, setData] = useState<OpenBill[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [status, setStatus] = useState<OpenBillStatus>('OPEN');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [toCancel, setToCancel] = useState<OpenBill | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (st: OpenBillStatus, q = '', pageNo = 1) => {
    setLoading(true);
    try {
      const res = await openBillService.listPage({ status: st, search: q || undefined, page: pageNo, limit: 25 });
      setData(res.data || []);
      setMeta(res.meta);
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isPro) { setLoading(false); return; }
    const t = setTimeout(() => load(status, search, page), 350);
    return () => clearTimeout(t);
  }, [search, status, page, load, isPro]);

  async function handleCancel() {
    if (!toCancel) return; setBusy(true);
    try { await openBillService.cancel(toCancel.ID); toast.success('Open bill dibatalkan'); setToCancel(null); load(status, search, page); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const openBill = (id: number) => router.push(`/kasir/pos?bill=${id}`);
  const splitBill = (id: number) => router.push(`/kasir/pos?bill=${id}&split=1`);

  const columns: Column<OpenBill>[] = [
    { header: 'No Bill', accessor: (r) => <span className="font-semibold text-slate-800">{r.NO_BILL || '-'}</span> },
    { header: 'Pelanggan', accessor: (r) => r.CUSTOMER_NAME || '-' },
    { header: 'Meja', accessor: (r) => r.TABLE_NO || '-' },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(Number(r.TOTAL) || 0)}</span> },
    { header: 'Waktu', accessor: (r) => formatTime(r.CREATED_AT) },
    { header: 'Kasir', accessor: (r) => r.kasir?.NAMA || '-' },
    { header: 'Status', accessor: (r) => statusBadge(r.STATUS) },
    {
      header: 'Aksi',
      accessor: (r) => (
        r.STATUS === 'OPEN' ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openBill(r.ID)} title="Buka / edit"><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => openBill(r.ID)} title="Bayar"><CreditCard className="h-4 w-4 text-emerald-600" /></Button>
            <Button variant="ghost" size="sm" onClick={() => splitBill(r.ID)} title="Split Bill"><Scissors className="h-4 w-4 text-primary" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setToCancel(r)} title="Batalkan"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Open Bill" description="Pesanan tersimpan yang dibayar di akhir (coffee shop, cafe, resto)." />

      {!isPro ? (
        <Card><CardBody>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-primary">
              <Crown className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold text-ink">Open Bill hanya untuk plan PRO</h3>
            <p className="max-w-md text-sm text-slate-500">
              Simpan pesanan & bayar di akhir (cocok untuk cafe / coffee shop / resto) tersedia di plan PRO.
              Hubungi admin toko untuk mengaktifkan fitur ini.
            </p>
          </div>
        </CardBody></Card>
      ) : (
      <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                status === t.value
                  ? 'border-primary bg-primary text-white shadow-card'
                  : 'border-line bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SearchInput
          className="sm:w-72"
          placeholder="Cari nama pelanggan / meja / no bill..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card><CardBody>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey={(r) => r.ID}
          showRowNumber
          startIndex={(page - 1) * 25}
          emptyTitle="Belum ada open bill"
        />
        <Pagination page={page} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
      </CardBody></Card>

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={handleCancel}
        loading={busy}
        title="Batalkan open bill"
        message={`Batalkan ${toCancel?.NO_BILL || 'bill ini'}? Status akan menjadi CANCELLED.`}
        confirmLabel="Batalkan"
      />
      </>
      )}
    </div>
  );
}
