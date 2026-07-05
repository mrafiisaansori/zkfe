import type { ReceiptSize } from '@/components/pos/Receipt';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import type { Penjualan, PlanType } from '@/types';
import { truncate, center, twoCol, dashes } from '@/utils/textCols';

/**
 * Kolom karakter font A standar untuk thermal 58mm/80mm (RPP02N, POS58, dst).
 * Ini yang menentukan presisi: HARUS sama persis dengan lebar yang dipakai printThermal (48mm/72mm area cetak).
 */
const COLS: Record<ReceiptSize, number> = { '58': 32, '80': 48 };

const ESC = 0x1b;

interface ReceiptProps {
  trx: Penjualan;
  namaToko?: string;
  alamatToko?: string;
  bayar?: number | null;
  plan?: PlanType;
  size?: ReceiptSize;
}

/** Susun struk sebagai perintah ESC/POS mentah, isinya cermin 1:1 dari <Receipt>. */
export function buildReceiptEscPos({ trx, namaToko, alamatToko, bayar, plan = 'FREE', size = '58' }: ReceiptProps): Uint8Array {
  const width = COLS[size];
  const displayNamaToko = namaToko || (plan === 'FREE' ? 'TOKO ZONA KASIR' : 'TOKO');
  const total = Number(trx.TOTAL) || 0;
  const diskon = Number(trx.DISKON) || 0;
  const ppn = Number(trx.PPN) || 0;
  const service = Number(trx.SERVICE_CHARGE) || 0;
  const diskonVoucher = Number(trx.DISKON_VOUCHER) || 0;
  const items = trx.detail || [];
  const subtotal = items.reduce((s, d) => s + d.HARGA_JUAL * d.QTY, 0);
  const diskonItem = items.reduce((s, d) => s + (Number(d.DISKON) || 0), 0);

  const lines: string[] = [];
  lines.push(center(displayNamaToko.toUpperCase(), width));
  if (alamatToko) lines.push(center(alamatToko, width));
  lines.push(dashes(width));
  lines.push(twoCol('No', nomorNotaPenjualanLabel(trx), width));
  lines.push(twoCol('Tanggal', formatDateTime(`${trx.TANGGAL}T${trx.JAM || '00:00:00'}`), width));
  lines.push(twoCol('Kasir', trx.kasir?.NAMA ?? '-', width));
  lines.push(dashes(width));

  for (const d of items) {
    const lineDiskon = Number(d.DISKON) || 0;
    lines.push(truncate(d.produk?.NAMA ?? `#${d.ID_PRODUK}`, width));
    if (d.MODIFIER) lines.push(truncate(d.MODIFIER, width));
    lines.push(twoCol(`${d.QTY} x ${formatRupiah(d.HARGA_JUAL)}`, formatRupiah(d.HARGA_JUAL * d.QTY), width));
    if (lineDiskon > 0) lines.push(twoCol('  diskon item', '- ' + formatRupiah(lineDiskon), width));
  }

  lines.push(dashes(width));
  lines.push(twoCol('Subtotal', formatRupiah(subtotal), width));
  if (diskonItem > 0) lines.push(twoCol('Diskon item', '- ' + formatRupiah(diskonItem), width));
  if (diskon > 0) lines.push(twoCol('Diskon', '- ' + formatRupiah(diskon), width));
  if (diskonVoucher > 0) lines.push(twoCol(`Voucher${trx.KODE_VOUCHER ? ` (${trx.KODE_VOUCHER})` : ''}`, '- ' + formatRupiah(diskonVoucher), width));
  if (ppn > 0) lines.push(twoCol('PPN', formatRupiah(ppn), width));
  if (service > 0) lines.push(twoCol('Service', formatRupiah(service), width));
  lines.push(dashes(width));
  lines.push(twoCol('TOTAL', formatRupiah(total), width));
  if (bayar != null) {
    lines.push(twoCol('Bayar', formatRupiah(bayar), width));
    lines.push(twoCol('Kembali', formatRupiah(bayar - total), width));
  }
  lines.push(twoCol('Metode', trx.jenisBayar?.NAMA ?? '-', width));
  lines.push(twoCol('Status', trx.STATUS_BAYAR || 'LUNAS', width));
  lines.push(dashes(width));
  lines.push(center('Terima kasih atas kunjungan Anda', width));
  if (plan === 'FREE') {
    lines.push(center('Powered by Zona Kasir', width));
    lines.push(center('POS mudah untuk toko & UMKM', width));
  }

  const body = lines.join('\n') + '\n\n\n\n';
  const encoder = new TextEncoder();
  return new Uint8Array([
    ESC, 0x40, // init
    ESC, 0x61, 0, // align left (twoCol/center sudah handle perataan manual)
    ...encoder.encode(body),
  ]);
  // ponytail: tanpa perintah cut (GS V) — RPP02N/POS58 58mm umumnya tanpa auto-cutter.
}
