import type { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { formatRupiah } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { VarianTerlaris } from '@/types';

// Blok bangunan bersama Dashboard admin & Laporan Keuangan (tampilan sama dengan Android).
// Konvensi: judul section = text-[15px] semibold ink; catatan = text-xs slate-500 (kontras ≥ 4.5:1);
// angka selalu tabular-nums agar sejajar saat dibaca berurutan.

export function Section({ title, note, action, className, children }: {
  title: string;
  note?: string;
  /** Slot kanan header: hitungan, tautan "Lihat semua", dll. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-ink">{title}</h3>
          {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="min-h-0 flex-1 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">{children}</div>
    </Card>
  );
}

export function Row({ label, value, total, danger }: { label: string; value: string; total?: boolean; danger?: boolean }) {
  return (
    <div className={cn(
      'flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 text-sm',
      total && 'mt-1 border-b-0 border-t border-slate-200 pb-0 pt-3',
    )}>
      <span className={total ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</span>
      <span className={cn('tabular-nums', total ? 'text-base font-bold' : 'font-medium', danger ? 'text-rose-600' : 'text-slate-800')}>{value}</span>
    </div>
  );
}

// Nama + "{n} trx" + total + persen porsi (bar), urut terbesar.
export function Share({ rows, empty }: { rows: { key: string; nama: string; n: number; total: number }[]; empty: string }) {
  if (rows.length === 0) return <EmptyLine>{empty}</EmptyLine>;
  const sum = rows.reduce((a, r) => a + Number(r.total), 0);
  return (
    <div className="space-y-3">
      {[...rows].sort((a, b) => b.total - a.total).map((r) => {
        const pct = sum > 0 ? (Number(r.total) / sum) * 100 : 0;
        return (
          <div key={r.key} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="min-w-0 text-slate-700">{r.nama} <span className="text-slate-500">{r.n} trx</span></span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-800">{formatRupiah(r.total)} <span className="font-normal text-slate-500">{pct.toFixed(0)}%</span></span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary dark:bg-accent" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

// Teks kosong yang konsisten untuk semua list laporan.
export function EmptyLine({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ok' }) {
  return (
    <p className={cn('py-2 text-sm', tone === 'ok' ? 'font-medium text-emerald-700 dark:text-emerald-300' : 'text-slate-500')}>
      {children}
    </p>
  );
}

export function ProdukTerlarisList({ rows }: { rows: { id_produk: number; nama: string; qty: number; omzet: number; omzet_varian?: number }[] }) {
  if (rows.length === 0) return <EmptyLine>Belum ada produk terjual di periode ini.</EmptyLine>;
  return (
    <ol>
      {[...rows].sort((a, b) => b.qty - a.qty).map((p, i) => {
        const varian = Number(p.omzet_varian) || 0;
        return (
          <li key={p.id_produk} className="flex items-start gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
            <span className="w-5 shrink-0 pt-px text-right text-xs font-semibold tabular-nums text-slate-500">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-800">{p.nama}</span>
              <span className="block text-xs tabular-nums text-slate-500">
                {varian > 0
                  ? `${formatRupiah(p.omzet)} (produk ${formatRupiah(p.omzet - varian)} + varian ${formatRupiah(varian)})`
                  : formatRupiah(p.omzet)}
              </span>
            </span>
            <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-600"><b className="font-semibold text-slate-800">{p.qty}</b> terjual</span>
          </li>
        );
      })}
    </ol>
  );
}

// Habis ditampilkan lebih dulu (paling mendesak), lalu sisa stok terkecil.
export function RestockList({ rows }: { rows: { id: number; nama: string; stok: number }[] }) {
  if (rows.length === 0) return <EmptyLine tone="ok">Semua stok di atas batas minimum.</EmptyLine>;
  return (
    <ul>
      {[...rows].sort((a, b) => a.stok - b.stok).map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
          <span className="min-w-0 truncate text-slate-700">{p.nama}</span>
          {p.stok <= 0
            ? <span className="shrink-0 font-semibold text-rose-600 dark:text-rose-300">Habis</span>
            : <span className="shrink-0 font-semibold tabular-nums text-amber-700">Sisa {p.stok}</span>}
        </li>
      ))}
    </ul>
  );
}

export function VarianTerlarisList({ rows }: { rows: VarianTerlaris[] }) {
  return (
    <ul>
      {[...rows].sort((a, b) => b.qty - a.qty).map((v) => (
        <li key={`${v.grup}|${v.nama}`} className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-800">{v.nama}</span>
            <span className="block text-xs tabular-nums text-slate-500">{v.grup ? `${v.grup} · ` : ''}{formatRupiah(v.omzet)}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-600"><b className="font-semibold text-slate-800">{v.qty}x</b> dipilih</span>
        </li>
      ))}
    </ul>
  );
}
