'use client';
import { useEffect, useMemo, useState } from 'react';
import { ScanLine, AlertTriangle, CheckCircle2, TicketPercent } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, SelectMenu, Input } from '@/components/ui';
import { formatRupiah } from '@/utils/format';
import { voucherService, getErrorMessage } from '@/services';
import type { JenisBayar, Qris, TaxSetting } from '@/types';

interface ConfirmData { id_jenis_bayar: number; bayar: number; keterangan?: string; kode_voucher?: string }

interface Props {
  open: boolean;
  onClose: () => void;
  total: number; // total setelah diskon item + diskon global (sebelum voucher & pajak)
  jenisBayar: JenisBayar[];
  qris?: Qris | null;
  tax?: TaxSetting | null;
  loading?: boolean;
  onConfirm: (data: ConfirmData) => void;
}

const QUICK = [0, 50000, 100000, 150000, 200000];

// Deteksi metode QRIS dari daftar jenis bayar (berdasarkan nama).
const isQrisName = (nama?: string) => !!nama && nama.toUpperCase().includes('QRIS');

export function PaymentModal({ open, onClose, total: baseTotal, jenisBayar, qris, tax, loading, onConfirm }: Props) {
  const [bayar, setBayar] = useState<number>(0);
  const [metode, setMetode] = useState<number>(jenisBayar[0]?.ID ?? 0);
  const [keterangan, setKeterangan] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<{ kode: string; diskon: number } | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  // Sinkronkan metode default saat daftar jenis bayar termuat / modal dibuka.
  useEffect(() => {
    if (open && !metode && jenisBayar[0]) setMetode(jenisBayar[0].ID);
  }, [open, jenisBayar, metode]);

  // Reset voucher saat modal ditutup.
  useEffect(() => { if (!open) { setVoucher(null); setVoucherInput(''); } }, [open]);

  // Hitung pajak & total akhir.
  const voucherDiskon = voucher?.diskon || 0;
  const dpp = Math.max(0, baseTotal - voucherDiskon);
  const ppn = tax?.PPN_ENABLED ? Math.round((dpp * Number(tax.PPN_PERSEN || 0)) / 100) : 0;
  const service = tax?.SERVICE_ENABLED ? Math.round((dpp * Number(tax.SERVICE_PERSEN || 0)) / 100) : 0;
  const total = dpp + ppn + service;

  const kembalian = useMemo(() => bayar - total, [bayar, total]);
  const kurang = bayar < total;

  const selected = jenisBayar.find((j) => j.ID === metode);
  const isQris = isQrisName(selected?.NAMA);
  const isTransfer = !!selected?.NAMA && selected.NAMA.toUpperCase().includes('TRANSFER');
  const qrisAvailable = !!(qris && qris.IS_ACTIVE && qris.IMAGE_URL);

  async function applyVoucher() {
    // Voucher tersedia untuk semua plan (FREE & PRO).
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
    onConfirm({ id_jenis_bayar: metode, bayar, keterangan, kode_voucher: voucher?.kode });
  }
  function confirmQris() {
    onConfirm({ id_jenis_bayar: metode, bayar: total, keterangan: keterangan || 'Pembayaran QRIS', kode_voucher: voucher?.kode });
  }

  const footer = isQris ? (
    <>
      <Button variant="outline" onClick={onClose} disabled={loading}>Batalkan</Button>
      <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={confirmQris} loading={loading} disabled={!qrisAvailable || !metode}>
        <CheckCircle2 className="h-4 w-4" /> Konfirmasi Sudah Dibayar
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
      <Button variant="gradient" className="bg-primary hover:bg-brand-700" onClick={confirmCash} loading={loading} disabled={kurang || !metode}>
        Simpan Transaksi
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Pembayaran" size="sm" footer={footer}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-ink via-primary to-accent p-5 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Total Bayar</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatRupiah(total)}</p>
        </div>

        {/* Voucher */}
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

        {/* Rincian */}
        <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Setelah diskon</span><span>{formatRupiah(baseTotal)}</span></div>
          {voucherDiskon > 0 && <div className="flex justify-between text-emerald-600"><span>Voucher {voucher?.kode}</span><span>- {formatRupiah(voucherDiskon)}</span></div>}
          {ppn > 0 && <div className="flex justify-between text-slate-500"><span>PPN {tax?.PPN_PERSEN}%</span><span>{formatRupiah(ppn)}</span></div>}
          {service > 0 && <div className="flex justify-between text-slate-500"><span>Service {tax?.SERVICE_PERSEN}%</span><span>{formatRupiah(service)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800"><span>Total</span><span>{formatRupiah(total)}</span></div>
        </div>

        <SelectMenu label="Metode pembayaran" value={metode} onChange={(v) => setMetode(Number(v))}
          options={jenisBayar.map((j) => ({ value: j.ID, label: j.NAMA }))} placeholder="Pilih metode" />

        {isQris ? (
          // ===== Mode QRIS =====
          qrisAvailable ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">{qris?.MERCHANT_NAME || 'Merchant QRIS'}</p>
                  {qris?.NMID && <p className="text-xs text-slate-500">NMID: {qris.NMID}</p>}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qris!.IMAGE_URL as string}
                  alt="QRIS pembayaran"
                  className="h-60 w-60 max-w-full rounded-xl border border-slate-100 object-contain"
                />
                <div className="flex items-center gap-2 text-center text-xs text-slate-500">
                  <ScanLine className="h-4 w-4 flex-shrink-0" />
                  <span>Scan QR ini dengan aplikasi e-wallet / mobile banking pelanggan.</span>
                </div>
              </div>
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-xs text-slate-600">
                Tekan <b>Konfirmasi Sudah Dibayar</b> setelah pembayaran pelanggan berhasil.
              </p>
            </div>
          ) : (
            // QRIS belum diatur / tidak aktif
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
              <AlertTriangle className="h-9 w-9 text-amber-500" />
              <p className="text-sm font-medium text-amber-800">QRIS belum tersedia</p>
              <p className="text-xs text-amber-700">
                Pembayaran QRIS belum diatur atau sedang nonaktif. Admin perlu mengaktifkannya di
                menu <b>Pengaturan &gt; Pembayaran</b>.
              </p>
            </div>
          )
        ) : (
          // ===== Mode tunai / lainnya =====
          <>
            <Input label="Uang dibayar" type="number" min={0} value={bayar || ''} onChange={(e) => setBayar(Number(e.target.value))} />

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

            <div className={`flex items-center justify-between rounded-xl p-4 ${kurang ? 'bg-rose-50' : 'bg-emerald-50'}`}>
              <span className="text-sm font-medium text-slate-600">Kembalian</span>
              <span className={`text-lg font-semibold ${kurang ? 'text-rose-600' : 'text-emerald-600'}`}>
                {kurang ? `Kurang ${formatRupiah(Math.abs(kembalian))}` : formatRupiah(kembalian)}
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
