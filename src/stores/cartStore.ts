import { create } from 'zustand';
import type { CartItem, Produk, OpenBill, ModifierOption } from '@/types';
import { productImage } from '@/utils/image';

// Konteks open bill yang sedang diedit (null = mode transaksi langsung biasa).
export interface BillContext {
  id: number;
  no_bill: string | null;
  customer_name: string;
  table_no: string;
  note: string;
}

const newLineId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface CartState {
  items: CartItem[];
  diskon: number;
  bill: BillContext | null;
  // Tambah produk biasa (tanpa varian). Digabung bila produk sama & tanpa varian.
  addItem: (produk: Produk) => { ok: boolean; message?: string };
  // Tambah produk dengan varian/modifier terpilih (selalu baris baru).
  addLine: (produk: Produk, options: ModifierOption[]) => { ok: boolean; message?: string };
  updateQty: (lineId: string, qty: number) => { ok: boolean; message?: string };
  removeItem: (lineId: string) => void;
  setDiskon: (n: number) => void;
  clear: () => void;
  loadBill: (bill: OpenBill) => void;
  setBillMeta: (patch: Partial<Pick<BillContext, 'customer_name' | 'table_no' | 'note'>>) => void;
  hydrateImages: (produk: Produk[]) => void;
  subtotal: () => number;
  total: () => number;
  count: () => number;
}

// Harga efektif satu baris (harga dasar + tambahan varian).
const unitOf = (i: CartItem) => i.harga + (Number(i.modifierExtra) || 0);

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  diskon: 0,
  bill: null,

  addItem: (produk) => {
    if (produk.STOK <= 0) return { ok: false, message: 'Stok produk habis' };
    const items = get().items;
    // Gabung hanya dengan baris produk sama yang TANPA varian.
    const existing = items.find((i) => i.id_produk === produk.ID && !(i.modifierOptionIds && i.modifierOptionIds.length));
    if (existing) {
      if (existing.qty + 1 > produk.STOK) return { ok: false, message: 'Qty melebihi stok' };
      set({ items: items.map((i) => (i.lineId === existing.lineId ? { ...i, qty: i.qty + 1 } : i)) });
    } else {
      set({
        items: [...items, {
          lineId: newLineId(), id_produk: produk.ID, nama: produk.NAMA, harga: produk.HARGA_JUAL,
          qty: 1, stok: produk.STOK, image: productImage(produk), modifierExtra: 0, modifierOptionIds: [],
        }],
      });
    }
    return { ok: true };
  },

  addLine: (produk, options) => {
    if (produk.STOK <= 0) return { ok: false, message: 'Stok produk habis' };
    const extra = (options || []).reduce((s, o) => s + (Number(o.HARGA) || 0), 0);
    // Deskripsi varian dikelompokkan per grup tidak tersedia di sini; gabung nama opsi.
    const text = (options || []).map((o) => o.NAMA).join(', ') || null;
    set({
      items: [...get().items, {
        lineId: newLineId(), id_produk: produk.ID, nama: produk.NAMA, harga: produk.HARGA_JUAL,
        qty: 1, stok: produk.STOK, image: productImage(produk),
        modifierExtra: extra, modifierText: text, modifierOptionIds: (options || []).map((o) => o.ID),
      }],
    });
    return { ok: true };
  },

  updateQty: (lineId, qty) => {
    const item = get().items.find((i) => i.lineId === lineId);
    if (!item) return { ok: false };
    if (qty <= 0) { get().removeItem(lineId); return { ok: true }; }
    if (qty > item.stok) return { ok: false, message: 'Qty melebihi stok' };
    set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)) });
    return { ok: true };
  },

  removeItem: (lineId) => set({ items: get().items.filter((i) => i.lineId !== lineId) }),
  setDiskon: (n) => set({ diskon: Math.max(0, n) }),
  clear: () => set({ items: [], diskon: 0, bill: null }),

  loadBill: (bill) => set({
    diskon: 0,
    bill: {
      id: bill.ID,
      no_bill: bill.NO_BILL,
      customer_name: bill.CUSTOMER_NAME || '',
      table_no: bill.TABLE_NO || '',
      note: bill.NOTE || '',
    },
    items: (bill.detail || []).map((d) => ({
      lineId: newLineId(),
      openBillDetailId: d.ID,
      id_produk: d.ID_PRODUK,
      nama: d.produk?.NAMA || `Produk ${d.ID_PRODUK}`,
      harga: d.HARGA_JUAL, // sudah harga efektif (termasuk varian)
      qty: Math.max(0, Number(d.QTY || 0) - Number(d.PAID_QTY || 0)),
      stok: d.produk?.STOK ?? d.QTY,
      modifierExtra: 0,
      modifierText: d.MODIFIER || null,
      modifierOptionIds: d.MODIFIER_OPTIONS ? String(d.MODIFIER_OPTIONS).split(',').map(Number).filter(Boolean) : [],
    })).filter((i) => i.qty > 0),
  }),

  setBillMeta: (patch) => set((s) => (s.bill ? { bill: { ...s.bill, ...patch } } : {})),

  hydrateImages: (produk) => set((s) => ({
    items: s.items.map((i) => {
      if (i.image) return i;
      const p = produk.find((x) => x.ID === i.id_produk);
      return p ? { ...i, image: productImage(p) } : i;
    }),
  })),

  subtotal: () => get().items.reduce((s, i) => s + unitOf(i) * i.qty, 0),
  total: () => Math.max(0, get().subtotal() - get().diskon),
  count: () => get().items.reduce((s, i) => s + i.qty, 0),
}));
