import { penjualanService, type CheckoutInput } from '@/services';
import type { CartItem, CheckoutResult, DetailPenjualan, Penjualan, PlanType, TaxSetting } from '@/types';
import { isNetworkError, computeDraftTotals } from '@/utils/offlineQueueCore';

export { isNetworkError };

/**
 * Antrean transaksi tunai yang gagal terkirim karena koneksi putus (bukan ditolak
 * server). Disimpan di localStorage supaya bertahan lewat refresh, lalu dikirim ulang
 * otomatis begitu online lagi. Pola ini yang umum dipakai kompetitor (Qasir/Moka/dst):
 * catat lokal saat offline, sinkron otomatis saat koneksi kembali — bukan full
 * offline-first dengan resolusi konflik (itu baru dibutuhkan kalau ada banyak kasir/
 * device offline BERSAMAAN dan berebut stok yang sama, di luar skenario 1 device ini).
 */
const STORAGE_KEY = 'zk_offline_sales_queue';

export interface QueuedSale {
  localId: string;
  createdAt: string;
  payload: CheckoutInput;
  status: 'pending' | 'failed';
  errorMessage?: string;
}

function readQueue(): QueuedSale[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(queue: QueuedSale[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedSale[] {
  return readQueue();
}

export function enqueueSale(payload: CheckoutInput): QueuedSale {
  const item: QueuedSale = {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    payload,
    status: 'pending',
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function removeFromQueue(localId: string) {
  writeQueue(readQueue().filter((q) => q.localId !== localId));
}

/**
 * Kirim ulang semua transaksi pending. Yang ditolak server (bukan soal koneksi)
 * ditandai 'failed' dan TIDAK diulang otomatis lagi — supaya error nyata (mis. stok
 * berubah) gak nyangkut retry selamanya, tapi tetap kelihatan (bukan hilang diam-diam).
 */
export async function flushQueue(): Promise<{ synced: QueuedSale[]; failed: QueuedSale[] }> {
  const queue = readQueue();
  const synced: QueuedSale[] = [];
  const failed: QueuedSale[] = [];
  const remaining: QueuedSale[] = [];

  for (const item of queue) {
    if (item.status === 'failed') { remaining.push(item); continue; }
    try {
      await penjualanService.checkout(item.payload);
      synced.push(item);
    } catch (err) {
      if (isNetworkError(err)) {
        remaining.push(item);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Ditolak server';
        const failedItem: QueuedSale = { ...item, status: 'failed', errorMessage };
        failed.push(failedItem);
        remaining.push(failedItem);
      }
    }
  }
  writeQueue(remaining);
  return { synced, failed };
}

/**
 * Struk sementara untuk transaksi yang baru masuk antrean offline (belum punya ID/no
 * nota resmi dari server). Angka pajak dihitung dari tax setting yang sudah ke-cache
 * saat online — estimasi terbaik, dikoreksi otomatis begitu sinkron beneran.
 */
export function buildOfflineDraft(params: {
  items: CartItem[];
  bayar: number;
  diskon: number;
  keterangan?: string;
  jenisBayarId: number;
  jenisBayarNama?: string;
  kasirNama?: string;
  tax: TaxSetting | null;
  plan: PlanType;
}): { result: CheckoutResult; trx: Penjualan } {
  const subtotal = params.items.reduce((s, i) => s + (i.harga + (Number(i.modifierExtra) || 0)) * i.qty, 0);
  const { ppn, service, total } = computeDraftTotals({ subtotal, diskon: params.diskon, tax: params.tax, plan: params.plan });
  const now = new Date();
  const localId = -Date.now(); // ID negatif = draft lokal, belum tersinkron server

  const detail: DetailPenjualan[] = params.items.map((i, idx) => ({
    ID: -(idx + 1),
    ID_TRANSAKSI_PENJUALAN: localId,
    ID_PRODUK: i.id_produk,
    HARGA_BELI: 0,
    HARGA_JUAL: i.harga + (Number(i.modifierExtra) || 0),
    QTY: i.qty,
    MODIFIER: i.modifierText || null,
    DISKON: 0,
    produk: { ID: i.id_produk, NAMA: i.nama },
  }));

  const trx: Penjualan = {
    ID: localId,
    NO_NOTA: `OFFLINE-${now.getTime().toString().slice(-6)}`,
    TANGGAL: now.toISOString().slice(0, 10),
    JAM: now.toTimeString().slice(0, 8),
    ID_JENIS_BAYAR: params.jenisBayarId,
    TOTAL: String(total),
    ID_USER: 0,
    KETERANGAN: params.keterangan || null,
    DISKON: String(params.diskon),
    PPN: ppn,
    SERVICE_CHARGE: service,
    STATUS: 1,
    STATUS_BAYAR: 'LUNAS (offline)',
    kasir: { ID: 0, NAMA: params.kasirNama || '-' },
    jenisBayar: { ID: params.jenisBayarId, NAMA: params.jenisBayarNama || '-' },
    detail,
  };

  const result: CheckoutResult = {
    id: localId,
    no_nota: trx.NO_NOTA as string,
    subtotal,
    diskon: params.diskon,
    ppn,
    service_charge: service,
    total,
    bayar: params.bayar,
    kembalian: params.bayar - total,
  };

  return { result, trx };
}
