'use client';
import { Plus } from 'lucide-react';
import type { Produk } from '@/types';
import { formatRupiah } from '@/utils/format';
import { EmptyState, ProductImage } from '@/components/ui';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { productImage } from '@/utils/image';
import { cn } from '@/utils/cn';

interface Props { produk: Produk[]; loading?: boolean; onAdd: (p: Produk) => void; }

export function ProductGrid({ produk, loading, onAdd }: Props) {
  if (loading) return <ProductGridSkeleton count={10} />;
  if (!produk.length) return <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci atau kategori lain." />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {produk.map((p) => {
        const habis = p.STOK <= 0;
        const stockTone = habis
          ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
          : p.STOK <= 10
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
            : 'bg-brand-50 text-brand-700 dark:bg-accent/15 dark:text-accent';

        return (
          <button
            key={p.ID}
            disabled={habis}
            onClick={() => onAdd(p)}
            className={cn(
              'group flex flex-col rounded-2xl border bg-white p-3 text-left shadow-card transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60',
              habis ? 'border-slate-200' : 'border-brand-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-soft',
            )}
          >
            <div className="relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-xl bg-white">
              <ProductImage
                src={productImage(p)}
                alt={p.NAMA}
                loading="lazy"
                className="h-full w-full !object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
              />
              {habis && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white">Stok habis</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex flex-col">
              <p className="line-clamp-1 text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">{p.NAMA}</p>
              <span className={cn('mt-1 w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold', stockTone)}>
                Stok {p.STOK}
              </span>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-sm font-bold leading-tight text-slate-900 sm:text-base">{formatRupiah(p.HARGA_JUAL)}</span>
                {!habis && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Plus className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
