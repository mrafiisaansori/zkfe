'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/PageHeader';
import { UpgradeBanner } from '@/components/layout/UpgradeBanner';
import { ExpiryWarningBanner } from '@/components/layout/ExpiryWarningBanner';
import { Section, Row, ProdukTerlarisList, RestockList, VarianTerlarisList } from '@/components/report/parts';
import { Card, CardBody, ErrorState, Skeleton, StatCardSkeleton } from '@/components/ui';
import { dashboardService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardSummary } from '@/types';
import { formatRupiah } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { usePageLoading } from '@/hooks/usePageLoading';
import { GudangDashboard } from './GudangDashboard';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DashboardYearChart = dynamic(
  () => import('./DashboardYearChart').then((m) => m.DashboardYearChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-xl" /> },
);

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

  const rp = formatRupiah;
  const omzet = Number(summary.pendapatan_hari_ini) || 0;
  const ppn = Number(summary.ppn_hari_ini) || 0;
  const service = Number(summary.service_hari_ini) || 0;
  const tahun = new Date().getFullYear();
  const restock = (
    <Section title="Perlu restock">
      <RestockList rows={summary.stok_menipis.map((p) => ({ id: p.ID, nama: p.NAMA, stok: p.STOK }))} />
    </Section>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description={new Date(`${summary.tanggal}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
      <ExpiryWarningBanner />
      <UpgradeBanner />

      <Card><CardBody>
        <p className="text-sm text-slate-500">Omzet hari ini</p>
        <p className="mt-1 text-3xl font-extrabold text-ink">{rp(omzet)}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-slate-400">Transaksi</p><p className="font-bold text-slate-700">{summary.transaksi_hari_ini}</p></div>
          <div><p className="text-slate-400">Laba kotor</p><p className="font-bold text-slate-700">{rp(summary.laba_hari_ini ?? 0)}</p></div>
          <div><p className="text-slate-400">Rata-rata</p><p className="font-bold text-slate-700">{rp(summary.rata_rata_transaksi ?? 0)}</p></div>
        </div>
      </CardBody></Card>

      {summary.stok_menipis.length > 0 && restock}

      <Section title="Uang diterima hari ini" note="PPN adalah titipan pajak, bukan pendapatan.">
        <Row label="Omzet bersih" value={rp(omzet)} />
        <Row label="PPN terkumpul" value={`+ ${rp(ppn)}`} />
        <Row label="Service charge" value={`+ ${rp(service)}`} />
        <Row label="Total diterima" value={rp(summary.total_dibayar_hari_ini ?? omzet + ppn + service)} total />
      </Section>

      {summary.stok_menipis.length === 0 && restock}

      <Card><CardBody>
        <h3 className="font-semibold text-slate-900">Omzet &amp; laba per bulan, {tahun}</h3>
        <p className="mb-3 text-sm text-slate-500">Total omzet tahun ini {rp(chart.reduce((a, d) => a + d.omzet, 0))}</p>
        <div className="h-72 w-full">
          <DashboardYearChart data={chart} currentMonth={new Date().getMonth()} />
        </div>
      </CardBody></Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Terlaris bulan ini" note="Urut berdasarkan jumlah terjual">
          <ProdukTerlarisList rows={summary.produk_terlaris ?? []} />
        </Section>
        <Section title="Transaksi terakhir">
          {(summary.transaksi_terbaru?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">Belum ada transaksi.</p>
          ) : (
            <ul>
              {summary.transaksi_terbaru!.map((t) => (
                <li key={t.ID} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-slate-400">{nomorNotaPenjualanLabel(t)}</span>
                    <span className="block truncate text-sm text-slate-600">{t.JAM?.slice(0, 5)} · {t.kasir?.NAMA ?? '-'}{t.jenisBayar?.NAMA ? ` · ${t.jenisBayar.NAMA}` : ''}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-800">{rp(t.TOTAL)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {(summary.varian_terlaris?.length ?? 0) > 0 && (
        <Section title="Varian terlaris bulan ini" note="Urut berdasarkan jumlah dipilih">
          <VarianTerlarisList rows={summary.varian_terlaris!} />
        </Section>
      )}
    </div>
  );
}
