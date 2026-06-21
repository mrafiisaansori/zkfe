'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Plus, Printer, ScanLine, ShoppingCart, X, ClipboardList, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchInput, Button, Modal, Input, ConfirmDialog, UpgradeModal } from '@/components/ui';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { Receipt } from '@/components/pos/Receipt';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { produkService, jenisBayarService, kategoriService, penjualanService, openBillService, qrisService, taxService, identitasService, modifierService, getErrorMessage } from '@/services';
import { cn } from '@/utils/cn';
import { formatRupiah } from '@/utils/format';
import { printThermal } from '@/utils/printThermal';
import type { Produk, JenisBayar, Kategori, Penjualan, CheckoutResult, Qris, TaxSetting, Identitas, ModifierGroup, ModifierOption } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function PosPage() {
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore();
  const [produk, setProduk] = useState<Produk[]>([]);
  const [jenisBayar, setJenisBayar] = useState<JenisBayar[]>([]);
  const [qris, setQris] = useState<Qris | null>(null);
  const [tax, setTax] = useState<TaxSetting | null>(null);
  const [identitas, setIdentitas] = useState<Identitas | null>(null);
  const plan = (user?.merchant?.plan as 'FREE' | 'PRO') || 'FREE';
  const [receiptSize, setReceiptSize] = useState<'58' | '80'>('58');
  const receiptThermalRef = useRef<HTMLDivElement>(null);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [activeKat, setActiveKat] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState<{ result: CheckoutResult; trx: Penjualan } | null>(null);

  // ===== Open Bill =====
  const router = useRouter();
  const searchParams = useSearchParams();
  const billParam = searchParams.get('bill');
  const [saveBillOpen, setSaveBillOpen] = useState(false);
  const [savingBill, setSavingBill] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [billForm, setBillForm] = useState({ customer_name: '', table_no: '', note: '' });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const billCtx = cart.bill;
  const isPro = plan === 'PRO';

  // Klik "Simpan Bill": FREE -> modal upgrade; PRO -> modal simpan bill.
  function handleSaveBillClick() {
    if (!isPro) { setUpgradeOpen(true); return; }
    setSaveBillOpen(true);
  }

  // Muat open bill ke keranjang saat dibuka via ?bill=<id>.
  useEffect(() => {
    if (!billParam) {
      // Keluar dari mode edit bill bila tidak ada param namun konteks masih ada.
      if (cart.bill) cart.clear();
      return;
    }
    const id = Number(billParam);
    if (cart.bill?.id === id) return; // sudah dimuat
    openBillService.getById(id)
      .then((b) => cart.loadBill(b))
      .catch((err) => { toast.error(getErrorMessage(err)); router.replace('/kasir/pos'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billParam]);

  // Lengkapi gambar item bill dari daftar produk yang sudah dimuat (detail bill
  // tidak menyertakan foto), agar gambar di keranjang tidak default.
  useEffect(() => {
    if (cart.bill && produk.length) cart.hydrateImages(produk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produk, cart.bill?.id]);

  const loadProduk = useCallback(async (q?: string) => {
    setLoading(true);
    try { setProduk((await produkService.list(q)) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadProduk();
    jenisBayarService.list().then((j) => setJenisBayar(j || [])).catch(() => {});
    qrisService.get().then((q) => setQris(q || null)).catch(() => {});
    kategoriService.list().then((k) => setKategori(k || [])).catch(() => {});
    taxService.get().then((tx) => setTax(tx || null)).catch(() => {});
    identitasService.get().then((it) => setIdentitas(it || null)).catch(() => {});
  }, [loadProduk]);

  useEffect(() => {
    const t = setTimeout(() => loadProduk(search), 350);
    return () => clearTimeout(t);
  }, [search, loadProduk]);

  const shownProduk = activeKat === 'all' ? produk : produk.filter((p) => p.ID_KATEGORI === activeKat);

  // ===== Modifier / varian saat tambah produk =====
  const [modProduk, setModProduk] = useState<Produk | null>(null);
  const [modGroups, setModGroups] = useState<ModifierGroup[]>([]);
  const [modSel, setModSel] = useState<Record<number, number[]>>({}); // groupId -> optionIds
  const modCache = useRef<Record<number, ModifierGroup[]>>({});

  async function addToCart(p: Produk) {
    try {
      let groups = modCache.current[p.ID];
      if (!groups) { groups = (await modifierService.getForProduct(p.ID)) || []; modCache.current[p.ID] = groups; }
      if (groups.length === 0) {
        const res = cart.addItem(p);
        if (!res.ok) toast.error(res.message || 'Gagal menambah item');
        return;
      }
      // Buka modal pilih varian.
      const init: Record<number, number[]> = {};
      groups.forEach((g) => { init[g.ID] = []; });
      setModSel(init); setModGroups(groups); setModProduk(p);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  function toggleModOption(group: ModifierGroup, optionId: number) {
    setModSel((s) => {
      const cur = s[group.ID] || [];
      if (group.TIPE === 'SINGLE') return { ...s, [group.ID]: [optionId] };
      return { ...s, [group.ID]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
    });
  }

  function confirmModifier() {
    if (!modProduk) return;
    // Validasi grup wajib.
    for (const g of modGroups) {
      if (g.WAJIB && !(modSel[g.ID] && modSel[g.ID].length)) {
        toast.error(`Pilih ${g.NAMA} dulu`); return;
      }
    }
    const chosen: ModifierOption[] = [];
    modGroups.forEach((g) => {
      (modSel[g.ID] || []).forEach((oid) => {
        const opt = (g.options || []).find((o) => o.ID === oid);
        if (opt) chosen.push(opt);
      });
    });
    const res = cart.addLine(modProduk, chosen);
    if (!res.ok) toast.error(res.message || 'Gagal menambah item');
    setModProduk(null);
  }

  async function scanBarcode(code: string) {
    if (!code.trim()) return;
    try { const p = await produkService.getByBarcode(code.trim()); addToCart(p); setSearch(''); }
    catch { toast.error('Produk barcode tidak ditemukan'); }
  }

  async function handleCheckout(data: { id_jenis_bayar: number; bayar: number; keterangan?: string; kode_voucher?: string }) {
    if (!user) return;
    setCheckingOut(true);
    try {
      // Mode edit bill -> bayar open bill; selain itu checkout langsung biasa.
      const result = billCtx
        ? await openBillService.pay(billCtx.id, {
            id_jenis_bayar: data.id_jenis_bayar,
            bayar: data.bayar,
            diskon: cart.diskon,
            keterangan: data.keterangan,
          })
        : await penjualanService.checkout({
            items: cart.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, modifier_option_ids: i.modifierOptionIds || [] })),
            id_jenis_bayar: data.id_jenis_bayar,
            id_user: user.id,
            bayar: data.bayar,
            diskon: cart.diskon,
            keterangan: data.keterangan,
            kode_voucher: data.kode_voucher,
          });
      const trx = await penjualanService.getById(result.id);
      cart.clear();
      setPayOpen(false);
      setCartOpen(false);
      if (billCtx) router.replace('/kasir/pos');
      setSuccess({ result, trx });
      loadProduk(search);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCheckingOut(false); }
  }

  // Simpan keranjang sebagai open bill baru (status OPEN).
  async function handleSaveBill() {
    if (!user || cart.items.length === 0) return;
    setSavingBill(true);
    try {
      await openBillService.create({
        customer_name: billForm.customer_name,
        table_no: billForm.table_no,
        note: billForm.note,
        items: cart.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, modifier_option_ids: i.modifierOptionIds || [] })),
      });
      toast.success('Pesanan tersimpan sebagai Open Bill');
      cart.clear();
      setSaveBillOpen(false);
      setBillForm({ customer_name: '', table_no: '', note: '' });
      setCartOpen(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingBill(false); }
  }

  // Simpan perubahan pada open bill yang sedang diedit.
  async function handleUpdateBill() {
    if (!billCtx || cart.items.length === 0) return;
    setSavingBill(true);
    try {
      await openBillService.update(billCtx.id, {
        customer_name: billCtx.customer_name,
        table_no: billCtx.table_no,
        note: billCtx.note,
        items: cart.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, modifier_option_ids: i.modifierOptionIds || [] })),
      });
      toast.success('Perubahan bill tersimpan');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingBill(false); }
  }

  // Batalkan open bill yang sedang diedit.
  async function handleCancelBill() {
    if (!billCtx) return;
    setSavingBill(true);
    try {
      await openBillService.cancel(billCtx.id);
      toast.success('Open bill dibatalkan');
      cart.clear();
      setCancelOpen(false);
      router.replace('/kasir/pos');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingBill(false); }
  }

  const categoryChip = (id: number | 'all', label: string) => {
    const active = activeKat === id;
    return (
      <button
        key={String(id)}
        onClick={() => setActiveKat(id)}
        className={cn(
          'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
          active
            ? 'border-primary bg-primary text-white shadow-card'
            : 'border-line bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-primary',
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="-m-3 sm:-m-4">
      <div className="flex flex-col lg:h-[calc(100vh-64px)] lg:flex-row">
        <section className="min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 xl:px-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-ink">
                {billCtx ? 'Edit Open Bill' : 'Kasir POS'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {billCtx
                  ? `Mengubah ${billCtx.no_bill || 'bill'} — tambah/kurangi item lalu simpan atau bayar.`
                  : 'Cari produk, tambahkan ke keranjang, lalu lakukan pembayaran.'}
              </p>
            </div>
            <div className="hidden rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-ink shadow-card sm:block">
              {cart.count()} item di keranjang
            </div>
          </div>

          {billCtx && (
            <div className="mb-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-card">
              {/* Ringkasan menonjol */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-bold text-white">
                  <User className="h-4 w-4" /> {billCtx.customer_name?.trim() || 'Tanpa nama'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-primary">
                  <Hash className="h-4 w-4" /> Meja {billCtx.table_no?.trim() || '-'}
                </span>
                {billCtx.no_bill && (
                  <span className="ml-auto font-mono text-xs font-semibold text-slate-400">{billCtx.no_bill}</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  label="Nama pelanggan / bill"
                  value={billCtx.customer_name}
                  onChange={(e) => cart.setBillMeta({ customer_name: e.target.value })}
                  placeholder="mis. Budi / Meja kopi"
                />
                <Input
                  label="Nomor meja"
                  value={billCtx.table_no}
                  onChange={(e) => cart.setBillMeta({ table_no: e.target.value })}
                  placeholder="mis. 04"
                />
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <SearchInput
              className="flex-1 [&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-brand-200 [&_input]:bg-white [&_input]:focus:border-primary [&_input]:focus:ring-accent/25"
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') scanBarcode((e.target as HTMLInputElement).value); }}
            />
            <Button
              variant="outline"
              onClick={() => scanBarcode(search)}
              title="Cari via barcode"
              className="h-12 rounded-2xl border-brand-200 bg-white px-4 text-primary hover:border-primary hover:bg-brand-50"
            >
              <ScanLine className="h-4 w-4" /> <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {categoryChip('all', 'Semua')}
            {kategori.map((k) => categoryChip(k.ID, k.DESKRIPSI))}
          </div>

          <ProductGrid produk={shownProduk} loading={loading} onAdd={addToCart} />
        </section>

        <aside className="hidden w-[300px] shrink-0 border-l border-brand-100 bg-white p-3 xl:w-[340px] xl:p-4 2xl:w-[390px] lg:block">
          <Cart
                onCheckout={() => setPayOpen(true)}
                onSaveBill={() => setSaveBillOpen(true)}
                onUpdateBill={handleUpdateBill}
                onCancelBill={() => setCancelOpen(true)}
              />
        </aside>
      </div>

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-white shadow-premium-lg transition hover:bg-brand-700 lg:hidden"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="font-bold">{cart.count()}</span>
        <span className="hidden font-semibold sm:inline">{formatRupiah(cart.total())}</span>
      </button>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 animate-fade-in lg:hidden" onClick={() => setCartOpen(false)}>
          <div className="flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white animate-slide-up-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-bold text-slate-900">Keranjang</span>
              <button onClick={() => setCartOpen(false)} aria-label="Tutup" className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Cart
                onCheckout={() => setPayOpen(true)}
                onSaveBill={handleSaveBillClick}
                onUpdateBill={handleUpdateBill}
                onCancelBill={() => setCancelOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={cart.total()}
        jenisBayar={jenisBayar}
        qris={qris}
        tax={tax}
        loading={checkingOut}
        onConfirm={handleCheckout}
      />

      {/* Modal Simpan Bill (open bill baru) */}
      <Modal
        open={saveBillOpen}
        onClose={() => setSaveBillOpen(false)}
        title="Simpan sebagai Open Bill"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSaveBillOpen(false)} disabled={savingBill}>Batal</Button>
            <Button onClick={handleSaveBill} loading={savingBill} disabled={cart.items.length === 0}>
              <ClipboardList className="h-4 w-4" /> Simpan Bill
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nama pelanggan / nama bill"
            value={billForm.customer_name}
            onChange={(e) => setBillForm((f) => ({ ...f, customer_name: e.target.value }))}
            placeholder="mis. Budi / Take away"
          />
          <Input
            label="Nomor meja (opsional)"
            value={billForm.table_no}
            onChange={(e) => setBillForm((f) => ({ ...f, table_no: e.target.value }))}
            placeholder="mis. 04"
          />
          <Input
            label="Catatan (opsional)"
            value={billForm.note}
            onChange={(e) => setBillForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="mis. es sedikit, tanpa gula"
          />
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {cart.count()} item akan disimpan. Stok belum dipotong sampai bill dibayar.
          </p>
        </div>
      </Modal>

      {/* Modal pilih varian/modifier saat tambah produk */}
      <Modal open={!!modProduk} onClose={() => setModProduk(null)} title={`Pilih varian - ${modProduk?.NAMA ?? ''}`} size="sm"
        footer={<><Button variant="outline" onClick={() => setModProduk(null)}>Batal</Button><Button onClick={confirmModifier}><Plus className="h-4 w-4" /> Tambah</Button></>}>
        <div className="space-y-4">
          {modGroups.map((g) => (
            <div key={g.ID}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{g.NAMA}</span>
                {g.WAJIB && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Wajib</span>}
                <span className="text-[10px] text-slate-400">{g.TIPE === 'SINGLE' ? 'pilih satu' : 'pilih banyak'}</span>
              </div>
              <div className="space-y-1.5">
                {(g.options || []).map((o) => {
                  const sel = (modSel[g.ID] || []).includes(o.ID);
                  return (
                    <button
                      key={o.ID}
                      onClick={() => toggleModOption(g, o.ID)}
                      className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors',
                        sel ? 'border-primary bg-brand-50 text-primary' : 'border-line bg-white text-slate-700 hover:bg-canvas')}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', sel ? 'border-primary bg-primary' : 'border-slate-300')}>
                          {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {o.NAMA}
                      </span>
                      <span className="font-semibold">{o.HARGA > 0 ? `+${formatRupiah(o.HARGA)}` : 'Gratis'}</span>
                    </button>
                  );
                })}
                {(g.options || []).length === 0 && <p className="text-xs text-slate-400">Belum ada opsi</p>}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal info fitur PRO (Simpan Bill / voucher) — konteks kasir: tanpa tombol upgrade */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        showUpgradeButton={false}
        description="Fitur ini hanya tersedia untuk merchant plan PRO. Hubungi admin toko untuk upgrade."
      />

      {/* Konfirmasi batalkan open bill */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelBill}
        loading={savingBill}
        title="Batalkan open bill"
        message={`Batalkan ${billCtx?.no_bill || 'bill ini'}? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Batalkan Bill"
      />

      <Modal
        open={!!success}
        onClose={() => setSuccess(null)}
        title="Transaksi Berhasil"
        footer={
          <>
            <div className="mr-auto flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
              {(['58', '80'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReceiptSize(s)}
                  className={cn('rounded-md px-2.5 py-1 text-xs font-bold transition-colors',
                    receiptSize === s ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100')}
                >{s}mm</button>
              ))}
            </div>
            <Button variant="outline" onClick={() => printThermal(receiptThermalRef.current, receiptSize)}>
              <Printer className="h-4 w-4" /> Cetak thermal
            </Button>
            <Button onClick={() => setSuccess(null)}>
              <Plus className="h-4 w-4" /> Transaksi baru
            </Button>
          </>
        }
      >
        {success && (
          <div>
            <div className="mb-3 flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm text-slate-600">
                Nota <b className="font-semibold text-slate-800">#{success.result.no_nota}</b> tersimpan.
              </p>
              {success.result.kembalian != null && (
                <p className="text-lg font-semibold text-emerald-600">
                  Kembalian: {formatRupiah(success.result.kembalian)}
                </p>
              )}
            </div>
            <div className="flex justify-center rounded-xl border border-dashed border-slate-200 py-2">
              <Receipt
                ref={receiptThermalRef}
                trx={success.trx}
                namaToko={identitas?.NAMA || user?.merchant?.nama}
                alamatToko={identitas?.ALAMAT || undefined}
                bayar={success.result.bayar}
                plan={plan}
                size={receiptSize}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
