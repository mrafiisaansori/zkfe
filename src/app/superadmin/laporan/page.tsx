'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Wallet, Receipt, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, Button, FilterDate, DataTable, Badge, Skeleton, type Column } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { RevenueSummary, RevenueChart as RevenueChartData, SubscriptionPayment } from '@/types';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

const RevenueChart = dynamic(
  () => import('./RevenueChart').then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-xl" /> },
);

// Awal bulan berjalan (default rentang laporan) — format YYYY-MM-DD, mengikuti todayISO().
function startOfMonthISO(): string {
  const today = todayISO();
  return `${today.slice(0, 7)}-01`;
}

export default function SuperadminLaporanPage() {
  const [awal, setAwal] = useState(startOfMonthISO());
  const [akhir, setAkhir] = useState(todayISO());
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [chart, setChart] = useState<RevenueChartData | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        subscriptionService.revenueSummary(awal, akhir),
        subscriptionService.revenueChart(new Date().getFullYear()),
      ]);
      setSummary(s); setChart(c);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [awal, akhir]);
  useEffect(() => { load(); }, [load]);

  const columns: Column<SubscriptionPayment>[] = [
    { header: 'Merchant', accessor: (row) => <span className="font-semibold text-slate-800">{row.merchant?.NAMA || '-'}</span> },
    { header: 'Plan', accessor: (row) => <Badge tone="blue">{row.TARGET_PLAN || 'PRO'}</Badge> },
    { header: 'Durasi', accessor: (row) => row.PAKET },
    { header: 'Nominal', accessor: (row) => <span className="font-semibold">{formatRupiah(row.TOTAL_BAYAR)}</span> },
    { header: 'Tanggal Bayar', accessor: (row) => (row.PAID_AT ? formatDate(row.PAID_AT) : '-') },
  ];

  return (
    <div>
      <PageHeader title="Laporan Pendapatan" description="Pendapatan platform dari upgrade PRO/BUSINESS seluruh merchant." />

      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
          <Button onClick={load}>Terapkan</Button>
        </div>
      </CardBody></Card>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total pendapatan (periode)" value={formatRupiah(summary?.total_revenue ?? 0)} icon={Wallet} tone="green" />
        <StatCard label="Jumlah pembayaran" value={summary?.jumlah_pembayaran ?? 0} icon={Receipt} tone="brand" />
        <StatCard label="Rata-rata / pembayaran" value={formatRupiah(summary && summary.jumlah_pembayaran > 0 ? Math.round(summary.total_revenue / summary.jumlah_pembayaran) : 0)} icon={TrendingUp} tone="amber" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardBody>
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Pendapatan bulanan {new Date().getFullYear()}</h3>
            <p className="text-sm text-slate-500">Total pembayaran upgrade yang lunas per bulan.</p>
          </div>
          <div className="h-72 w-full">
            {chart && <RevenueChart data={chart.data} />}
          </div>
        </CardBody></Card>

        <Card><CardBody>
          <h3 className="mb-3 font-semibold text-slate-900">Rincian per paket</h3>
          {(summary?.by_plan.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada pembayaran pada periode ini</p>
          ) : (
            <ul className="space-y-2">
              {summary!.by_plan.map((row) => (
                <li key={`${row.plan}_${row.paket}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-700">{row.plan} · {row.paket}</span>
                    <span className="block text-xs text-slate-400">{row.jumlah} pembayaran</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-800">{formatRupiah(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>
      </div>

      <Card><CardBody>
        <h3 className="mb-3 font-semibold text-slate-900">Riwayat pembayaran lunas</h3>
        <DataTable columns={columns} data={summary?.payments || []} loading={loading} rowKey={(row) => row.ID} showRowNumber emptyTitle="Belum ada pembayaran lunas pada periode ini" />
      </CardBody></Card>
    </div>
  );
}
