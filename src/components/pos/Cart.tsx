'use client';
import { Minus, Percent, Plus, ShoppingCart, Trash2, Save, ClipboardList } from 'lucide-react';
import { Button, EmptyState, ProductImage } from '@/components/ui';
import { useCartStore } from '@/stores/cartStore';
import { formatRupiah } from '@/utils/format';

interface CartProps {
  onCheckout: () => void;
  onSaveBill?: () => void;     // Simpan sebagai open bill (mode transaksi baru)
  onUpdateBill?: () => void;   // Simpan perubahan (mode edit bill)
  onCancelBill?: () => void;   // Batalkan open bill (mode edit bill)
  onSplitBill?: () => void;    // Bayar sebagian item bill
}

export function Cart({ onCheckout, onSaveBill, onUpdateBill, onCancelBill, onSplitBill }: CartProps) {
  const { items, updateQty, removeItem, subtotal, total, diskon, setDiskon, clear, bill } = useCartStore();
  const billMode = !!bill;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-none bg-white xl:rounded-[26px]">
      <div className="flex shrink-0 items-center justify-between border-b border-brand-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{billMode ? 'Edit Bill' : 'Keranjang'}</h3>
            <p className="text-xs text-slate-500">
              {billMode && bill?.no_bill ? bill.no_bill : `${items.length} item dipilih`}
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/15">
            Kosongkan
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {items.length === 0 ? (
          <EmptyState title="Keranjang masih kosong" description="Pilih produk dari grid untuk mulai transaksi." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-brand-100 bg-white">
            {items.map((it) => {
              const unit = it.harga + (Number(it.modifierExtra) || 0);
              return (
              <li key={it.lineId} className="p-2.5">
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2.5">
                  <ProductImage src={it.image} alt={it.nama} className="h-11 w-11 rounded-xl bg-slate-50 object-contain p-1" />
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold leading-tight text-slate-900">{it.nama}</p>
                        {it.modifierText && <p className="truncate text-[11px] text-primary">{it.modifierText}</p>}
                        <p className="mt-0.5 text-xs text-slate-500">{formatRupiah(unit)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(it.lineId)}
                        aria-label="Hapus"
                        className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex h-8 items-center rounded-xl border border-slate-200 bg-white">
                        <button
                          onClick={() => updateQty(it.lineId, it.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={it.qty}
                          min={1}
                          onChange={(e) => updateQty(it.lineId, Number(e.target.value))}
                          className="h-8 w-9 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                        />
                        <button
                          onClick={() => updateQty(it.lineId, it.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="whitespace-nowrap text-sm font-bold text-slate-900">{formatRupiah(unit * it.qty)}</span>
                    </div>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-brand-100 bg-white px-4 py-3 shadow-[0_-10px_24px_-22px_rgba(15,23,42,0.45)]">
        <div className="mb-2 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Subtotal</span>
            <span className="font-bold text-slate-900">{formatRupiah(subtotal())}</span>
          </div>
          {diskon > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Potongan</span>
              <span className="font-bold text-rose-500">- {formatRupiah(diskon)}</span>
            </div>
          )}
        </div>

        <details className="mb-3 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/70 p-2.5 dark:border-accent/30 dark:bg-accent/10" open={diskon > 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-primary">
                <Percent className="h-3.5 w-3.5" />
              </span>
              Diskon
            </span>
            {diskon > 0 && (
              <button
                onClick={(e) => { e.preventDefault(); setDiskon(0); }}
                className="rounded-full px-2 py-1 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                Hapus
              </button>
            )}
          </summary>
          <div className="mt-2">
            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white pl-3 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/25">
              <span className="text-sm font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={0}
                value={diskon || ''}
                placeholder="0"
                onChange={(e) => setDiskon(Number(e.target.value))}
                className="h-full w-full bg-transparent px-2 text-right text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
              />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((p) => {
                const aktif = subtotal() > 0 && diskon === Math.round((subtotal() * p) / 100);
                return (
                  <button
                    key={p}
                    onClick={() => setDiskon(Math.round((subtotal() * p) / 100))}
                    className={
                      'rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ' +
                      (aktif
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary')
                    }
                  >
                    {p}%
                  </button>
                );
              })}
            </div>
          </div>
        </details>

        <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-bold text-slate-600">Total</span>
          <span className="text-2xl font-black tracking-tight text-slate-900">{formatRupiah(total())}</span>
        </div>
        {billMode ? (
          <div className="space-y-2">
            <Button
              variant="gradient"
              className="h-12 w-full rounded-2xl bg-primary text-base font-bold hover:bg-brand-700"
              size="lg"
              disabled={items.length === 0}
              onClick={onCheckout}
            >
              Bayar
            </Button>
            {onSplitBill && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl text-sm font-bold"
                disabled={items.length === 0}
                onClick={onSplitBill}
              >
                <ClipboardList className="h-4 w-4" /> Split Bill
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-2xl text-sm font-bold"
                disabled={items.length === 0}
                onClick={onUpdateBill}
              >
                <Save className="h-4 w-4" /> Simpan
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/15"
                onClick={onCancelBill}
              >
                <Trash2 className="h-4 w-4" /> Batalkan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="gradient"
              className="h-12 w-full rounded-2xl bg-primary text-base font-bold hover:bg-brand-700"
              size="lg"
              disabled={items.length === 0}
              onClick={onCheckout}
            >
              Bayar Semua
            </Button>
            {onSplitBill && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl text-sm font-bold"
                disabled={items.length === 0}
                onClick={onSplitBill}
              >
                <ClipboardList className="h-4 w-4" /> Split Bill
              </Button>
            )}
            {onSaveBill && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl text-sm font-bold"
                disabled={items.length === 0}
                onClick={onSaveBill}
              >
                <ClipboardList className="h-4 w-4" /> Simpan Bill
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
