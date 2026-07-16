'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Plus, Printer, ScanLine, ShoppingCart, X, ClipboardList, User, Hash, LockOpen, Lock, Wallet, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchInput, Button, Modal, Input, ConfirmDialog, UpgradeModal } from '@/components/ui';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal, isQrisName } from '@/components/pos/PaymentModal';
import { SplitBillModal, type SplitConfirmData } from '@/components/pos/SplitBillModal';
import { Receipt } from '@/components/pos/Receipt';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { produkService, jenisBayarService, kategoriService, penjualanService, paymentService, openBillService, qrisService, taxService, identitasService, modifierService, kasShiftService, getErrorMessage } from '@/services';
import { cn } from '@/utils/cn';
import { formatRupiah } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { printReceipt } from '@/utils/printThermal';
import { buildReceiptEscPos } from '@/utils/escpos';
import { enqueueSale, buildOfflineDraft, isNetworkError } from '@/utils/offlineQueue';
import type { Produk, JenisBayar, Kategori, Penjualan, CheckoutResult, Qris, TaxSetting, Identitas, ModifierGroup, ModifierOption, PlanType, MidtransSnapResult } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import type { PaginationMeta } from '@/services/api';

export default function PosPage() {
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore();
  const [produk, setProduk] = useState<Produk[]>([]);
  const [jenisBayar, setJenisBayar] = useState<JenisBayar[]>([]);
  const [qris, setQris] = useState<Qris | null>(null);
  const [tax, setTax] = useState<TaxSetting | null>(null);
  const [identitas, setIdentitas] = useState<Identitas | null>(null);
  const plan = (user?.merchant?.plan as PlanType) || 'FREE';
  const [receiptSize, setReceiptSize] = useState<'58' | '80'>('58');
  const receiptThermalRef = useRef<HTMLDivElement>(null);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [activeKat, setActiveKat] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [productPage, setProductPage] = useState(1);
  const [productMeta, setProductMeta] = useState<PaginationMeta | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState<{ result: CheckoutResult; trx: Penjualan; offline?: boolean } | null>(null);
  const [waNomor, setWaNomor] = useState('');
  const [waSending, setWaSending] = useState(false);

  // ===== Open Bill =====
  const router = useRouter();
  const searchParams = useSearchParams();
  const billParam = searchParams.get('bill');
  const splitParam = searchParams.get('split');
  const [saveBillOpen, setSaveBillOpen] = useState(false);
  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [savingBill, setSavingBill] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [billForm, setBillForm] = useState({ customer_name: '', table_no: '', note: '' });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const billCtx = cart.bill;
  const isPro = plan === 'PRO' || plan === 'BUSINESS'; // BUSINESS = superset PRO
  const [midtransRes, setMidtransRes] = useState<MidtransSnapResult | null>(null);

  // ===== Sesi kasir (shift) =====
  // null = belum diketahui (loading), true = sesi aktif, false = belum buka.
  const [shiftActive, setShiftActive] = useState<boolean | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  // Cek sesi kasir aktif saat masuk halaman POS. Bila belum ada, tampilkan modal.
  useEffect(() => {
    kasShiftService.active()
      .then((s) => {
        const ok = !!s;
        setShiftActive(ok);
        if (!ok) setShiftModalOpen(true);
      })
      .catch(() => setShiftActive(null));
  }, []);

  // Penjaga aksi transaksi: blokir bila sesi kasir belum dibuka.
  function requireShift(): boolean {
    if (shiftActive === false) { setShiftModalOpen(true); return false; }
    return true;
  }

  // Klik "Simpan Bill": FREE -> modal upgrade; PRO -> modal simpan bill.
  function handleSaveBillClick() {
    if (!requireShift()) return;
    if (!isPro) { setUpgradeOpen(true); return; }
    setSaveBillOpen(true);
  }

  // Klik "Split Bill": FREE -> modal upgrade; PRO -> modal split bill.
  function handleSplitBillClick() {
    if (!requireShift()) return;
    if (!isPro) { setUpgradeOpen(true); return; }
    setSplitBillOpen(true);
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

  useEffect(() => {
    if (splitParam === '1' && billCtx && cart.items.length > 0) {
      if (isPro) setSplitBillOpen(true);
      else setUpgradeOpen(true);
    }
  }, [splitParam, billCtx?.id, cart.items.length, isPro]);

  const loadProduk = useCallback(async (
    q = '',
    pageNo = 1,
    append = false,
    category: number | 'all' = 'all',
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await produkService.listPage({
        search: q || undefined,
        category_id: category,
        page: pageNo,
        limit: 30,
      });
      setProduk((prev) => {
        if (!append) return res.data || [];
        const seen = new Set(prev.map((p) => p.ID));
        return [...prev, ...(res.data || []).filter((p) => !seen.has(p.ID))];
      });
      setProductMeta(res.meta);
      setProductPage(res.meta?.page ?? pageNo);
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { if (append) setLoadingMore(false); else setLoading(false); }
  }, []);

  useEffect(() => {
    jenisBayarService.list().then((j) => setJenisBayar(j || [])).catch(() => {});
    qrisService.get().then((q) => setQris(q || null)).catch(() => {});
    kategoriService.list().then((k) => setKategori(k || [])).catch(() => {});
    taxService.get().then((tx) => setTax(tx || null)).catch(() => {});
    identitasService.get().then((it) => setIdentitas(it || null)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadProduk(search, 1, false, activeKat), 350);
    return () => clearTimeout(t);
  }, [search, activeKat, loadProduk]);

  const shownProduk = produk;

  // ===== Modifier / varian saat tambah produk =====
  const [modProduk, setModProduk] = useState<Produk | null>(null);
  const [modGroups, setModGroups] = useState<ModifierGroup[]>([]);
  const [modSel, setModSel] = useState<Record<number, number[]>>({}); // groupId -> optionIds
  const modCache = useRef<Record<number, ModifierGroup[]>>({});

  async function addToCart(p: Produk) {
    if (!requireShift()) return;
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
    if (!requireShift()) return;
    try { const p = await produkService.getByBarcode(code.trim()); addToCart(p); setSearch(''); }
    catch { toast.error('Produk barcode tidak ditemukan'); }
  }

  async function handleCheckout(data: { id_jenis_bayar: number; bayar: number; keterangan?: string; kode_voucher?: string }) {
    if (!user) return;
    if (!requireShift()) { setPayOpen(false); return; }
    setCheckingOut(true);
    const checkoutPayload = {
      items: cart.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, modifier_option_ids: i.modifierOptionIds || [] })),
      id_jenis_bayar: data.id_jenis_bayar,
      id_user: user.id,
      bayar: data.bayar,
      diskon: cart.diskon,
      keterangan: data.keterangan,
      kode_voucher: data.kode_voucher,
    };
    try {
      // Mode edit bill -> bayar open bill; selain itu checkout langsung biasa.
      const result = billCtx
        ? await openBillService.pay(billCtx.id, {
            id_jenis_bayar: data.id_jenis_bayar,
            bayar: data.bayar,
            diskon: cart.diskon,
            keterangan: data.keterangan,
          })
        : await penjualanService.checkout(checkoutPayload);
      const trx = await penjualanService.getById(result.id);
      cart.clear();
      setPayOpen(false);
      setCartOpen(false);
      if (billCtx) router.replace('/kasir/pos');
      setSuccess({ result, trx });
      loadProduk(search, 1, false, activeKat);
    } catch (err) {
      const metodeNama = jenisBayar.find((j) => j.ID === data.id_jenis_bayar)?.NAMA;
      // Cuma transaksi tunai/non-gateway di checkout biasa (bukan open bill) yang aman
      // diantre offline — QRIS/Midtrans butuh gateway online beneran, gak bisa "disimpan
      // lalu disinkron" karena pembayarannya sendiri belum pernah terjadi.
      if (!billCtx && !isQrisName(metodeNama) && isNetworkError(err)) {
        enqueueSale(checkoutPayload);
        const { result, trx } = buildOfflineDraft({
          items: cart.items,
          bayar: data.bayar,
          diskon: cart.diskon,
          keterangan: data.keterangan,
          jenisBayarId: data.id_jenis_bayar,
          jenisBayarNama: metodeNama,
          kasirNama: user.nama,
          tax,
          plan,
        });
        cart.clear();
        setPayOpen(false);
        setCartOpen(false);
        setSuccess({ result, trx, offline: true });
        toast('Koneksi terputus — transaksi disimpan offline & otomatis dikirim saat online lagi.', { icon: '📡' });
      } else {
        toast.error(getErrorMessage(err));
      }
    }
    finally { setCheckingOut(false); }
  }

  function reduceSplitCart(lines: { lineId: string; qty: number }[]) {
    lines.forEach((line) => {
      const current = cart.items.find((item) => item.lineId === line.lineId);
      if (!current) return;
      cart.updateQty(line.lineId, Math.max(0, Number(current.qty || 0) - Number(line.qty || 0)));
    });
  }

  async function handleSplitBillPay(data: SplitConfirmData) {
    if (!requireShift()) { setSplitBillOpen(false); return; }
    if (!user) return;
    setCheckingOut(true);
    try {
      const result = billCtx
        ? await openBillService.payPartial(billCtx.id, data)
        : await penjualanService.checkout({
            items: data.checkout_items,
            id_jenis_bayar: data.id_jenis_bayar,
            id_user: user.id,
            bayar: data.bayar,
            keterangan: data.keterangan,
          });
      const trx = await penjualanService.getById(result.id);
      setSuccess({ result, trx });
      setCartOpen(false);

      if (billCtx) {
        if ('bill_status' in result && result.bill_status === 'PAID') {
          cart.clear();
          setSplitBillOpen(false);
          router.replace('/kasir/pos');
          toast.success('Split bill selesai, semua item sudah lunas');
        } else {
          const fresh = await openBillService.getById(billCtx.id);
          cart.loadBill(fresh);
          const remainingTotal = 'remaining_total' in result ? Number(result.remaining_total || 0) : 0;
          toast.success(`Split bill dibayar. Sisa bill ${formatRupiah(remainingTotal)}`);
        }
      } else {
        reduceSplitCart(data.line_items);
        toast.success('Split bill dibayar');
        const remainingCount = data.line_items.reduce((sum, line) => {
          const current = cart.items.find((item) => item.lineId === line.lineId);
          return sum + Math.max(0, Number(current?.qty || 0) - Number(line.qty || 0));
        }, 0);
        if (remainingCount <= 0) setSplitBillOpen(false);
      }
      if (billCtx && !('bill_status' in result)) {
        const fresh = await openBillService.getById(billCtx.id);
        cart.loadBill(fresh);
      }
      loadProduk(search, 1, false, activeKat);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCheckingOut(false); }
  }

  async function handleCreateSplitMidtrans(data: SplitConfirmData) {
    if (!user) throw new Error('Sesi tidak ditemukan');
    if (shiftActive === false) { setShiftModalOpen(true); throw new Error('Sesi kasir belum dibuka'); }
    if (billCtx) {
      return openBillService.createPartialQris(billCtx.id, {
        payer_name: data.payer_name,
        items: data.items,
        id_jenis_bayar: data.id_jenis_bayar,
        keterangan: data.keterangan,
        customer_name: data.payer_name,
      });
    }
    return paymentService.createQris({
      items: data.checkout_items,
      id_jenis_bayar: data.id_jenis_bayar,
      id_user: user.id,
      keterangan: data.keterangan,
      customer_name: data.payer_name,
    });
  }

  async function handleSplitMidtransPaid(data: SplitConfirmData, transactionId: number) {
    const trx = await penjualanService.getById(transactionId);
    const result = {
      id: transactionId,
      no_nota: trx.NO_NOTA || String(transactionId),
      subtotal: Number(trx.TOTAL) || 0,
      diskon: 0,
      total: Number(trx.TOTAL) || 0,
      bayar: Number(trx.TOTAL) || 0,
      kembalian: 0,
    } as CheckoutResult;
    setSuccess({ result, trx });
    if (billCtx) {
      const fresh = await openBillService.getById(billCtx.id);
      if (fresh.STATUS === 'PAID') {
        cart.clear();
        setSplitBillOpen(false);
        router.replace('/kasir/pos');
      } else {
        cart.loadBill(fresh);
      }
    } else {
      reduceSplitCart(data.line_items);
    }
    loadProduk(search, 1, false, activeKat);
  }

  // ===== Midtrans QRIS dinamis (khusus BUSINESS) =====
  // Buat transaksi + QRIS dinamis. Backend memvalidasi plan BUSINESS & menghitung
  // nominal dari item (merchant_id selalu dari token login).
  async function handleCreateMidtrans(opts: { keterangan?: string; kode_voucher?: string }) {
    if (!user) throw new Error('Sesi tidak ditemukan');
    if (shiftActive === false) { setShiftModalOpen(true); throw new Error('Sesi kasir belum dibuka'); }
    const qrisMethod = jenisBayar.find((j) => j.NAMA.toUpperCase().includes('QRIS'));
    const idJenisBayar = qrisMethod?.ID ?? jenisBayar[0]?.ID;
    const res = await paymentService.createQris({
      items: cart.items.map((i) => ({ id_produk: i.id_produk, qty: i.qty, modifier_option_ids: i.modifierOptionIds || [] })),
      id_jenis_bayar: idJenisBayar,
      id_user: user.id,
      diskon: cart.diskon,
      keterangan: opts.keterangan,
      kode_voucher: opts.kode_voucher,
    });
    setMidtransRes(res);
    return res;
  }

  // Polling status pembayaran (dipanggil PaymentModal tiap 3 detik).
  function handlePollMidtrans(transactionId: number) {
    return paymentService.status(transactionId);
  }

  // Saat webhook Midtrans menandai PAID -> tampilkan struk & bersihkan keranjang.
  async function handleMidtransSuccess(transactionId: number) {
    try {
      const trx = await penjualanService.getById(transactionId);
      const result = {
        id: transactionId,
        no_nota: midtransRes?.no_nota || trx.NO_NOTA || String(transactionId),
        subtotal: cart.total(),
        diskon: cart.diskon,
        total: midtransRes?.gross_amount ?? (Number(trx.TOTAL) || 0),
        bayar: midtransRes?.gross_amount ?? (Number(trx.TOTAL) || 0),
        kembalian: 0,
      } as CheckoutResult;
      cart.clear();
      setPayOpen(false);
      setCartOpen(false);
      setMidtransRes(null);
      setSuccess({ result, trx });
      loadProduk(search, 1, false, activeKat);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  // Simpan keranjang sebagai open bill baru (status OPEN).
  async function handleSaveBill() {
    if (!user || cart.items.length === 0) return;
    if (!requireShift()) return;
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

  function closeSuccess() {
    setSuccess(null);
    setWaNomor('');
  }

  async function handleKirimWA() {
    if (!success) return;
    if (!isPro) { setUpgradeOpen(true); return; }
    const nomorBersih = waNomor.replace(/\D/g, '');
    if (nomorBersih.length < 9) { toast.error('Nomor WhatsApp belum valid'); return; }
    setWaSending(true);
    try {
      await penjualanService.kirimWA(success.trx.ID, nomorBersih);
      toast.success('Struk terkirim ke WhatsApp');
      setWaNomor('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWaSending(false);
    }
  }

  const categoryChip = (id: number | 'all', label: string) => {
    const active = activeKat === id;
    return (
      <button
        key={String(id)}
        onClick={() => { setActiveKat(id); setProductPage(1); }}
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Status sesi kasir */}
              {shiftActive === true && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <LockOpen className="h-4 w-4" /> Sesi kasir aktif
                </span>
              )}
              {shiftActive === false && (
                <button
                  onClick={() => router.push('/kasir/closing')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                >
                  <Lock className="h-4 w-4" /> Sesi kasir belum dibuka
                </button>
              )}
              <div className="hidden rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-ink shadow-card sm:block">
                {cart.count()} item di keranjang
              </div>
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
              onChange={(e) => { setSearch(e.target.value); setProductPage(1); }}
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
          {!loading && productMeta && productPage < productMeta.total_pages && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadProduk(search, productPage + 1, true, activeKat)}
                loading={loadingMore}
              >
                Muat produk lagi
              </Button>
            </div>
          )}
        </section>

        <aside className="hidden w-[300px] shrink-0 border-l border-brand-100 bg-white p-3 xl:w-[340px] xl:p-4 2xl:w-[390px] lg:block">
          <Cart
                onCheckout={() => { if (requireShift()) setPayOpen(true); }}
                onSaveBill={handleSaveBillClick}
                onUpdateBill={handleUpdateBill}
                onSplitBill={handleSplitBillClick}
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
                onCheckout={() => { if (requireShift()) setPayOpen(true); }}
                onSaveBill={handleSaveBillClick}
                onUpdateBill={handleUpdateBill}
                onSplitBill={handleSplitBillClick}
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
        plan={plan}
        onConfirm={handleCheckout}
        // QRIS Midtrans dinamis hanya aktif saat bukan mode edit open bill.
        onCreateMidtrans={!billCtx ? handleCreateMidtrans : undefined}
        onPollMidtrans={handlePollMidtrans}
        onMidtransSuccess={handleMidtransSuccess}
      />

      <SplitBillModal
        open={splitBillOpen}
        onClose={() => setSplitBillOpen(false)}
        items={cart.items}
        jenisBayar={jenisBayar}
        qris={qris}
        tax={tax}
        plan={plan}
        loading={checkingOut}
        onConfirm={handleSplitBillPay}
        onCreateMidtrans={handleCreateSplitMidtrans}
        onPollMidtrans={handlePollMidtrans}
        onMidtransPaid={handleSplitMidtransPaid}
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
                {g.WAJIB && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">Wajib</span>}
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

      {/* Modal: sesi kasir belum dibuka — blokir transaksi */}
      <Modal
        open={shiftModalOpen && shiftActive === false}
        onClose={() => setShiftModalOpen(false)}
        title="Sesi Kasir Belum Dibuka"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShiftModalOpen(false)}>Nanti</Button>
            <Button onClick={() => router.push('/kasir/closing')}>
              <LockOpen className="h-4 w-4" /> Buka Kasir Sekarang
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <Wallet className="h-7 w-7" />
          </span>
          <p className="text-sm text-slate-600">
            Sebelum mulai melayani transaksi, kamu harus <b className="font-semibold text-ink">membuka sesi kasir</b> terlebih dahulu.
            Semua penjualanmu akan tercatat di sesi ini supaya bisa dicocokkan saat tutup kasir.
          </p>
          <p className="text-sm text-slate-500">
            Klik tombol di bawah untuk menuju halaman <b className="font-semibold text-ink">Buka/Tutup Kasir</b>.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!success}
        onClose={closeSuccess}
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
            <Button
              variant="outline"
              onClick={async () => {
                if (!success) return;
                const bytes = await buildReceiptEscPos({
                  trx: success.trx,
                  namaToko: identitas?.NAMA || user?.merchant?.nama,
                  alamatToko: identitas?.ALAMAT || undefined,
                  logoUrl: identitas?.LOGO_URL,
                  bayar: success.result.bayar,
                  plan,
                  size: receiptSize,
                });
                printReceipt(receiptThermalRef.current, receiptSize, bytes);
              }}
            >
              <Printer className="h-4 w-4" /> Cetak thermal
            </Button>
            <Button onClick={closeSuccess}>
              <Plus className="h-4 w-4" /> Transaksi baru
            </Button>
          </>
        }
      >
        {success && (
          <div>
            <div className="mb-3 flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-5 text-center dark:bg-emerald-500/15">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              {success.offline && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  Tersimpan offline — akan disinkron otomatis
                </span>
              )}
              <p className="text-sm text-slate-600">
                Nota <b className="font-semibold text-slate-800">{nomorNotaPenjualanLabel(success.trx)}</b> tersimpan.
              </p>
              {success.result.kembalian != null && (
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                  Kembalian: {formatRupiah(success.result.kembalian)}
                </p>
              )}
              {success.trx.open_bill && (
                <p className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Open Bill {success.trx.open_bill.no_bill} · dibuka oleh {success.trx.open_bill.dibuka_oleh ?? '-'}
                </p>
              )}
            </div>
            <div className="flex justify-center rounded-xl border border-dashed border-slate-200 py-2">
              <Receipt
                ref={receiptThermalRef}
                trx={success.trx}
                namaToko={identitas?.NAMA || user?.merchant?.nama}
                alamatToko={identitas?.ALAMAT || undefined}
                logoUrl={identitas?.LOGO_URL}
                bayar={success.result.bayar}
                plan={plan}
                size={receiptSize}
              />
            </div>

            {isPro ? (
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <Input
                  label="Kirim struk ke WhatsApp"
                  placeholder="081234567890"
                  value={waNomor}
                  onChange={(e) => setWaNomor(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-500">Format 08xxxxxxxxxx, contoh: 081234567890.</p>
                <Button onClick={handleKirimWA} loading={waSending} className="mt-2 w-full">
                  <MessageCircle className="h-4 w-4" /> Kirim ke WhatsApp
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setUpgradeOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500 transition-colors hover:border-primary hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" /> Kirim struk ke WhatsApp (fitur PRO)
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
