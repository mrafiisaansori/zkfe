import type { ReceiptSize } from '@/components/pos/Receipt';

/**
 * Cetak struk thermal 58mm / 80mm.
 *
 * Pendekatan: render ulang node struk (.receipt-print) ke jendela/iframe cetak
 * dengan @page size sesuai lebar kertas, lalu panggil print(). Cara ini bekerja
 * dengan driver printer thermal yang terpasang sebagai printer OS (paling umum &
 * portabel dari web). Untuk ESC/POS raw via serial, gunakan print agent terpisah.
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
  // Beri waktu style termuat sebelum print.
  setTimeout(() => { win.print(); win.close(); }, 400);
}
