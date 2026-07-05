'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScanLine, AlertTriangle, CheckCircle2, TicketPercent, Zap, Loader2, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, SelectMenu, Input, CurrencyInput, UpgradeModal } from '@/components/ui';
import { formatRupiah } from '@/utils/format';
import { voucherService, getErrorMessage } from '@/services';
import type { JenisBayar, Qris, TaxSetting, PlanType, MidtransQrisResult, PaymentStatusResult } from '@/types';

interface ConfirmData { id_jenis_bayar: number; bayar: number; keterangan?: string; kode_voucher?: string }

interface Props {
  open: boolean;
  onClose: () => void;
  total: number; // total setelah diskon item + diskon global (sebelum voucher & pajak)
  jenisBayar: JenisBayar[];
  qris?: Qris | null;
  tax?: TaxSetting | null;
  loading?: boolean;
  plan?: PlanType;
  onConfirm: (data: ConfirmData) => void;
  // ===== Midtrans QRIS dinamis (khusus BUSINESS) =====
  onCreateMidtrans?: (opts: { keterangan?: string; kode_voucher?: string }) => Promise<MidtransQrisResult>;
  onPollMidtrans?: (transactionId: number) => Promise<PaymentStatusResult>;
  onMidtransSuccess?: (transactionId: number) => void;
}

const QUICK = [0, 50000, 100000, 150000, 200000];
const MIDTRANS = 'MIDTRANS' as const;

// Deteksi metode QRIS statis dari daftar jenis bayar (berdasarkan nama).
export const isQrisName = (nama?: string) => !!nama && nama.toUpperCase().includes('QRIS');

export function PaymentModal({
  open, onClose, total: baseTotal, jenisBayar, qris, tax, loading, plan,
  onConfirm, onCreateMidtrans, onPollMidtrans, onMidtransSuccess,
}: Props) {
  const [bayar, setBayar] = useState<number>(0);
  const [metode, setMetode] = useState<number | typeof MIDTRANS>(jenisBayar[0]?.ID ?? 0);
  const [keterangan, setKeterangan] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<{ kode: string; diskon: number } | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // ===== State Midtrans =====
  const [mtPhase, setMtPhase] = useState<'idle' | 'creating' | 'waiting' | 'paid' | 'failed'>('idle');
  const [mtData, setMtData] = useState<MidtransQrisResult | null>(null);
  const [mtMsg, setMtMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBusiness = plan === 'BUSINESS';
  const isPro = plan === 'PRO' || plan === 'BUSINESS';

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // Sinkronkan metode default saat daftar jenis bayar termuat / modal dibuka.
  useEffect(() => {
    if (open && !metode && jenisBayar[0]) setMetode(jenisBayar[0].ID);
  }, [open, jenisBayar, metode]);

  // Reset semua saat modal ditutup.
  useEffect(() => {
    if (!open) {
      setVoucher(null); setVoucherInput('');
      setMtPhase('idle'); setMtData(null); setMtMsg('');
      setCheckingStatus(false); setUpgradeOpen(false);
      stopPolling();
    }
    return stopPolling;
  }, [open]);

  // Hitung pajak & total akhir.
  const voucherDiskon = voucher?.diskon || 0;
  const dpp = Math.max(0, baseTotal - voucherDiskon);
  const ppn = isPro && tax?.PPN_ENABLED ? Math.round((dpp * Number(tax.PPN_PERSEN || 0)) / 100) : 0;
  const service = isPro && tax?.SERVICE_ENABLED ? Math.round((dpp * Number(tax.SERVICE_PERSEN || 0)) / 100) : 0;
  const total = dpp + ppn + service;

  const kembalian = useMemo(() => bayar - total, [bayar, total]);
  const kurang = bayar < total;

  const selected = typeof metode === 'number' ? jenisBayar.find((j) => j.ID === metode) : undefined;
  const isQris = isQrisName(selected?.NAMA);
  const isTransfer = !!selected?.NAMA && selected.NAMA.toUpperCase().includes('TRANSFER');
  const isMidtrans = metode === MIDTRANS;
  const qrisAvailable = !!(qris && qris.IS_ACTIVE && qris.IMAGE_URL);

  async function applyVoucher() {
    if (!isPro) { setUpgradeOpen(true); return; }
    const kode = voucherInput.trim();
    if (!kode) return;
    setCheckingVoucher(true);
    try {
      const res = await voucherService.validate(kode, baseTotal);
      setVoucher({ kode: res.kode, diskon: res.diskon });
      toast.success(`Voucher ${res.kode} diterapkan`);
    } catch (err) { setVoucher(null); toast.error(getErrorMessage(err)); }
    finally { setCheckingVoucher(false); }
  }

  function confirmCash() {
    onConfirm({ id_jenis_bayar: metode as number, bayar, keterangan, kode_voucher: voucher?.kode });
  }
  function confirmQris() {
    onConfirm({ id_jenis_bayar: metode as number, bayar: total, keterangan: keterangan || 'Pembayaran QRIS Manual', kode_voucher: voucher?.kode });
  }

  // ===== Flow Midtrans QRIS dinamis =====
  async function checkMidtransStatus(transactionId: number, showFeedback = false) {
    if (!onPollMidtrans) return;
    if (showFeedback) setCheckingStatus(true);
    try {
      const st = await onPollMidtrans(transactionId);
      if (st.payment_status === 'PAID') {
        stopPolling(); setMtPhase('paid');
        toast.success('Pembayaran berhasil diterima');
        onMidtransSuccess?.(transactionId);
      } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(st.payment_status)) {
        stopPolling(); setMtPhase('failed');
        setMtMsg(`Pembayaran ${st.payment_status.toLowerCase()}. Silakan buat ulang QRIS.`);
      } else if (showFeedback) {
        toast('Pembayaran masih menunggu konfirmasi');
      }
    } catch (err) {
      if (showFeedback) toast.error(getErrorMessage(err));
    } finally {
      if (showFeedback) setCheckingStatus(false);
    }
  }

  async function startMidtrans() {
    if (!onCreateMidtrans) return;
    setMtPhase('creating'); setMtMsg('');
    try {
      const res = await onCreateMidtrans({ keterangan: keterangan || 'Pembayaran QRIS Midtrans', kode_voucher: voucher?.kode });
      setMtData(res);
      setMtPhase('waiting');
      // Mulai polling status tiap 3 detik.
      stopPolling();
      pollRef.current = setInterval(async () => {
        await checkMidtransStatus(res.transaction_id);
      }, 3000);
    } catch (err) {
      setMtPhase('failed'); setMtMsg(getErrorMessage(err));
    }
  }

  const methodOptions = [
    ...jenisBayar.map((j) => ({
      value: j.ID as number | string,
      label: isQrisName(j.NAMA) ? 'QRIS Manual' : j.NAMA,
    })),
    ...(isBusiness && onCreateMidtrans ? [{ value: MIDTRANS, label: 'QRIS Payment Gateway' }] : []),
  ];

  let footer: React.ReactNode;
  if (isMidtrans) {
    footer = (
      <>
        <Button variant="outline" onClick={onClose} disabled={mtPhase === 'creating'}>
          {mtPhase === 'paid' ? 'Tutup' : 'Batalkan'}
        </Button>
        {mtPhase === 'idle' && (
          <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={startMidtrans}>
            <Zap className="h-4 w-4" /> Buat QRIS
          </Button>
        )}
        {mtPhase === 'failed' && (
          <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={startMidtrans}>
            <Zap className="h-4 w-4" /> Buat Ulang QRIS
          </Button>
        )}
      </>
    );
  } else if (isQris) {
    footer = (
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>Batalkan</Button>
        <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={confirmQris} loading={loading} disabled={!qrisAvailable || !metode}>
          <CheckCircle2 className="h-4 w-4" /> Konfirmasi Sudah Dibayar
        </Button>
      </>
    );
  } else {
    footer = (
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={confirmCash} loading={loading} disabled={kurang || !metode}>
          Simpan Transaksi
        </Button>
      </>
    );
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title="Pembayaran" size="sm" footer={footer}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-ink via-primary to-accent p-5 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Total Bayar</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatRupiah(total)}</p>
        </div>

        {/* Voucher (sembunyikan setelah QRIS Midtrans dibuat) */}
        {isPro && !(isMidtrans && mtPhase !== 'idle') && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Kode voucher</label>
              <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white pl-3">
                <TicketPercent className="h-4 w-4 text-slate-400" />
                <input
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="mis. DISKON10"
                  className="h-full w-full bg-transparent px-2 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
            {voucher ? (
              <Button variant="outline" className="h-10" onClick={() => { setVoucher(null); setVoucherInput(''); }}>Hapus</Button>
            ) : (
              <Button variant="outline" className="h-10" onClick={applyVoucher} loading={checkingVoucher}>Pakai</Button>
            )}
          </div>
        )}
        {!isPro && !(isMidtrans && mtPhase !== 'idle') && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2.5 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><TicketPercent className="h-4 w-4 text-primary" /> Voucher / Promo</span>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-primary">PRO</span>
          </button>
        )}

        {/* Rincian */}
        <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Setelah diskon</span><span>{formatRupiah(baseTotal)}</span></div>
          {voucherDiskon > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-300"><span>Voucher {voucher?.kode}</span><span>- {formatRupiah(voucherDiskon)}</span></div>}
          {ppn > 0 && <div className="flex justify-between text-slate-500"><span>PPN {tax?.PPN_PERSEN}%</span><span>{formatRupiah(ppn)}</span></div>}
          {service > 0 && <div className="flex justify-between text-slate-500"><span>Service {tax?.SERVICE_PERSEN}%</span><span>{formatRupiah(service)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800"><span>Total</span><span>{formatRupiah(total)}</span></div>
        </div>

        {!(isMidtrans && mtPhase !== 'idle') && (
          <SelectMenu label="Metode pembayaran" value={metode} onChange={(v) => setMetode(v === MIDTRANS ? MIDTRANS : Number(v))}
            options={methodOptions} placeholder="Pilih metode" />
        )}

        {isMidtrans ? (
          // ===== Mode QRIS Midtrans dinamis (BUSINESS) =====
          <MidtransPanel
            phase={mtPhase}
            data={mtData}
            msg={mtMsg}
            total={total}
            checkingStatus={checkingStatus}
            onCheckStatus={() => mtData && checkMidtransStatus(mtData.transaction_id, true)}
          />
        ) : isQris ? (
          // ===== Mode QRIS statis merchant =====
          qrisAvailable ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-center">
                  <span className="mb-1 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">QRIS Manual</span>
                  <p className="text-sm font-semibold text-slate-800">{qris?.MERCHANT_NAME || 'Merchant QRIS'}</p>
                  {qris?.NMID && <p className="text-xs text-slate-500">NMID: {qris.NMID}</p>}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qris!.IMAGE_URL as string}
                  alt="QRIS pembayaran"
                  loading="lazy"
                  decoding="async"
                  className="h-60 w-60 max-w-full rounded-xl border border-slate-100 object-contain"
                />
                <div className="flex items-center gap-2 text-center text-xs text-slate-500">
                  <ScanLine className="h-4 w-4 flex-shrink-0" />
                  <span>Scan QRIS statis merchant dengan aplikasi pembayaran atau mobile banking.</span>
                </div>
              </div>
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-xs text-slate-600">
                Kasir perlu memeriksa mutasi/notifikasi merchant, lalu tekan <b>Konfirmasi Sudah Dibayar</b>.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
              <AlertTriangle className="h-9 w-9 text-amber-500" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">QRIS belum tersedia</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Pembayaran QRIS belum diatur atau sedang nonaktif. Admin perlu mengaktifkannya di
                menu <b>Pengaturan &gt; Pembayaran</b>.
              </p>
            </div>
          )
        ) : (
          // ===== Mode tunai / lainnya =====
          <>
            <CurrencyInput label="Uang dibayar" value={bayar} onChange={setBayar} />

            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => setBayar(q === 0 ? total : q)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary hover:bg-brand-50 hover:text-primary">
                  {q === 0 ? 'Uang pas' : formatRupiah(q)}
                </button>
              ))}
            </div>

            <Input
              label={isTransfer ? 'Referensi transfer (opsional)' : 'Keterangan (opsional)'}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={isTransfer ? 'mis. no. ref / nama pengirim' : ''}
            />

            <div className={`flex items-center justify-between rounded-xl p-4 ${kurang ? 'bg-rose-50 dark:bg-rose-500/15' : 'bg-emerald-50 dark:bg-emerald-500/15'}`}>
              <span className="text-sm font-medium text-slate-600">Kembalian</span>
              <span className={`text-lg font-semibold ${kurang ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                {kurang ? `Kurang ${formatRupiah(Math.abs(kembalian))}` : formatRupiah(kembalian)}
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
    <UpgradeModal
      open={upgradeOpen}
      onClose={() => setUpgradeOpen(false)}
      title="Voucher & Promo tersedia di PRO"
      description="Fitur Voucher, Pajak, dan Service Charge tersedia untuk paket PRO. Hubungi admin toko untuk melakukan upgrade."
      benefits={['Voucher dan promo pelanggan', 'Pajak dan service charge', 'Struk tanpa branding Zona Kasir']}
      showUpgradeButton={false}
    />
    </>
  );
}

// Panel khusus QRIS dinamis Midtrans (idle/creating/waiting/paid/failed).
function MidtransPanel({ phase, data, msg, total, checkingStatus, onCheckStatus }: {
  phase: 'idle' | 'creating' | 'waiting' | 'paid' | 'failed';
  data: MidtransQrisResult | null;
  msg: string;
  total: number;
  checkingStatus: boolean;
  onCheckStatus: () => void;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!data?.expiry_time || phase !== 'waiting') { setRemainingSeconds(null); return undefined; }
    const raw = data.expiry_time.trim();
    const expiresAt = Date.parse(raw.includes('T') ? raw : raw.replace(' ', 'T'));
    if (Number.isNaN(expiresAt)) return undefined;
    const tick = () => setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [data?.expiry_time, phase]);

  const timerLabel = remainingSeconds == null
    ? null
    : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white"><Zap className="h-6 w-6" /></span>
        <p className="text-sm font-semibold text-slate-800">QRIS Payment Gateway</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">QRIS Dinamis · BUSINESS</span>
        <p className="text-xs text-slate-600">
          Tekan <b>Buat QRIS</b> untuk menghasilkan kode QR sesuai nominal {formatRupiah(total)}.
          Status pembayaran akan diperbarui otomatis.
        </p>
      </div>
    );
  }
  if (phase === 'creating') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-600">Membuat QRIS Midtrans...</p>
      </div>
    );
  }
  if (phase === 'paid') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">Pembayaran Berhasil</p>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">Transaksi otomatis ditandai LUNAS.</p>
      </div>
    );
  }
  if (phase === 'failed') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Pembayaran belum selesai</p>
        <p className="text-xs text-rose-700 dark:text-rose-300">{msg || 'Terjadi kendala. Silakan buat ulang QRIS.'}</p>
      </div>
    );
  }
  // waiting
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">QRIS Dinamis</p>
            <p className="text-lg font-bold text-slate-900">{formatRupiah(data?.gross_amount || total)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <Loader2 className="h-3 w-3 animate-spin" /> Menunggu Pembayaran
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        {data?.qr_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.qr_url} alt="QRIS dinamis untuk pembayaran" loading="lazy" decoding="async" className="h-60 w-60 max-w-full rounded-xl border border-slate-100 object-contain" />
        ) : (
          <div className="flex h-60 w-60 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            QR tidak tersedia
          </div>
        )}
        <div className="flex items-start gap-2 text-center text-xs leading-5 text-slate-600">
          <ScanLine className="h-4 w-4 flex-shrink-0" />
          <span>Scan QRIS ini menggunakan aplikasi pembayaran favorit Anda seperti GoPay, OVO, DANA, ShopeePay, LinkAja, atau mobile banking.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5" aria-label="Aplikasi pembayaran yang mendukung QRIS">
          {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Mobile Banking'].map((name) => (
            <span key={name} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">{name}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Status otomatis
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-slate-600">
          <Clock3 className="h-4 w-4 text-primary" /> {timerLabel ? `Berlaku ${timerLabel}` : 'Masa berlaku gateway'}
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={onCheckStatus} loading={checkingStatus}>
        <RefreshCw className="h-4 w-4" /> Cek Status Pembayaran
      </Button>
    </div>
  );
}
