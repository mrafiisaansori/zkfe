'use client';
import type { Produk } from '@/types';
import { formatRupiah } from '@/utils/format';
import { EmptyState, ProductImage } from '@/components/ui';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { productImage } from '@/utils/image';
import { cn } from '@/utils/cn';

interface Props {
  produk: Produk[];
  loading?: boolean;
  onAdd: (p: Produk) => void;
  /** Jumlah qty per id_produk yang sudah ada di keranjang (indikator di kartu). */
  inCart?: Record<number, number>;
}

// Kolom mengikuti lebar area (auto-fill), bukan breakpoint layar: area produk
// menyempit saat panel keranjang tampil, jadi breakpoint viewport tidak akurat.
export const PRODUCT_GRID_COLS = 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 sm:gap-3';

// Stok normal ditulis netral; warna hanya untuk kondisi yang perlu perhatian.
function stockText(p: Produk) {
  const unit = p.satuan?.NAMA ? ` ${p.satuan.NAMA}` : '';
  if (p.STOK <= 0) return { text: 'Stok habis', cls: 'font-semibold text-rose-600 dark:text-rose-300' };
  if (p.STOK <= 10) return { text: `Sisa ${p.STOK}${unit}`, cls: 'font-semibold text-amber-700' };
  return { text: `Stok ${p.STOK}${unit}`, cls: 'text-slate-500' };
}

export function ProductGrid({ produk, loading, onAdd, inCart }: Props) {
  if (loading) return <ProductGridSkeleton count={12} />;
  if (!produk.length) return <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci atau kategori lain." />;

  return (
    <div className={PRODUCT_GRID_COLS}>
      {produk.map((p) => {
        const habis = p.STOK <= 0;
        const qty = inCart?.[p.ID] ?? 0;
        const stock = stockText(p);

        return (
          <button
            key={p.ID}
            type="button"
            disabled={habis}
            onClick={() => onAdd(p)}
            aria-label={`Tambah ${p.NAMA}, ${formatRupiah(p.HARGA_JUAL)}${qty ? `, ${qty} di keranjang` : ''}`}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-[border-color,box-shadow] duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed',
              qty > 0 ? 'border-primary shadow-card' : 'border-line',
              !habis && 'hover:border-primary hover:shadow-soft active:bg-brand-50',
            )}
          >
            <div className="relative aspect-[16/10] w-full border-b border-slate-100 bg-slate-50">
              <ProductImage
                src={productImage(p)}
                alt=""
                loading="lazy"
                className={cn('absolute inset-0 h-full w-full !object-contain p-2', habis && 'opacity-40 grayscale')}
              />
              {qty > 0 && (
                <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-white">
                  {qty}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
              <p className={cn('line-clamp-2 text-sm font-semibold leading-5', habis ? 'text-slate-500' : 'text-slate-900')}>{p.NAMA}</p>
              <p className={cn('mt-1 text-xs', stock.cls)}>{stock.text}</p>
              <p className={cn('mt-auto pt-1.5 text-[15px] font-bold tabular-nums', habis ? 'text-slate-500' : 'text-ink')}>{formatRupiah(p.HARGA_JUAL)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
