import type { ReceiptSize } from '@/components/pos/Receipt';
import { printViaBluetooth } from '@/utils/blePrinter';

/**
 * Cetak struk thermal 58mm / 80mm.
 *
 * Pendekatan: render ulang node struk (.receipt-print) ke jendela/iframe cetak
 * dengan @page size sesuai lebar kertas, lalu panggil print(). Cara ini bekerja
 * dengan driver printer thermal yang terpasang sebagai printer OS. Dipakai sebagai
 * fallback oleh printReceipt() kalau printer Bluetooth (ESC/POS raw) belum tersambung.
 */
export function printThermal(node: HTMLElement | null, size: ReceiptSize = '58') {
  if (!node) return;
  const widthMm = size === '80' ? 72 : 48; // area cetak efektif
  const win = window.open('', 'PRINT', 'height=600,width=400');
  if (!win) return;

  // Salin stylesheet halaman agar kelas Tailwind tetap berlaku di jendela cetak.
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  win.document.write(`<!doctype html><html><head><meta charset="utf-8">${headStyles}
    <style>
      @page { size: ${widthMm}mm auto; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .receipt-print { width: ${widthMm}mm !important; }
    </style>
  </head><body>${node.outerHTML}</body></html>`);
  win.document.close();
  win.focus();

  // Tunggu <link rel="stylesheet"> beneran selesai load (bukan timer tebakan) — kalau CSS
  // Tailwind belum kepasang saat print() dipanggil, struk bisa kecetak kosong/salah posisi.
  const links = Array.from(win.document.querySelectorAll('link[rel="stylesheet"]'));
  const loaded = links.map((link) => new Promise<void>((resolve) => {
    if ((link as HTMLLinkElement).sheet) { resolve(); return; }
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => resolve());
  }));
  Promise.race([Promise.all(loaded), new Promise((resolve) => setTimeout(resolve, 2000))]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      win.print();
      win.close();
    }));
  });
}

/**
 * Cetak struk: pakai printer Bluetooth (raw ESC/POS, byte-perfect, skip driver OS) kalau
 * sudah tersambung via connectBluetoothPrinter(); kalau belum, fallback ke printThermal
 * (window.print lewat printer OS). Dipakai di semua halaman cetak nota agar hasilnya sama.
 */
export async function printReceipt(node: HTMLElement | null, size: ReceiptSize, escposBytes: Uint8Array) {
  const printed = await printViaBluetooth(escposBytes);
  if (!printed) printThermal(node, size);
}
