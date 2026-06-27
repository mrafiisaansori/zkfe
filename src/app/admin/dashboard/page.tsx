'use client';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Package, Receipt, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { UpgradeBanner } from '@/components/layout/UpgradeBanner';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, LoadingState, ErrorState, Badge, Skeleton, StatCardSkeleton } from '@/components/ui';
import { dashboardService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardSummary } from '@/types';
import { formatRupiah } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';
import { GudangDashboard } from './GudangDashboard';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function AdminDashboard() {
  // Role Gudang melihat dashboard operasional (tanpa data keuangan).
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'gudang') return <GudangDashboard />;
  return <FinanceDashboard />;
}

function FinanceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chart, setChart] = useState<{ name: string; omzet: number; laba: number }[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, c] = await Promise.all([
        dashboardService.summary(),
        dashboardService.chart(new Date().getFullYear()),
      ]);
      setSummary(s);
      setChart(c.data.map((d) => ({ name: BULAN[d.bulan - 1], omzet: d.omzet, laba: d.laba })));
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div>
      <PageHeader title="Dashboard" description="Memuat ringkasan operasional toko…" />
      <StatCardSkeleton count={4} />
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return null;

  return (
    <div>
      <PageHeader title="Dashboard" description={`Ringkasan operasional toko · ${summary.tanggal}`} />
      <UpgradeBanner />
      {/* Headline: omzet bersih, transaksi, laba kotor, stok menipis */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Omzet hari ini (tanpa PPN)" value={formatRupiah(summary.pendapatan_hari_ini)} icon={ShoppingBag} tone="green" />
        <StatCard label="Transaksi hari ini" value={summary.transaksi_hari_ini} icon={Receipt} tone="brand" />
        <StatCard label="Laba kotor hari ini" value={formatRupiah(summary.laba_hari_ini ?? 0)} icon={TrendingUp} tone="amber" />
        <StatCard label="Stok menipis" value={summary.stok_menipis.length} icon={AlertTriangle} tone="red" />
      </div>

      {/* Angka pendukung */}
      <Card className="mt-4"><CardBody>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-slate-400">Total diterima (bruto)</p><p className="font-bold text-slate-800">{formatRupiah(summary.total_dibayar_hari_ini ?? 0)}</p></div>
          <div><p className="text-slate-400">PPN terkumpul</p><p className="font-bold text-slate-800">{formatRupiah(summary.ppn_hari_ini ?? 0)}</p></div>
          <div><p className="text-slate-400">Service charge</p><p className="font-bold text-slate-800">{formatRupiah(summary.service_hari_ini ?? 0)}</p></div>
          <div><p className="text-slate-400">Rata-rata / transaksi</p><p className="font-bold text-slate-800">{formatRupiah(summary.rata_rata_transaksi ?? 0)}</p></div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Omzet = penjualan bersih (tanpa PPN &amp; service). PPN adalah titipan pajak, bukan pendapatan.</p>
      </CardBody></Card>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Omzet & Laba {new Date().getFullYear()}</h3>
                <p className="text-sm text-slate-500">Performa penjualan bulanan.</p>
              </div>
              <Badge tone="blue">Real-time</Badge>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 18, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="omzet" name="Omzet" fill="#0077b6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="laba" name="Laba" fill="#00b4d8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-1 font-semibold text-slate-900">Produk stok menipis</h3>
            <p className="mb-4 text-sm text-slate-500">Prioritaskan restock sebelum transaksi ramai.</p>
            {summary.stok_menipis.length === 0 ? (
              <p className="rounded-xl bg-emerald-50 py-8 text-center text-sm font-medium text-emerald-700">Semua stok aman</p>
            ) : (
              <ul className="space-y-2">
                {summary.stok_menipis.map((p) => (
                  <li key={p.ID} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                    <span className="truncate text-sm font-semibold text-slate-700">{p.NAMA}</span>
                    <Badge tone={p.STOK <= 0 ? 'red' : 'amber'}>{p.STOK}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Produk terlaris & transaksi terbaru */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardBody>
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Star className="h-4 w-4 text-amber-500" /> Produk terlaris bulan ini</h3>
          <p className="mb-4 text-sm text-slate-500">5 produk dengan penjualan terbanyak.</p>
          {(summary.produk_terlaris?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada penjualan bulan ini</p>
          ) : (
            <ul className="space-y-2">
              {summary.produk_terlaris!.map((p, i) => (
                <li key={p.id_produk} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="truncate text-sm font-semibold text-slate-700">{p.nama}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-slate-800">{p.qty} terjual</span>
                    <span className="block text-xs text-slate-400">{formatRupiah(p.omzet)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>

        <Card><CardBody>
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Receipt className="h-4 w-4 text-primary" /> Transaksi terbaru</h3>
          <p className="mb-4 text-sm text-slate-500">5 transaksi terakhir.</p>
          {(summary.transaksi_terbaru?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada transaksi</p>
          ) : (
            <ul className="space-y-2">
              {summary.transaksi_terbaru!.map((t) => (
                <li key={t.ID} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-slate-400">#{String(t.ID).padStart(6, '0')}</span>
                    <span className="block truncate text-sm text-slate-600">{t.kasir?.NAMA ?? '-'} · {t.TANGGAL}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-800">{formatRupiah(t.TOTAL)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>
      </div>
    </div>
  );
}
   