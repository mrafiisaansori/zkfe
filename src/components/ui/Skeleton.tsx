import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('zk-skeleton', className)} />;
}

// Skeleton grid produk untuk halaman POS.
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-line/80 bg-white p-3 shadow-premium">
          <Skeleton className="mb-3 aspect-square w-full rounded-2xl" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-premium">
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3 w-20" />)}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` }}>
            {Array.from({ length: cols }).map((_, col) => <Skeleton key={col} className="h-4 w-full max-w-[140px]" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton kartu statistik dashboard.
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-line/80 bg-white p-5 shadow-premium sm:p-6">
          <Skeleton className="mb-3 h-12 w-12 rounded-2xl" />
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  );
}
