'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Minus, Plus, ShoppingCart, CheckCircle2, UtensilsCrossed, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicService } from '@/services';
import type { PublicMenu, PublicProduct } from '@/services/public.service';
import { getErrorMessage } from '@/services/api';
import { formatRupiah } from '@/utils/format';
import { StoreAvatar } from '@/components/public/StoreAvatar';

export default function PublicMenuPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [kat, setKat] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ no_bill: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setMenu(await publicService.getMenu(token)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { if (token) load(); }, [token, load]);

  const items = useMemo(() => (menu?.produk || []).filter((p) => {
    const okKat = kat === 'all' || p.id_kategori === kat;
    const okQ = !q.trim() || p.nama.toLowerCase().includes(q.trim().toLowerCase());
    return okKat && okQ;
  }), [menu, kat, q]);
  const cartList = useMemo(() => {
    const list: { p: PublicProduct; qty: number }[] = [];
    (menu?.produk || []).forEach((p) => { if (cart[p.id]) list.push({ p, qty: cart[p.id] }); });
    return list;
  }, [cart, menu]);
  const total = cartList.reduce((s, x) => s + x.p.harga * x.qty, 0);
  const count = cartList.reduce((s, x) => s + x.qty, 0);

  function setQty(id: number, qty: number) {
    setCart((c) => { const n = { ...c }; if (qty <= 0) delete n[id]; else n[id] = qty; return n; });
  }

  async function submit() {
    if (count === 0) return; setSending(true);
    try {
      const res = await publicService.order(token, {
        customer_name: name,
        items: cartList.map((x) => ({ id_produk: x.p.id, qty: x.qty })),
      });
      setDone({ no_bill: res.no_bill }); setCart({});
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSending(false); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-400">Memuat menu...</div>;
  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <UtensilsCrossed className="h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-700">{error}</p>
    </div>
  );
  if (!menu) return null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-28">
      {/* Banner */}
      {menu.toko?.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={menu.toko.banner_url} alt="Banner" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-ink via-primary to-accent" />
      )}

      {/* Header toko */}
      <div className="px-5">
        <div className="-mt-12 flex items-end gap-3">
          <StoreAvatar src={menu.toko?.logo_url} name={menu.toko?.nama || menu.merchant.nama} className="h-20 w-20 rounded-2xl border-4 border-white shadow-card" />
          <h1 className="pb-1 text-xl font-black leading-tight text-slate-900">{menu.toko?.nama || menu.merchant.nama}</h1>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-primary">
            <UtensilsCrossed className="h-4 w-4" /> Meja {menu.meja.nomor}
          </span>
        </div>
      </div>

      {/* Search + kategori (sticky) */}
      <div className="sticky top-0 z-10 mt-3 space-y-2.5 border-y border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari menu..."
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setKat('all')} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${kat === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>Semua</button>
          {menu.kategori.map((k) => (
            <button key={k.id} onClick={() => setKat(k.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${kat === k.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{k.nama}</button>
          ))}
        </div>
      </div>

      {/* Produk - grid 2 kolom (kartu gaya katalog) */}
      <div className="grid grid-cols-2 gap-3.5 p-4">
        {items.map((p) => (
          <div key={p.id} className="flex flex-col rounded-3xl bg-white p-2.5 shadow-card">
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
            <div className="mt-1.5 flex items-center justify-between gap-1 px-1">
              <p className="text-base font-black text-primary">{formatRupiah(p.harga)}</p>
              {cart[p.id] ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setQty(p.id, (cart[p.id] || 0) - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-4 text-center text-sm font-bold">{cart[p.id]}</span>
                  <button onClick={() => setQty(p.id, (cart[p.id] || 0) + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => setQty(p.id, 1)} aria-label="Tambah" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-card"><Plus className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-2 py-12 text-center text-sm text-slate-400">Menu tidak ditemukan.</p>}
      </div>

      {/* Branding Zona Kasir */}
      <div className="border-t border-slate-200 bg-white px-5 py-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-black text-white">Z</span>
          <span className="text-sm font-bold text-primary">Zona Kasir</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">Menu digital oleh Zona Kasir &middot; POS untuk toko &amp; UMKM</p>
      </div>

      {/* Bar pesan */}
      {count > 0 && !done && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.4)]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda (opsional)" className="mb-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" />
          <button onClick={submit} disabled={sending} className="flex h-12 w-full items-center justify-between rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-60">
            <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> {count} item</span>
            <span>{sending ? 'Mengirim...' : `Pesan - ${formatRupiah(total)}`}</span>
          </button>
        </div>
      )}

      {/* Sukses */}
      {done && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="mt-2 text-lg font-bold text-slate-900">Pesanan terkirim!</h2>
            <p className="mt-1 text-sm text-slate-500">No. bill <b>{done.no_bill}</b>. Silakan tunggu, kasir akan memproses pesanan Anda.</p>
            <button onClick={() => setDone(null)} className="mt-4 h-11 w-full rounded-xl bg-primary font-bold text-white">Pesan lagi</button>
          </div>
        </div>
      )}
    </div>
  );
}
