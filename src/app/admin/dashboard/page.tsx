'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UpgradeBanner } from '@/components/layout/UpgradeBanner';
import { ExpiryWarningBanner } from '@/components/layout/ExpiryWarningBanner';
import { Section, Row, EmptyLine, ProdukTerlarisList, RestockList, VarianTerlarisList } from '@/components/report/parts';
import { Badge, Button, Card, ErrorState, Skeleton } from '@/components/ui';
import { dashboardService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardSummary } from '@/types';
import { formatRupiah } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { cn } from '@/utils/cn';
import { usePageLoading } from '@/hooks/usePageLoading';
import { GudangDashboard } from './GudangDashboard';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DashboardYearChart = dynamic(
  () => import('./DashboardYearChart').then((m) => m.DashboardYearChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> },
);

export default function AdminDashboard() {
  // Role Gudang melihat dashboard operasional (tanpa data keuangan).
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'gudang') return <GudangDashboard />;
  return <FinanceDashboard />;
}

const linkCls = 'text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded';

function FinanceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chart, setChart] = useState<{ name: string; omzet: number; laba: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  usePageLoading(loading);
  const [error, setError] = useState('');

  // silent = muat ulang di tempat (tombol "Perbarui") tanpa mengganti layar dengan skeleton.
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [s, c] = await Promise.all([
        dashboardService.summary(),
        dashboardService.chart(new Date().getFullYear()),
      ]);
      setSummary(s);
      setChart(c.data.map((d) => ({ name: BULAN[d.bulan - 1], omzet: d.omzet, laba: d.laba })));
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (!summary) return null;

  const rp = formatRupiah;
  const omzet = Number(summary.pendapatan_hari_ini) || 0;
  const ppn = Number(summary.ppn_hari_ini) || 0;
  const service = Number(summary.service_hari_ini) || 0;
  const laba = Number(summary.laba_hari_ini ?? 0) || 0;
  const tahun = new Date().getFullYear();
  const totalTahun = chart.reduce((a, d) => a + d.omzet, 0);
  const restockCount = summary.stok_menipis.length;
  const transaksi = summary.transaksi_terbaru ?? [];
  const hasVarian = (summary.varian_terlaris?.length ?? 0) > 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Dashboard"
        description={new Date(`${summary.tanggal}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={refreshing} aria-label="Perbarui data dashboard">
            {!refreshing && <RefreshCw className="h-4 w-4" />} Perbarui
          </Button>
        }
      />
      <ExpiryWarningBanner />
      <UpgradeBanner />

      {/* ===== KPI hari ini: satu kartu, omzet sebagai angka utama ===== */}
      <Card className="grid grid-cols-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <Kpi primary className="col-span-2 border-b border-slate-100 sm:col-span-3 lg:col-span-1 lg:border-b-0 lg:border-r"
          label="Omzet hari ini" value={rp(omzet)} hint="Bersih, belum termasuk PPN & service" />
        <Kpi className="border-r border-slate-100" label="Transaksi" value={String(summary.transaksi_hari_ini)}
          hint={summary.qty_terjual_hari_ini != null ? `${summary.qty_terjual_hari_ini} item terjual` : undefined} />
        <Kpi className="border-slate-100 sm:border-r" label="Laba kotor" value={rp(laba)}
          hint={omzet > 0 ? `Margin ${Math.round((laba / omzet) * 100)}%` : undefined} />
        <Kpi className="col-span-2 border-t border-slate-100 sm:col-span-1 sm:border-t-0" label="Rata-rata" value={rp(summary.rata_rata_transaksi ?? 0)} hint="per transaksi" />
      </Card>

      {/* ===== Tren (kiri) + uang masuk & stok (kanan). Posisi tetap, tidak bergeser sesuai data. ===== */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="flex flex-col p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Omzet &amp; laba per bulan, {tahun}</h3>
              <p className="mt-0.5 text-xs text-slate-500">Total omzet tahun ini <span className="font-semibold tabular-nums text-slate-700">{rp(totalTahun)}</span></p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600" aria-hidden>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#0077b6] dark:bg-[#00a3cc]" />Laba</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#b3dceb] dark:bg-[#2b4a66]" />Omzet (sisa setelah laba)</span>
            </div>
          </div>
          <div className="mt-4 h-64 w-full sm:h-72 lg:min-h-[288px] lg:flex-1">
            <DashboardYearChart data={chart} currentMonth={new Date().getMonth()} />
          </div>
        </Card>

        <div className="flex flex-col gap-4 sm:gap-5">
          <Section title="Uang diterima hari ini" note="PPN adalah titipan pajak, bukan pendapatan.">
            <Row label="Omzet bersih" value={rp(omzet)} />
            <Row label="PPN terkumpul" value={`+ ${rp(ppn)}`} />
            <Row label="Service charge" value={`+ ${rp(service)}`} />
            <Row label="Total diterima" value={rp(summary.total_dibayar_hari_ini ?? omzet + ppn + service)} total />
          </Section>

          <Section
            title="Perlu restock"
            className="flex-1"
            action={restockCount > 0 ? <Badge tone="amber">{restockCount} produk</Badge> : undefined}
          >
            <div className="max-h-56 overflow-y-auto">
              <RestockList rows={summary.stok_menipis.map((p) => ({ id: p.ID, nama: p.NAMA, stok: p.STOK }))} />
            </div>
            {restockCount > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-3">
                <Link href="/admin/stok" className={linkCls}>Kelola stok</Link>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* ===== Daftar: terlaris, varian (bila ada), transaksi terakhir ===== */}
      <div className={cn('grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2', hasVarian && 'xl:grid-cols-3')}>
        <Section title="Terlaris bulan ini" note="Urut berdasarkan jumlah terjual">
          <ProdukTerlarisList rows={summary.produk_terlaris ?? []} />
        </Section>

        {hasVarian && (
          <Section title="Varian terlaris bulan ini" note="Urut berdasarkan jumlah dipilih">
            <VarianTerlarisList rows={summary.varian_terlaris!} />
          </Section>
        )}

        <Section
          title="Transaksi terakhir"
          action={<Link href="/admin/transaksi" className={linkCls}>Lihat semua</Link>}
        >
          {transaksi.length === 0 ? (
            <EmptyLine>Belum ada transaksi.</EmptyLine>
          ) : (
            <ul className="-mx-2">
              {transaksi.map((t) => (
                <li key={t.ID} className="border-b border-slate-100 last:border-0">
                  <Link
                    href={`/admin/transaksi/${t.ID}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{nomorNotaPenjualanLabel(t)}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {t.JAM?.slice(0, 5)} · {t.kasir?.NAMA ?? '-'}{t.jenisBayar?.NAMA ? ` · ${t.jenisBayar.NAMA}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">{rp(t.TOTAL)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, primary, className }: {
  label: string; value: ReactNode; hint?: string; primary?: boolean; className?: string;
}) {
  return (
    <div className={cn('min-w-0 px-4 py-4 sm:px-5 sm:py-5', className)}>
      <p className="truncate text-[13px] font-medium text-slate-500">{label}</p>
      <p title={typeof value === 'string' ? value : undefined} className={cn(
        'mt-1 truncate font-bold tabular-nums tracking-tight text-ink',
        primary ? 'text-[26px] leading-8 sm:text-[30px] sm:leading-9' : 'text-base sm:text-xl',
      )}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Skeleton mengikuti tata letak akhir agar tidak ada lompatan layout saat data tiba.
function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title="Dashboard" description="Memuat ringkasan operasional toko…" />
      <Card className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('px-4 py-5 sm:px-5', i === 0 && 'col-span-2 sm:col-span-3 lg:col-span-1', i === 3 && 'col-span-2 sm:col-span-1')}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className={cn('mt-2.5', i === 0 ? 'h-8 w-44' : 'h-6 w-24')} />
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-2xl lg:col-span-2" />
        <div className="flex flex-col gap-4 sm:gap-5">
          <Skeleton className="h-[188px] rounded-2xl" />
          <Skeleton className="h-[152px] rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
