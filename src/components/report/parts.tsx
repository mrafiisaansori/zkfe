import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui';
import { formatRupiah } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { VarianTerlaris } from '@/types';

// Blok bangunan bersama Dashboard admin & Laporan Keuangan (tampilan sama dengan Android).

export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Card><CardBody>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {note && <p className="mb-2 text-xs text-slate-400">{note}</p>}
      <div className={note ? '' : 'mt-2'}>{children}</div>
    </CardBody></Card>
  );
}

export function Row({ label, value, total, danger }: { label: string; value: string; total?: boolean; danger?: boolean }) {
  return (
    <div className={cn('flex justify-between border-b border-slate-100 py-2 text-sm', total && 'border-b-0 border-t border-slate-200 pt-2.5 font-bold')}>
      <span className="text-slate-600">{label}</span>
      <span className={danger ? 'text-rose-600' : 'text-slate-800'}>{value}</span>
    </div>
  );
}

// Nama + "{n} trx" + total + persen porsi (bar), urut terbesar.
export function Share({ rows, empty }: { rows: { key: string; nama: string; n: number; total: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  const sum = rows.reduce((a, r) => a + Number(r.total), 0);
  return (
    <div className="space-y-3">
      {[...rows].sort((a, b) => b.total - a.total).map((r) => {
        const pct = sum > 0 ? (Number(r.total) / sum) * 100 : 0;
        return (
          <div key={r.key} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="min-w-0 text-slate-700">{r.nama} <span className="text-slate-400">{r.n} trx</span></span>
              <span className="shrink-0 font-semibold text-slate-800">{formatRupiah(r.total)} <span className="font-normal text-slate-400">{pct.toFixed(0)}%</span></span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary dark:bg-accent" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function ProdukTerlarisList({ rows }: { rows: { id_produk: number; nama: string; qty: number; omzet: number; omzet_varian?: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">Belum ada produk terjual di periode ini.</p>;
  return (
    <ul>
      {[...rows].sort((a, b) => b.qty - a.qty).map((p, i) => {
        const varian = Number(p.omzet_varian) || 0;
        return (
          <li key={p.id_produk} className="flex gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
            <span className="w-5 shrink-0 text-slate-400">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-slate-700">{p.nama}</span>
              <span className="block text-xs text-slate-400">
                {varian > 0
                  ? `${formatRupiah(p.omzet)} (produk ${formatRupiah(p.omzet - varian)} + varian ${formatRupiah(varian)})`
                  : formatRupiah(p.omzet)}
              </span>
            </span>
            <span className="shrink-0 text-slate-500">{p.qty} terjual</span>
          </li>
        );
      })}
    </ul>
  );
}

export function RestockList({ rows }: { rows: { id: number; nama: string; stok: number }[] }) {
  if (rows.length === 0) return <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Semua stok di atas batas minimum.</p>;
  return (
    <ul>
      {rows.map((p) => (
        <li key={p.id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
          <span className="text-slate-700">{p.nama}</span>
          {p.stok <= 0
            ? <span className="font-semibold text-rose-600">Habis</span>
            : <span className="font-semibold text-orange-500">Sisa {p.stok}</span>}
        </li>
      ))}
    </ul>
  );
}

export function VarianTerlarisList({ rows }: { rows: VarianTerlaris[] }) {
  return (
    <ul>
      {[...rows].sort((a, b) => b.qty - a.qty).map((v) => (
        <li key={`${v.grup}|${v.nama}`} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
          <span className="min-w-0">
            <span className="block font-medium text-slate-700">{v.nama}</span>
            <span className="block text-xs text-slate-400">{v.grup ? `${v.grup} · ` : ''}{formatRupiah(v.omzet)}</span>
          </span>
          <span className="shrink-0 text-slate-500">{v.qty}x dipilih</span>
        </li>
      ))}
    </ul>
  );
}
