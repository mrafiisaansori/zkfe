'use client';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Package, PackageX, History, Truck, Undo2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, ErrorState, Badge, StatCardSkeleton, Skeleton } from '@/components/ui';
import { dashboardService, getErrorMessage } from '@/services';
import type { GudangDashboard as GudangData } from '@/types';
import { formatDate } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

// Dashboard role Gudang: HANYA informasi operasional stok. Tidak ada data
// keuangan (omzet/laba/PPN/service/bruto) — itu dijaga juga di backend.
export function GudangDashboard() {
  const [data, setData] = useState<GudangData | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await dashboardService.gudang()); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div>
      <PageHeader title="Dashboard Gudang" description="Memuat informasi stok…" />
      <StatCardSkeleton count={3} />
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="Dashboard Gudang" description={`Ringkasan stok & operasional · ${formatDate(data.tanggal)}`} />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total produk" value={data.total_produk} icon={Package} tone="brand" />
        <StatCard label="Stok menipis" value={data.stok_menipis_count} icon={AlertTriangle} tone="amber" />
        <StatCard label="Produk habis" value={data.produk_habis_count} icon={PackageX} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stok menipis */}
        <Card><CardBody>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Produk stok menipis</h3>
          {data.stok_menipis.length === 0 ? (
            <p className="text-sm text-slate-400">Stok aman.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.stok_menipis.map((p) => (
                <li key={p.ID} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{p.NAMA}</span>
                  <Badge tone="amber">sisa {p.STOK}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>

        {/* Produk habis */}
        <Card><CardBody>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Produk habis</h3>
          {data.produk_habis.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada produk habis.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.produk_habis.map((p) => (
                <li key={p.ID} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{p.NAMA}</span>
                  <Badge tone="red">habis</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>

        {/* Riwayat stok terbaru */}
        <Card><CardBody>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><History className="h-4 w-4" /> Riwayat stok terbaru</h3>
          {data.riwayat_stok.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada pergerakan stok.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.riwayat_stok.map((r) => (
                <li key={r.ID} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    {r.JENIS === 1
                      ? <ArrowUpCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <ArrowDownCircle className="h-4 w-4 shrink-0 text-rose-500" />}
                    <span className="truncate">{r.produk?.NAMA ?? '-'}</span>
                  </span>
                  <span className={r.JENIS === 1 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                    {r.JENIS === 1 ? '+' : '-'}{r.QTY}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>

        {/* Pembelian & retur terbaru */}
        <Card><CardBody>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Truck className="h-4 w-4" /> Pembelian terbaru</h3>
          {data.pembelian_terbaru.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada pembelian.</p>
          ) : (
            <ul className="mb-4 space-y-2 text-sm">
              {data.pembelian_terbaru.map((p) => (
                <li key={p.ID} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{p.NO_NOTA || `#${p.ID}`} · {p.supplier?.NAMA ?? '-'}</span>
                  <span className="text-xs text-slate-400">{formatDate(p.TANGGAL)}</span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Undo2 className="h-4 w-4" /> Retur terbaru</h3>
          {data.retur_terbaru.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada retur.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.retur_terbaru.map((r) => (
                <li key={r.ID} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{r.NO_NOTA || `#${r.ID}`} · {r.supplier?.NAMA ?? '-'}</span>
                  <span className="text-xs text-slate-400">{formatDate(r.TANGGAL)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody></Card>
      </div>
    </div>
  );
}
