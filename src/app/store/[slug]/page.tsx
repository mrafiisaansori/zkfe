'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Store, MapPin, Phone, Search } from 'lucide-react';
import { publicService } from '@/services';
import type { PublicCatalog } from '@/services/public.service';
import { getErrorMessage } from '@/services/api';
import { formatRupiah } from '@/utils/format';
import { StoreAvatar } from '@/components/public/StoreAvatar';

export default function PublicCatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const [cat, setCat] = useState<PublicCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kat, setKat] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');

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

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-400">Memuat katalog...</div>;
  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <Store className="h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-700">{error}</p>
    </div>
  );
  if (!cat) return null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50">
      {/* Banner */}
      {cat.toko?.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cat.toko.banner_url} alt="Banner" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-ink via-primary to-accent" />
      )}

      {/* Header toko */}
      <div className="px-5">
        <div className="-mt-12 flex items-end gap-3">
          <StoreAvatar src={cat.toko?.logo_url} name={cat.toko?.nama || cat.merchant.nama} className="h-20 w-20 rounded-2xl border-4 border-white shadow-card" />
          <h1 className="pb-1 text-xl font-black leading-tight text-slate-900">{cat.toko?.nama || cat.merchant.nama}</h1>
        </div>
        <div className="mt-2 space-y-1 text-sm text-slate-500">
          {cat.toko?.alamat && <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" /> {cat.toko.alamat}</p>}
          {cat.toko?.no_telp && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 shrink-0" /> {cat.toko.no_telp}</p>}
        </div>
      </div>

      {/* Search + kategori (sticky) */}
      <div className="sticky top-0 z-10 mt-3 space-y-2.5 border-y border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk..."
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setKat('all')} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${kat === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>Semua</button>
          {cat.kategori.map((k) => (
            <button key={k.id} onClick={() => setKat(k.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${kat === k.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{k.nama}</button>
          ))}
        </div>
      </div>

      {/* Produk - grid 2 kolom (kartu gaya katalog) */}
      <div className="grid grid-cols-2 gap-3.5 p-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-3xl bg-white p-2.5 shadow-card">
            <div className="mb-2 aspect-square w-full overflow-hidden rounded-2xl bg-slate-50">
              {p.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto_url} alt={p.nama} className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300"><Store className="h-8 w-8" /></div>
              )}
            </div>
            <p className="line-clamp-1 px-1 text-sm font-bold text-slate-800">{p.nama}</p>
            {p.kategori && <p className="line-clamp-1 px-1 text-xs text-slate-400">{p.kategori}</p>}
            <p className="mt-1.5 px-1 text-base font-black text-primary">{formatRupiah(p.harga)}</p>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-2 py-12 text-center text-sm text-slate-400">Produk tidak ditemukan.</p>}
      </div>

      {/* Branding Zona Kasir */}
      <div className="border-t border-slate-200 bg-white px-5 py-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-black text-white">Z</span>
          <span className="text-sm font-bold text-primary">Zona Kasir</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">Katalog ini dibuat dengan Zona Kasir &middot; POS untuk toko &amp; UMKM</p>
      </div>
    </div>
  );
}
