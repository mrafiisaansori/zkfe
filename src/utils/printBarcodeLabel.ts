interface LabelData {
  nama: string;
  harga: number;
  barcode: string;
}

/**
 * Cetak label barcode kecil untuk retail (nama produk, harga, barcode).
 * Render barcode scannable (CODE128) via JsBarcode dari CDN di jendela cetak.
 * Bila barcode kosong, dipakai fallback teks kode.
 */
export function printBarcodeLabel(items: LabelData[], copies = 1) {
  const win = window.open('', 'PRINT', 'height=600,width=500');
  if (!win) return;

  const rupiah = (n: number) => `Rp${(Number(n) || 0).toLocaleString('id-ID')}`;
  const labels: string[] = [];
  items.forEach((it) => {
    for (let i = 0; i < copies; i += 1) {
      const code = (it.barcode && it.barcode.trim()) || '';
      labels.push(`
        <div class="label">
          <div class="nama">${String(it.nama).slice(0, 28)}</div>
          <div class="harga">${rupiah(it.harga)}</div>
          ${code ? `<svg class="bc" data-code="${code}"></svg>` : '<div class="nobc">Tanpa barcode</div>'}
        </div>`);
    }
  });

  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js"></script>
    <style>
      @page { margin: 6mm; }
      body { font-family: Arial, sans-serif; margin: 0; }
      .grid { display: flex; flex-wrap: wrap; gap: 6mm; }
      .label { width: 40mm; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 4px 6px; text-align: center; }
      .nama { font-size: 10px; font-weight: 700; line-height: 1.1; height: 22px; overflow: hidden; }
      .harga { font-size: 12px; font-weight: 800; margin: 2px 0; }
      .bc { width: 100%; height: 36px; }
      .nobc { font-size: 9px; color: #94a3b8; }
    </style>
  </head><body>
    <div class="grid">${labels.join('')}</div>
    <script>
      window.onload = function () {
        document.querySelectorAll('svg.bc').forEach(function (el) {
          try { JsBarcode(el, el.getAttribute('data-code'), { format: 'CODE128', displayValue: true, fontSize: 10, height: 32, margin: 0 }); } catch (e) {}
        });
        setTimeout(function () { window.print(); window.close(); }, 500);
      };
    </script>
  </body></html>`);
  win.document.close();
  win.focus();
}
