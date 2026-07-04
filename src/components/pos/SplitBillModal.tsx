'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Minus, Plus, ReceiptText, RefreshCw, ScanLine, Users, Zap } from 'lucide-react';
import { Modal, Button, Input, CurrencyInput, SelectMenu } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatRupiah } from '@/utils/format';
import type { CartItem, JenisBayar, MidtransQrisResult, PaymentStatusResult, PlanType, Qris, TaxSetting } from '@/types';

const MIDTRANS = 'MIDTRANS' as const;
type PaymentMethod = number | typeof MIDTRANS;

interface OpenBillSelection {
  id_open_bill_detail: number;
  qty: number;
}

interface CheckoutSelection {
  id_produk: number;
  qty: number;
  modifier_option_ids?: number[];
}

interface LineSelection {
  lineId: string;
  qty: number;
}

export interface SplitConfirmData {
  payer_name?: string;
  items: OpenBillSelection[];
  checkout_items: CheckoutSelection[];
  line_items: LineSelection[];
  id_jenis_bayar: number;
  bayar: number;
  keterangan?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  jenisBayar: JenisBayar[];
  qris?: Qris | null;
  tax?: TaxSetting | null;
  plan?: PlanType;
  loading?: boolean;
  onConfirm: (data: SplitConfirmData) => Promise<void> | void;
  onCreateMidtrans?: (data: SplitConfirmData) => Promise<MidtransQrisResult>;
  onPollMidtrans?: (transactionId: number) => Promise<PaymentStatusResult>;
  onMidtransPaid?: (data: SplitConfirmData, transactionId: number) => Promise<void> | void;
}

interface UnitChip {
  id: string;
  lineId: string;
  detailId?: number;
  idProduk: number;
  modifierOptionIds: number[];
  label: string;
  modifierText?: string | null;
  unitPrice: number;
  person: number;
}

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 12;

const isQrisName = (nama?: string) => !!nama && nama.toUpperCase().includes('QRIS');
const isTransferName = (nama?: string) => !!nama && nama.toUpperCase().includes('TRANSFER');

function unitOf(item: CartItem) {
  return Number(item.harga || 0) + Number(item.modifierExtra || 0);
}

function buildUnits(items: CartItem[], peopleCount: number): UnitChip[] {
  const people = Math.max(MIN_PEOPLE, peopleCount);
  const units: UnitChip[] = [];
  items
    .filter((item) => item.qty > 0)
    .forEach((item) => {
      const qty = Math.floor(Number(item.qty || 0));
      for (let i = 1; i <= qty; i += 1) {
        units.push({
          id: `${item.lineId}-${i}`,
          lineId: item.lineId,
          detailId: item.openBillDetailId,
          idProduk: item.id_produk,
          modifierOptionIds: item.modifierOptionIds || [],
          label: qty > 1 ? `${item.nama} #${i}` : item.nama,
          modifierText: item.modifierText,
          unitPrice: unitOf(item),
          person: ((units.length) % people) + 1,
        });
      }
    });
  return units;
}

function groupedOpenBill(chips: UnitChip[]): OpenBillSelection[] {
  const map = new Map<number, number>();
  chips.forEach((chip) => {
    if (chip.detailId) map.set(chip.detailId, (map.get(chip.detailId) || 0) + 1);
  });
  return Array.from(map.entries()).map(([id_open_bill_detail, qty]) => ({ id_open_bill_detail, qty }));
}

function groupedCheckout(chips: UnitChip[]): CheckoutSelection[] {
  const map = new Map<string, CheckoutSelection>();
  chips.forEach((chip) => {
    const key = `${chip.lineId}`;
    const current = map.get(key);
    if (current) current.qty += 1;
    else map.set(key, { id_produk: chip.idProduk, qty: 1, modifier_option_ids: chip.modifierOptionIds });
  });
  return Array.from(map.values());
}

function groupedLines(chips: UnitChip[]): LineSelection[] {
  const map = new Map<string, number>();
  chips.forEach((chip) => map.set(chip.lineId, (map.get(chip.lineId) || 0) + 1));
  return Array.from(map.entries()).map(([lineId, qty]) => ({ lineId, qty }));
}

export function SplitBillModal({
  open, onClose, items, jenisBayar, qris, tax, plan, loading,
  onConfirm, onCreateMidtrans, onPollMidtrans, onMidtransPaid,
}: Props) {
  const [peopleCount, setPeopleCount] = useState(2);
  const [chips, setChips] = useState<UnitChip[]>([]);
  const [activePerson, setActivePerson] = useState<number | null>(null);
  const [metode, setMetode] = useState<PaymentMethod>(jenisBayar[0]?.ID ?? 0);
  const [bayar, setBayar] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');
  const [mtPhase, setMtPhase] = useState<'idle' | 'creating' | 'waiting' | 'paid' | 'failed'>('idle');
  const [mtData, setMtData] = useState<MidtransQrisResult | null>(null);
  const [mtMsg, setMtMsg] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPro = plan === 'PRO' || plan === 'BUSINESS';
  const isBusiness = plan === 'BUSINESS';
  const qrisAvailable = !!(qris && qris.IS_ACTIVE && qris.IMAGE_URL);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    if (!open) {
      stopPolling();
      return;
    }
    const nextPeople = Math.max(2, Math.min(MAX_PEOPLE, peopleCount));
    setPeopleCount(nextPeople);
    setChips(buildUnits(items, nextPeople));
    setActivePerson(null);
    setBayar(0);
    setKeterangan('');
    setMetode(jenisBayar[0]?.ID ?? 0);
    setMtPhase('idle');
    setMtData(null);
    setMtMsg('');
    stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, jenisBayar]);

  useEffect(() => stopPolling, []);

  const people = useMemo(() => Array.from({ length: peopleCount }, (_, i) => i + 1), [peopleCount]);
  const allData = useMemo(() => {
    const subtotal = chips.reduce((sum, chip) => sum + chip.unitPrice, 0);
    const ppn = isPro && tax?.PPN_ENABLED ? Math.round((subtotal * Number(tax.PPN_PERSEN || 0)) / 100) : 0;
    const service = isPro && tax?.SERVICE_ENABLED ? Math.round((subtotal * Number(tax.SERVICE_PERSEN || 0)) / 100) : 0;
    return { person: 0, chips, subtotal, ppn, service, total: subtotal + ppn + service };
  }, [chips, isPro, tax]);

  const byPerson = useMemo(() => people.map((person) => {
    const personChips = chips.filter((chip) => chip.person === person);
    const subtotal = personChips.reduce((sum, chip) => sum + chip.unitPrice, 0);
    const ppn = isPro && tax?.PPN_ENABLED ? Math.round((subtotal * Number(tax.PPN_PERSEN || 0)) / 100) : 0;
    const service = isPro && tax?.SERVICE_ENABLED ? Math.round((subtotal * Number(tax.SERVICE_PERSEN || 0)) / 100) : 0;
    return { person, chips: personChips, subtotal, ppn, service, total: subtotal + ppn + service };
  }), [chips, people, isPro, tax]);

  const activeData = activePerson === 0 ? allData : activePerson ? byPerson.find((p) => p.person === activePerson) : null;
  const activeLabel = activeData?.person === 0 ? 'Sisa Bill' : `Orang ${activeData?.person}`;
  const selectedMethod = typeof metode === 'number' ? jenisBayar.find((j) => j.ID === metode) : undefined;
  const gatewayJenisBayarId = jenisBayar.find((j) => isQrisName(j.NAMA))?.ID ?? jenisBayar[0]?.ID ?? 0;
  const isQrisManual = typeof metode === 'number' && isQrisName(selectedMethod?.NAMA);
  const isTransfer = typeof metode === 'number' && isTransferName(selectedMethod?.NAMA);
  const isMidtrans = metode === MIDTRANS;
  const paidAmount = activeData && (isQrisManual || isMidtrans) ? activeData.total : bayar;
  const kurang = !!activeData && paidAmount < activeData.total;
  const allPaid = chips.length === 0;

  const methodOptions = [
    ...jenisBayar.map((j) => ({ value: j.ID as string | number, label: isQrisName(j.NAMA) ? 'QRIS Manual' : j.NAMA })),
    ...(isBusiness && onCreateMidtrans ? [{ value: MIDTRANS, label: 'QRIS Payment Gateway' }] : []),
  ];

  function dataForActive(methodId?: number): SplitConfirmData | null {
    const idJenisBayar = typeof metode === 'number' ? metode : methodId;
    if (!activeData || activeData.chips.length === 0 || !idJenisBayar) return null;
    return {
      payer_name: activeData.person === 0 ? 'Sisa Bill' : `Orang ${activeData.person}`,
      items: groupedOpenBill(activeData.chips),
      checkout_items: groupedCheckout(activeData.chips),
      line_items: groupedLines(activeData.chips),
      id_jenis_bayar: idJenisBayar,
      bayar: paidAmount,
      keterangan: keterangan || `Split Bill - ${activeData.person === 0 ? 'Sisa Bill' : `Orang ${activeData.person}`}`,
    };
  }

  function rebalance(nextPeople: number) {
    const clamped = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, nextPeople));
    setPeopleCount(clamped);
    setActivePerson((current) => (current && current <= clamped ? current : null));
    setChips((current) => current.map((chip, idx) => ({
      ...chip,
      person: chip.person > clamped ? ((idx % clamped) + 1) : chip.person,
    })));
  }

  function moveChip(chipId: string) {
    setChips((current) => current.map((chip) => {
      if (chip.id !== chipId) return chip;
      return { ...chip, person: chip.person >= peopleCount ? 1 : chip.person + 1 };
    }));
  }

  function openPayment(person: number) {
    const data = person === 0 ? allData : byPerson.find((p) => p.person === person);
    if (!data || data.chips.length === 0) return;
    setActivePerson(person);
    setBayar(0);
    setKeterangan('');
    setMtPhase('idle');
    setMtData(null);
    setMtMsg('');
    stopPolling();
  }

  async function confirmPayment() {
    const payload = dataForActive();
    if (!payload) return;
    await onConfirm(payload);
    setActivePerson(null);
  }

  async function checkMidtrans(transactionId: number, payload: SplitConfirmData, showFeedback = false) {
    if (!onPollMidtrans) return;
    if (showFeedback) setCheckingStatus(true);
    try {
      const status = await onPollMidtrans(transactionId);
      if (status.payment_status === 'PAID') {
        stopPolling();
        setMtPhase('paid');
        await onMidtransPaid?.(payload, transactionId);
        setActivePerson(null);
      } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(status.payment_status)) {
        stopPolling();
        setMtPhase('failed');
        setMtMsg(`Pembayaran ${status.payment_status.toLowerCase()}. Silakan buat ulang QRIS.`);
      }
    } finally {
      if (showFeedback) setCheckingStatus(false);
    }
  }

  async function startMidtrans() {
    if (!onCreateMidtrans || !activeData || activeData.chips.length === 0) return;
    const payload = dataForActive(gatewayJenisBayarId);
    if (!payload) return;
    setMtPhase('creating');
    setMtMsg('');
    try {
      const res = await onCreateMidtrans(payload);
      setMtData(res);
      setMtPhase('waiting');
      stopPolling();
      pollRef.current = setInterval(() => { checkMidtrans(res.transaction_id, payload); }, 3000);
    } catch (err) {
      setMtPhase('failed');
      setMtMsg(err instanceof Error ? err.message : 'Gagal membuat QRIS Payment Gateway.');
    }
  }

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={loading}>Tutup</Button>
      <Button variant="outline" onClick={() => openPayment(0)} disabled={loading || allPaid}>Lunasin Semua</Button>
      <Button disabled={!allPaid} onClick={onClose}>Selesai</Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Split Bill" size="xl" footer={footer}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1 text-sm font-bold">
            <span className="rounded-lg bg-white px-4 py-2 text-primary shadow-sm">Per Item</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => rebalance(peopleCount - 1)} disabled={peopleCount <= MIN_PEOPLE || loading} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Kurangi jumlah orang"><Minus className="h-4 w-4" /></button>
            <span className="min-w-[86px] text-center text-sm text-slate-500"><b className="text-base text-slate-900">{peopleCount}</b> orang</span>
            <button type="button" onClick={() => rebalance(peopleCount + 1)} disabled={peopleCount >= MAX_PEOPLE || loading} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-primary hover:bg-brand-50 disabled:opacity-40" aria-label="Tambah jumlah orang"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <p className="text-xs font-medium text-slate-500">Klik chip item untuk memindahkan ke orang berikutnya.</p>

        <div className="space-y-3">
          {byPerson.map((row) => (
            <div key={row.person} className={cn('rounded-2xl border p-4', row.person % 2 === 1 ? 'border-blue-200 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10' : 'border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10')}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-card', row.person % 2 === 1 ? 'bg-blue-500' : 'bg-amber-500')}>{row.person}</span>
                  <div className="min-w-0"><p className="font-black text-slate-900">Orang {row.person}</p><p className="text-xs text-slate-500">{row.chips.length} item</p></div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-xl font-black text-slate-900">{formatRupiah(row.total)}</span>
                  <Button size="sm" className="rounded-xl bg-primary px-5 shadow-card hover:bg-brand-700" disabled={row.chips.length === 0 || loading} onClick={() => openPayment(row.person)}>Bayar</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {row.chips.map((chip) => (
                  <button key={chip.id} type="button" onClick={() => moveChip(chip.id)} title={chip.modifierText || chip.label} className={cn('inline-flex max-w-full items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition-colors', row.person % 2 === 1 ? 'border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/15' : 'border-amber-200 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/15')}>
                    <span className="truncate">{chip.label}</span><ArrowRight className="h-3 w-3 shrink-0" />
                  </button>
                ))}
                {row.chips.length === 0 && <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-400">Belum ada item</span>}
              </div>
            </div>
          ))}
        </div>

        {activeData && (
          <div className="rounded-2xl border border-primary/25 bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-black text-slate-900"><ReceiptText className="h-5 w-5 text-primary" /> Bayar {activeLabel}</div>
              <span className="text-xl font-black text-primary">{formatRupiah(activeData.total)}</span>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-xl border border-line">
                {activeData.chips.map((chip) => (
                  <div key={chip.id} className="flex justify-between gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0">
                    <span className="min-w-0 truncate text-slate-700">{chip.label}</span>
                    <span className="shrink-0 font-bold text-slate-900">{formatRupiah(chip.unitPrice)}</span>
                  </div>
                ))}
                <div className="space-y-1 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatRupiah(activeData.subtotal)}</span></div>
                  {activeData.ppn > 0 && <div className="flex justify-between text-slate-500"><span>PPN</span><span>{formatRupiah(activeData.ppn)}</span></div>}
                  {activeData.service > 0 && <div className="flex justify-between text-slate-500"><span>Service</span><span>{formatRupiah(activeData.service)}</span></div>}
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900"><span>Total</span><span>{formatRupiah(activeData.total)}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                {mtPhase === 'idle' && (
                  <SelectMenu label="Metode pembayaran" value={metode} onChange={(v) => { setMetode(v === MIDTRANS ? MIDTRANS : Number(v)); setBayar(0); }} options={methodOptions} placeholder="Pilih metode" />
                )}

                {isMidtrans ? (
                  <MidtransPanel phase={mtPhase} data={mtData} msg={mtMsg} checkingStatus={checkingStatus} onCreate={startMidtrans} onCheck={() => { const payload = dataForActive(); if (mtData && payload) checkMidtrans(mtData.transaction_id, payload, true); }} />
                ) : isQrisManual ? (
                  qrisAvailable ? (
                    <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center">
                      <p className="text-sm font-bold text-slate-800">{qris?.MERCHANT_NAME || 'QRIS Manual'}</p>
                      {qris?.NMID && <p className="text-xs text-slate-500">NMID: {qris.NMID}</p>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qris!.IMAGE_URL as string} alt="QRIS pembayaran" className="mx-auto mt-3 h-52 w-52 rounded-xl border object-contain" />
                      <p className="mt-2 text-xs text-slate-500">Konfirmasi setelah pembayaran diterima.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"><AlertTriangle className="mx-auto mb-2 h-7 w-7" /> QRIS belum diatur di Pengaturan Pembayaran.</div>
                  )
                ) : (
                  <>
                    <CurrencyInput label="Uang dibayar" value={bayar} onChange={setBayar} />
                    <button type="button" onClick={() => setBayar(activeData.total)} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-primary hover:bg-brand-50">Uang Pas</button>
                  </>
                )}

                {!isMidtrans && (
                  <>
                    <Input label={isTransfer ? 'Referensi transfer / keterangan' : 'Keterangan'} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="opsional" />
                    {!isQrisManual && <div className={cn('rounded-xl px-3 py-2 text-sm font-bold', kurang ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300')}>{kurang ? `Kurang ${formatRupiah(activeData.total - paidAmount)}` : `Kembalian ${formatRupiah(paidAmount - activeData.total)}`}</div>}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setActivePerson(null)} disabled={loading}>Batal</Button>
                      <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={confirmPayment} loading={loading} disabled={!metode || kurang || (isQrisManual && !qrisAvailable)}>
                        <CheckCircle2 className="h-4 w-4" /> Bayar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"><Users className="h-4 w-4 text-slate-400" /> Setelah satu orang dibayar, daftar akan dimuat ulang dengan sisa item dan jumlah orang tetap mengikuti pilihan awal.</div>
      </div>
    </Modal>
  );
}

function MidtransPanel({ phase, data, msg, checkingStatus, onCreate, onCheck }: {
  phase: 'idle' | 'creating' | 'waiting' | 'paid' | 'failed';
  data: MidtransQrisResult | null;
  msg: string;
  checkingStatus: boolean;
  onCreate: () => void;
  onCheck: () => void;
}) {
  if (phase === 'idle') {
    return <Button variant="gradient" className="h-11 w-full bg-primary hover:bg-brand-700" onClick={onCreate}><Zap className="h-4 w-4" /> Buat QRIS Payment Gateway</Button>;
  }
  if (phase === 'creating') {
    return <div className="rounded-2xl border border-line p-6 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-primary" /> Membuat QRIS...</div>;
  }
  if (phase === 'failed') {
    return <div className="space-y-3"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"><AlertTriangle className="mx-auto mb-2 h-7 w-7" /> {msg || 'Pembayaran belum selesai.'}</div><Button variant="outline" className="w-full" onClick={onCreate}>Buat Ulang QRIS</Button></div>;
  }
  if (phase === 'paid') {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="mx-auto mb-2 h-8 w-8" /> Pembayaran berhasil</div>;
  }
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center">
        {data?.qr_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.qr_url} alt="QRIS Payment Gateway" className="mx-auto h-56 w-56 rounded-xl border object-contain" />
        ) : (
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl border border-dashed text-xs text-slate-400">QR tidak tersedia</div>
        )}
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-500"><ScanLine className="h-4 w-4" /> Scan QRIS ini, lalu tunggu status otomatis.</p>
      </div>
      <Button variant="outline" className="w-full" onClick={onCheck} loading={checkingStatus}><RefreshCw className="h-4 w-4" /> Cek Status Pembayaran</Button>
    </div>
  );
}
