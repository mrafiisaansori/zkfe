'use client';
import { ChevronDown, ChevronRight, ClipboardList, Minus, Plus, Save, Split, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, ProductImage } from '@/components/ui';
import { useCartStore } from '@/stores/cartStore';
import { formatRupiah } from '@/utils/format';
import { cn } from '@/utils/cn';

interface CartProps {
  onCheckout: () => void;
  onSaveBill?: () => void;     // Simpan sebagai open bill (mode transaksi baru)
  onUpdateBill?: () => void;   // Simpan perubahan (mode edit bill)
  onCancelBill?: () => void;   // Batalkan open bill (mode edit bill)
  onSplitBill?: () => void;    // Bayar sebagian item bill
  isPro?: boolean;             // fitur Member khusus plan PRO
  onPickMember?: () => void;
}

const stepBtn = 'flex h-9 w-9 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:opacity-40';
const secondaryBtn = 'h-10 flex-1 rounded-lg text-sm font-semibold';

export function Cart({ onCheckout, onSaveBill, onUpdateBill, onCancelBill, onSplitBill, isPro, onPickMember }: CartProps) {
  const { items, updateQty, removeItem, subtotal, total, diskon, setDiskon, clear, bill, member, count } = useCartStore();
  const billMode = !!bill;
  const empty = items.length === 0;

  // updateQty sudah memvalidasi stok; di sini hanya menampilkan alasannya bila ditolak.
  function changeQty(lineId: string, qty: number) {
    const res = updateQty(lineId, qty);
    if (!res.ok && res.message) toast.error(res.message, { id: `qty-${lineId}` });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">{billMode ? 'Edit Bill' : 'Keranjang'}</h3>
          <p className="truncate text-xs text-slate-500">
            {billMode && bill?.no_bill ? `${bill.no_bill} · ` : ''}{count()} item
          </p>
        </div>
        {!empty && (
          <button
            type="button"
            onClick={clear}
            className="rounded-md px-2 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:text-rose-300 dark:hover:bg-rose-500/15"
          >
            Kosongkan
          </button>
        )}
      </div>

      {isPro && onPickMember && (
        <button
          type="button"
          onClick={onPickMember}
          className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-2.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <User className={cn('h-4 w-4 shrink-0', member ? 'text-primary' : 'text-slate-400')} />
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate text-sm', member ? 'font-semibold text-slate-800' : 'text-slate-600')}>
              {member ? member.nama : 'Tanpa member'}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-primary">{member ? 'Ganti member' : 'Pilih member/customer'}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      )}

      {/* Daftar item */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Keranjang masih kosong</p>
            <p className="mt-1 text-sm text-slate-500">Pilih produk dari grid untuk mulai transaksi.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((it) => {
              const unit = it.harga + (Number(it.modifierExtra) || 0);
              return (
                <li key={it.lineId} className="px-4 py-3">
                  <div className="flex gap-3">
                    <ProductImage src={it.image} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-contain p-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-5 text-slate-900">{it.nama}</p>
                          {it.modifierText && <p className="truncate text-xs text-primary">{it.modifierText}</p>}
                          <p className="text-xs tabular-nums text-slate-500">{formatRupiah(unit)}{it.satuan ? ` / ${it.satuan}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(it.lineId)}
                          aria-label={`Hapus ${it.nama}`}
                          title="Hapus item"
                          className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <button type="button" onClick={() => changeQty(it.lineId, it.qty - 1)} aria-label="Kurangi" className={stepBtn}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            value={it.qty}
                            min={1}
                            aria-label={`Jumlah ${it.nama}`}
                            onChange={(e) => changeQty(it.lineId, Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="h-9 w-10 border-x border-slate-200 bg-transparent text-center text-sm font-semibold tabular-nums text-slate-900 outline-none focus:bg-brand-50"
                          />
                          <button type="button" onClick={() => changeQty(it.lineId, it.qty + 1)} aria-label="Tambah" className={stepBtn}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">{formatRupiah(unit * it.qty)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Ringkasan & aksi */}
      <div className="shrink-0 border-t border-line bg-white px-4 pb-4 pt-3">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium tabular-nums text-slate-900">{formatRupiah(subtotal())}</span>
          </div>
        </div>

        {/* Diskon: ringkas saat tidak dipakai, terbuka otomatis bila ada potongan. */}
        <details className="group mt-1 border-b border-slate-100 pb-2" open={diskon > 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1 text-slate-600">
              Diskon
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180" />
            </span>
            {diskon > 0 ? (
              <span className="flex items-center gap-2">
                <span className="font-medium tabular-nums text-rose-600 dark:text-rose-300">- {formatRupiah(diskon)}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setDiskon(0); }}
                  className="rounded px-1.5 py-0.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
                >
                  Hapus
                </button>
              </span>
            ) : (
              <span className="text-xs font-medium text-primary">Tambah</span>
            )}
          </summary>
          <div className="mt-1.5 flex gap-1.5">
            <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-white pl-2.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/25">
              <span className="text-xs font-semibold text-slate-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                aria-label="Nominal diskon"
                value={diskon ? diskon.toLocaleString('id-ID') : ''}
                placeholder="0"
                onChange={(e) => setDiskon(Number(e.target.value.replace(/\D/g, '')) || 0)}
                className="h-full w-full min-w-0 bg-transparent px-2 text-right text-sm font-semibold tabular-nums text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            {[5, 10, 15, 20].map((p) => {
              const aktif = subtotal() > 0 && diskon === Math.round((subtotal() * p) / 100);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDiskon(Math.round((subtotal() * p) / 100))}
                  className={cn(
                    'h-9 w-11 shrink-0 rounded-lg border text-xs font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    aktif ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary',
                  )}
                >
                  {p}%
                </button>
              );
            })}
          </div>
        </details>

        <div className="flex items-baseline justify-between pb-3 pt-2.5">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-2xl font-bold tabular-nums tracking-tight text-ink">{formatRupiah(total())}</span>
        </div>

        <Button
          className="h-12 w-full rounded-lg text-base font-semibold"
          size="lg"
          disabled={empty}
          onClick={onCheckout}
        >
          {billMode ? 'Bayar' : 'Bayar Semua'}
        </Button>

        {billMode ? (
          <>
            <div className="mt-2 flex gap-2">
              {onSplitBill && (
                <Button variant="outline" className={secondaryBtn} disabled={empty} onClick={onSplitBill}>
                  <Split className="h-4 w-4" /> Split Bill
                </Button>
              )}
              <Button variant="outline" className={secondaryBtn} disabled={empty} onClick={onUpdateBill}>
                <Save className="h-4 w-4" /> Simpan
              </Button>
            </div>
            <button
              type="button"
              onClick={onCancelBill}
              className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:text-rose-300 dark:hover:bg-rose-500/15"
            >
              <Trash2 className="h-4 w-4" /> Batalkan Bill
            </button>
          </>
        ) : (onSplitBill || onSaveBill) && (
          <div className="mt-2 flex gap-2">
            {onSplitBill && (
              <Button variant="outline" className={secondaryBtn} disabled={empty} onClick={onSplitBill}>
                <Split className="h-4 w-4" /> Split Bill
              </Button>
            )}
            {onSaveBill && (
              <Button variant="outline" className={secondaryBtn} disabled={empty} onClick={onSaveBill}>
                <ClipboardList className="h-4 w-4" /> Simpan Bill
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
