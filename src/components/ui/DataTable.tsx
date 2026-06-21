'use client';
import { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}
interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: (row: T) => string | number;
  emptyTitle?: string;
  // Tampilkan kolom "No" (nomor urut tampilan) menggantikan ID asli DB.
  showRowNumber?: boolean;
  // Offset awal nomor urut (untuk pagination): No = startIndex + indeks baris + 1.
  startIndex?: number;
}

export function DataTable<T>({
  columns: cols, data, loading, rowKey, emptyTitle, showRowNumber, startIndex = 0,
}: Props<T>) {
  // Sisipkan kolom "No" di paling kiri bila diminta. Nomor urut murni tampilan,
  // tidak membocorkan ID asli database ke user.
  const columns: Column<T>[] = showRowNumber
    ? [
        {
          header: 'No',
          className: 'w-14 text-slate-500',
          accessor: (row: T) => startIndex + data.indexOf(row) + 1,
        },
        ...cols,
      ]
    : cols;

  if (loading) return <TableSkeleton cols={Math.max(columns.length, 3)} />;
  if (!data.length) return <EmptyState title={emptyTitle ?? 'Belum ada data'} />;

  return (
    <>
      {/* Desktop / tablet: tabel */}
      <div className="hidden overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-white shadow-card sm:block [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {columns.map((c, i) => (
                <th key={i} className={`whitespace-nowrap px-4 py-3 ${c.className ?? ''}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-canvas">
                {columns.map((c, i) => (
                  <td key={i} className={`px-4 py-3 text-slate-700 ${c.className ?? ''}`}>{c.accessor(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: daftar kartu (tabel diubah jadi card list) */}
      <div className="space-y-2.5 sm:hidden">
        {data.map((row) => (
          <div key={rowKey(row)} className="rounded-xl border border-line bg-white p-3.5 shadow-card">
            <dl className="space-y-1.5">
              {columns.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{c.header}</dt>
                  <dd className="min-w-0 text-right text-slate-700">{c.accessor(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
