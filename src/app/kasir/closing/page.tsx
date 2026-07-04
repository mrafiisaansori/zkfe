'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, LockOpen, Lock, ArrowDownCircle, ArrowUpCircle, Banknote,
  CreditCard, Coins, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Modal, Input, CurrencyInput, Badge } from '@/components/ui';
import { kasShiftService, getErrorMessage } from '@/services';
import { formatRupiah } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';
import type { KasShift, ShiftClosePreview } from '@/types';

function fmtTime(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Kotak ringkasan angka besar & jelas.
function MoneyBox({ label, value, icon: Icon, tone = 'brand' }: {
  label: string; value: number; icon: React.ElementType; tone?: 'brand' | 'green' | 'amber';
}) {
  const tones = {
    brand: 'bg-brand-50 text-primary dark:bg-accent/15 dark:text-accent',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  } as const;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{formatRupiah(value)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ClosingPage() {
  const [shift, setShift] = useState<KasShift | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  // Modal buka kasir
  const [openModal, setOpenModal] = useState(false);
  const [modalAwal, setModalAwal] = useState(0);
  const [stationInput, setStationInput] = useState('');

  // Modal kas masuk/keluar
  const [mutasiModal, setMutasiModal] = useState(false);
  const [mutasiTipe, setMutasiTipe] = useState<'IN' | 'OUT'>('OUT');
  const [mutasiNominal, setMutasiNominal] = useState(0);
  const [mutasiKet, setMutasiKet] = useState('');

  // Modal tutup kasir
  const [closeModal, setCloseModal] = useState(false);
  const [preview, setPreview] = useState<ShiftClosePreview | null>(null);
  const [actualCash, setActualCash] = useState(0);
  const [closeNote, setCloseNote] = useState('');

  // Hasil closing (ringkasan setelah tutup)
  const [result, setResult] = useState<KasShift | null>(null);

  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setShift(await kasShiftService.active()); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pv = shift?.preview;

  async function handleOpen() {
    setBusy(true);
    try {
      await kasShiftService.open({
        modal_awal: modalAwal,
        station: stationInput.trim() || undefined,
      });
      toast.success('Kasir berhasil dibuka');
      setOpenModal(false); setModalAwal(0); setStationInput('');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleMutasi() {
    if (!shift) return;
    if (mutasiNominal <= 0) { toast.error('Nominal harus lebih dari 0'); return; }
    setBusy(true);
    try {
      await kasShiftService.mutasi(shift.ID, {
        tipe: mutasiTipe, nominal: mutasiNominal, keterangan: mutasiKet.trim() || undefined,
      });
      toast.success(mutasiTipe === 'OUT' ? 'Kas keluar dicatat' : 'Kas masuk dicatat');
      setMutasiModal(false); setMutasiNominal(0); setMutasiKet('');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function openCloseModal() {
    if (!shift) return;
    setBusy(true);
    try {
      const p = await kasShiftService.closePreview(shift.ID);
      setPreview(p); setActualCash(0); setCloseNote(''); setCloseModal(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleClose() {
    if (!shift) return;
    setBusy(true);
    try {
      const closed = await kasShiftService.close(shift.ID, {
        actual_cash: actualCash,
        catatan: closeNote.trim() || undefined,
      });
      setCloseModal(false); setShift(null); setResult(closed);
      toast.success('Kasir berhasil ditutup');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  // Selisih live di modal tutup.
  const expectedCash = preview?.expected_cash ?? 0;
  const selisihLive = actualCash - expectedCash;

  const closedSelisih = result?.SELISIH_CASH ?? 0;

  return (
    <div>
      <PageHeader
        title="Buka/Tutup Kasir"
        description="Buka sesi kasir saat mulai jualan, lalu tutup & cocokkan uang saat selesai."
      />

      {!loading && !shift && !result && <BukaKasirCard onClick={() => setOpenModal(true)} />}

      {/* ===== Hasil closing terakhir ===== */}
      {result && (
        <ResultCard result={result} selisih={closedSelisih} onNew={() => { setResult(null); setOpenModal(true); }} />
      )}

      {/* ===== Kasir sedang buka ===== */}
      {shift && (
        <div className="space-y-5">
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <LockOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-ink">Kasir Sedang Buka</h3>
                      <Badge tone="green" dot>OPEN</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Dibuka {fmtTime(shift.BUKA_AT)}
                      {shift.STATION ? ` · ${shift.STATION}` : ''}
                      {shift.kasir?.NAMA ? ` · ${shift.kasir.NAMA}` : ''}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-brand-50 px-4 py-2 text-center">
                  <p className="text-xs font-medium text-slate-500">Modal Awal</p>
                  <p className="text-lg font-bold text-primary">{formatRupiah(shift.MODAL_AWAL)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MoneyBox label="Penjualan Tunai" value={pv?.cash_sales ?? 0} icon={Banknote} tone="green" />
            <MoneyBox label="Penjualan Non-Tunai" value={pv?.non_cash_sales ?? 0} icon={CreditCard} tone="brand" />
            <MoneyBox label="Kas Keluar / Masuk" value={(pv?.mutasi_out ?? 0) - (pv?.mutasi_in ?? 0)} icon={Coins} tone="amber" />
            <MoneyBox label="Uang Tunai Seharusnya" value={pv?.expected_cash ?? 0} icon={Wallet} tone="brand" />
          </div>

          <Card>
            <CardBody>
              <p className="mb-1 text-sm font-semibold text-ink">Rincian per metode bayar</p>
              <p className="mb-3 text-xs text-slate-500">{pv?.jumlah_transaksi ?? 0} transaksi pada sesi ini.</p>
              {pv && pv.methods.length > 0 ? (
                <div className="divide-y divide-line">
                  {pv.methods.map((m) => (
                    <div key={m.id_jenis_bayar} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        {m.is_cash ? <Banknote className="h-4 w-4 text-emerald-500" /> : <CreditCard className="h-4 w-4 text-slate-400" />}
                        {m.nama}
                      </span>
                      <span className="font-semibold text-ink">{formatRupiah(m.expected)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-slate-400">Belum ada transaksi.</p>
              )}
            </CardBody>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => { setMutasiTipe('OUT'); setMutasiModal(true); }}>
              <Coins className="mr-2 h-5 w-5" /> Catat Kas Keluar / Masuk
            </Button>
            <Button variant="primary" size="lg" className="flex-1" loading={busy} onClick={openCloseModal}>
              <Lock className="mr-2 h-5 w-5" /> Tutup Kasir
            </Button>
          </div>
        </div>
      )}

      {/* ===== Modal: Buka Kasir ===== */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Buka Kasir"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setOpenModal(false)}>Batal</Button>
            <Button loading={busy} onClick={handleOpen}>Buka Kasir</Button>
          </>
        )}
      >
        <p className="mb-4 text-sm text-slate-500">
          Masukkan jumlah uang tunai yang ada di laci saat ini (modal awal / uang kembalian).
        </p>
        <CurrencyInput
          label="Modal Awal (uang di laci)"
          placeholder="0"
          value={modalAwal}
          onChange={setModalAwal}
          autoFocus
        />
        {modalAwal > 0 && <p className="mt-1.5 text-sm font-semibold text-primary">{formatRupiah(modalAwal)}</p>}
        <div className="mt-4">
          <Input
            label="Nama Laci / Terminal (opsional)"
            placeholder="cth: Kasir 1"
            value={stationInput}
            onChange={(e) => setStationInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* ===== Modal: Kas Masuk/Keluar ===== */}
      <Modal
        open={mutasiModal}
        onClose={() => setMutasiModal(false)}
        title="Catat Kas Keluar / Masuk"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setMutasiModal(false)}>Batal</Button>
            <Button loading={busy} onClick={handleMutasi}>Simpan</Button>
          </>
        )}
      >
        <p className="mb-3 text-sm text-slate-500">
          Catat uang yang keluar/masuk laci di luar penjualan (cth: ambil uang beli galon, tambah modal).
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMutasiTipe('OUT')}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${mutasiTipe === 'OUT' ? 'border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300' : 'border-line bg-white text-slate-500'}`}
          >
            <ArrowUpCircle className="h-5 w-5" /> Kas Keluar
          </button>
          <button
            type="button"
            onClick={() => setMutasiTipe('IN')}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${mutasiTipe === 'IN' ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300' : 'border-line bg-white text-slate-500'}`}
          >
            <ArrowDownCircle className="h-5 w-5" /> Kas Masuk
          </button>
        </div>
        <CurrencyInput
          label="Nominal"
          placeholder="0"
          value={mutasiNominal}
          onChange={setMutasiNominal}
        />
        {mutasiNominal > 0 && <p className="mt-1.5 text-sm font-semibold text-primary">{formatRupiah(mutasiNominal)}</p>}
        <div className="mt-4">
          <Input
            label="Keterangan (opsional)"
            placeholder="cth: Beli galon air"
            value={mutasiKet}
            onChange={(e) => setMutasiKet(e.target.value)}
          />
        </div>
      </Modal>

      {/* ===== Modal: Tutup Kasir ===== */}
      <Modal
        open={closeModal}
        onClose={() => setCloseModal(false)}
        title="Tutup Kasir"
        size="lg"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCloseModal(false)}>Batal</Button>
            <Button variant="primary" loading={busy} onClick={handleClose}>Tutup & Simpan</Button>
          </>
        )}
      >
        {preview && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Modal awal</span>
                <span className="font-medium text-ink">{formatRupiah(preview.modal_awal)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-600">Penjualan tunai</span>
                <span className="font-medium text-ink">+ {formatRupiah(preview.cash_sales)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-600">Kas masuk</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-300">+ {formatRupiah(preview.mutasi_in)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-600">Kas keluar</span>
                <span className="font-medium text-rose-600 dark:text-rose-300">- {formatRupiah(preview.mutasi_out)}</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-brand-200 pt-2.5">
                <span className="font-semibold text-ink">Uang tunai seharusnya</span>
                <span className="text-lg font-bold text-primary">{formatRupiah(expectedCash)}</span>
              </div>
            </div>

            <div>
              <CurrencyInput
                label="Uang tunai hasil hitung di laci"
                placeholder="Hitung & masukkan jumlah uang fisik"
                value={actualCash}
                onChange={setActualCash}
                autoFocus
              />
              {actualCash > 0 && (
                <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 ${selisihLive === 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : selisihLive < 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {selisihLive === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {selisihLive === 0 ? 'Cocok / pas' : selisihLive < 0 ? 'Kurang' : 'Lebih'}
                  </span>
                  <span className="text-lg font-bold">{formatRupiah(Math.abs(selisihLive))}</span>
                </div>
              )}
            </div>

            {preview.non_cash_sales > 0 && (
              <p className="text-xs text-slate-400">
                Penjualan non-tunai ({formatRupiah(preview.non_cash_sales)}) tidak dihitung di sini karena tidak ada uang fisik di laci.
              </p>
            )}

            <Input
              label="Catatan (opsional)"
              placeholder="cth: Selisih karena kembalian"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ===== Sub-komponen: kartu ajakan buka kasir =====
function BukaKasirCard({ onClick }: { onClick: () => void }) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <Wallet className="h-8 w-8" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-ink">Kasir belum dibuka</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Buka kasir dulu sebelum mulai jualan. Semua transaksimu akan tercatat di sesi ini untuk dicocokkan saat tutup.
            </p>
          </div>
          <Button size="lg" onClick={onClick}>
            <LockOpen className="mr-2 h-5 w-5" /> Buka Kasir
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ===== Sub-komponen: ringkasan hasil closing =====
function ResultCard({ result, selisih, onNew }: { result: KasShift; selisih: number; onNew: () => void }) {
  const pas = selisih === 0;
  const kurang = selisih < 0;
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${pas ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'}`}>
            {pas ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
          </span>
          <h3 className="text-lg font-bold text-ink">Kasir Ditutup</h3>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-xs text-slate-500">Seharusnya</p>
              <p className="font-bold text-ink">{formatRupiah(result.EXPECTED_CASH)}</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-xs text-slate-500">Dihitung</p>
              <p className="font-bold text-ink">{formatRupiah(result.ACTUAL_CASH)}</p>
            </div>
            <div className={`rounded-xl p-3 ${pas ? 'bg-emerald-50 dark:bg-emerald-500/15' : kurang ? 'bg-rose-50 dark:bg-rose-500/15' : 'bg-amber-50 dark:bg-amber-500/15'}`}>
              <p className="text-xs text-slate-500">{pas ? 'Selisih' : kurang ? 'Kurang' : 'Lebih'}</p>
              <p className={`font-bold ${pas ? 'text-emerald-700 dark:text-emerald-300' : kurang ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>{formatRupiah(Math.abs(selisih))}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-2" onClick={onNew}>
            <LockOpen className="mr-2 h-4 w-4" /> Buka Kasir Lagi
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
