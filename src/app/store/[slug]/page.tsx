'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Store, MapPin, Phone, Search, X, Sparkles, Tag } from 'lucide-react';
import { publicService } from '@/services';
import type { PublicCatalog, PublicProduct } from '@/services/public.service';
import { getErrorMessage } from '@/services/api';
import { formatRupiah } from '@/utils/format';
import { StoreAvatar } from '@/components/public/StoreAvatar';
import { BrandLoader } from '@/components/ui/BrandLoader';

export default function PublicCatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const [cat, setCat] = useState<PublicCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kat, setKat] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<PublicProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCat(await publicService.getCatalog(slug)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [slug]);
  useEffect(() => { if (slug) load(); }, [slug, load]);

  const items = useMemo(() => (cat?.produk || []).filter((p) => {
    const okKat = kat === 'all' || p.id_kategori === kat;
    const okQ = !q.trim() || p.nama.toLowerCase().includes(q.trim().toLowerCase());
    return okKat && okQ;
  }), [cat, kat, q]);

  const storeName = cat?.toko?.nama || cat?.merchant.nama || 'Toko';

  // ===== Loading & error =====
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50 to-white">
        <BrandLoader size="lg" label="Memuat katalog toko..." />
        <div className="grid w-full max-w-md grid-cols-2 gap-3.5 px-4 opacity-60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-white p-2.5 shadow-card">
              <div className="zk-skeleton mb-2 aspect-square w-full rounded-2xl" />
              <div className="zk-skeleton mb-1.5 h-3 w-3/4 rounded-full" />
              <div className="zk-skeleton h-3 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-brand-50 to-white p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
        <Store className="h-8 w-8 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700">{error}</p>
      <p className="text-sm text-slate-400">Pastikan link katalog benar atau coba lagi nanti.</p>
    </div>
  );
  if (!cat) return null;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* aksen gradient sangat soft di belakang header */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/80 to-transparent" />

      <div className="relative mx-auto max-w-5xl sm:px-4 sm:pt-5">
        {/* ===== Banner ===== */}
        <div className="relative overflow-hidden sm:rounded-3xl sm:shadow-premium">
          {cat.toko?.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cat.toko.banner_url} alt="Banner toko" decoding="async" className="h-36 w-full object-cover sm:h-48" />
          ) : (
            <div className="relative h-32 w-full bg-gradient-to-br from-brand-900 via-primary to-accent sm:h-44">
              <div aria-hidden className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '26px 26px, 32px 32px' }} />
            </div>
          )}
        </div>

        {/* ===== Kartu identitas toko (di bawah banner, tidak menumpuk) ===== */}
        <div className="px-4 sm:px-0">
          <div className="relative -mt-10 rounded-3xl border border-line bg-white p-5 shadow-premium">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
              <StoreAvatar
                src={cat.toko?.logo_url}
                name={storeName}
                className="-mt-16 aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card sm:-mt-14"
              />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-black leading-tight text-slate-900 sm:text-2xl">{storeName}</h1>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Buka &amp; siap melayani
                </span>
              </div>
            </div>

            {(cat.toko?.alamat || cat.toko?.no_telp) && (
              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
                {cat.toko?.alamat && (
                  <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {cat.toko.alamat}</span>
                )}
                {cat.toko?.no_telp && (
                  <span className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {cat.toko.no_telp}</span>
                )}
              </div>
            )}
          </div>

          {/* ===== Hero / welcome ===== */}
          <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-4 text-white shadow-glow sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
              <Sparkles className="h-4 w-4" /> Katalog Online
            </div>
            <p className="mt-1 text-lg font-black leading-snug sm:text-xl">Belanja praktis di {storeName}</p>
            <p className="mt-0.5 text-sm text-white/85">Lihat produk favoritmu dengan harga terbaru.</p>
          </div>
        </div>

        {/* ===== Search + kategori (sticky) ===== */}
        <div className="sticky top-0 z-20 mt-4 border-b border-line bg-white/90 px-4 py-3 backdrop-blur-md sm:rounded-2xl sm:border sm:shadow-soft">
          <div className="flex h-11 items-center gap-2.5 rounded-2xl border border-line bg-background px-3.5 transition-colors focus-within:border-primary focus-within:bg-white">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari produk..."
              className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            {q && (
              <button onClick={() => setQ('')} className="text-slate-400 transition-colors hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="-mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={kat === 'all'} onClick={() => setKat('all')}>Semua</Chip>
            {cat.kategori.map((k) => (
              <Chip key={k.id} active={kat === k.id} onClick={() => setKat(k.id)}>{k.nama}</Chip>
            ))}
          </div>
        </div>

        {/* ===== Grid produk ===== */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} onOpen={() => setDetail(p)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50">
              <Search className="h-9 w-9 text-brand-300" />
            </div>
            <p className="font-bold text-slate-700">Produk tidak ditemukan</p>
            <p className="max-w-xs text-sm text-slate-400">Coba kata kunci lain atau pilih kategori berbeda.</p>
            {(q || kat !== 'all') && (
              <button onClick={() => { setQ(''); setKat('all'); }} className="mt-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition active:scale-95">
                Reset pencarian
              </button>
            )}
          </div>
        )}

        {/* ===== Branding Zona Kasir ===== */}
        <div className="mt-2 px-4 py-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/zona-kasir-icon-128.webp"
              alt="Zona Kasir"
              loading="lazy"
              decoding="async"
              className="h-6 w-6 object-contain"
            />
            <span className="text-sm font-bold text-primary">Zona Kasir</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Katalog ini dibuat dengan Zona Kasir &middot; POS untuk toko &amp; UMKM</p>
        </div>
      </div>

      {/* ===== Detail produk modal ===== */}
      {detail && <ProductModal p={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ============ Sub-komponen ============ */

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
        active ? 'bg-primary text-white shadow-glow' : 'bg-background text-muted hover:bg-brand-50 hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function ProductImg({ p }: { p: PublicProduct }) {
  return p.foto_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.foto_url} alt={p.nama} loading="lazy" decoding="async" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
      <Store className="h-8 w-8" />
    </div>
  );
}

function ProductCard({ p, index, onOpen }: { p: PublicProduct; index: number; onOpen: () => void }) {
  const habis = p.stok <= 0;
  return (
    <div
      onClick={onOpen}
      style={{ animationDelay: `${Math.min(index, 10) * 28}ms` }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60 transition-all duration-200 animate-slide-up hover:-translate-y-1 hover:shadow-premium active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <ProductImg p={p} />
        </div>
        {habis && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">Stok habis</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {p.kategori && (
          <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Tag className="h-2.5 w-2.5" /> {p.kategori}
          </span>
        )}
        <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{p.nama}</p>
        <p className="mt-auto pt-2 text-base font-black text-primary">{formatRupiah(p.harga)}</p>
      </div>
    </div>
  );
}

function ProductModal({ p, onClose }: { p: PublicProduct; onClose: () => void }) {
  const habis = p.stok <= 0;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-4xl bg-white shadow-premium-lg animate-slide-up-sheet sm:rounded-4xl sm:animate-scale-in"
      >
        <div className="relative aspect-square w-full bg-slate-50 sm:aspect-[4/3]">
          <ProductImg p={p} />
          <button onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-card backdrop-blur transition active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          {p.kategori && (
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-primary">
              <Tag className="h-3 w-3" /> {p.kategori}
            </span>
          )}
          <h2 className="mt-2 text-xl font-black leading-tight text-slate-900">{p.nama}</h2>
          <p className="mt-1 text-2xl font-black text-primary">{formatRupiah(p.harga)}</p>
          <p className={`mt-1 text-sm font-medium ${habis ? 'text-error' : 'text-success'}`}>
            {habis ? 'Stok habis' : `Stok tersedia: ${p.stok}`}
          </p>
        </div>
      </div>
    </div>
  );
}
