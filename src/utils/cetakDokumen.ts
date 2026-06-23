import { formatRupiah, formatDate } from './format';

export interface MerchantHeader {
  nama?: string | null;
  alamat?: string | null;
  no_telp?: string | null;
  logo_url?: string | null;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string
));

// Kerangka dokumen formal (kop merchant + judul + isi + tanda tangan).
function shell(merchant: MerchantHeader, title: string, metaRight: string, body: string) {
  const logo = merchant.logo_url
    ? `<img src="${esc(merchant.logo_url)}" alt="logo" style="height:54px;width:54px;object-fit:contain;border-radius:8px"/>`
    : '<div style="height:54px;width:54px;border-radius:8px;background:#0a6cb0;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px">'
      + esc((merchant.nama || 'T').charAt(0).toUpperCase()) + '</div>';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    *{box-sizing:border-box} body{font-family:'Segoe UI',Arial,sans-serif;color:#0a2540;margin:0;padding:28px;font-size:13px}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0a6cb0;padding-bottom:14px}
    .biz{display:flex;gap:12px;align-items:center}
    .biz h1{font-size:17px;margin:0;font-weight:800}
    .biz p{margin:2px 0 0;font-size:12px;color:#475569}
    .doc{text-align:right}
    .doc .title{font-size:15px;font-weight:800;letter-spacing:.04em;color:#0a6cb0}
    .doc .meta{font-size:12px;color:#475569;margin-top:4px;line-height:1.5}
    .party{margin:16px 0;font-size:12.5px}
    .party b{display:inline-block;min-width:120px;color:#475569;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#eef6fb;text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;color:#475569}
    th,td{border:1px solid #d8e2ec;padding:7px 9px}
    td.num,th.num{text-align:right}
    td.c,th.c{text-align:center}
    tfoot td{font-weight:800;background:#f6f8fa}
    .note{margin-top:14px;font-size:12px;color:#475569}
    .note b{color:#0a2540}
    .sign{display:flex;justify-content:space-between;margin-top:42px;font-size:12.5px;text-align:center}
    .sign .box{width:200px}
    .sign .line{margin-top:54px;border-top:1px solid #94a3b8;padding-top:4px;color:#475569}
    .ft{margin-top:30px;text-align:center;font-size:10.5px;color:#94a3b8}
    @media print{body{padding:0}}
  </style></head><body>
    <div class="top">
      <div class="biz">${logo}<div><h1>${esc(merchant.nama || 'Toko')}</h1>
        ${merchant.alamat ? `<p>${esc(merchant.alamat)}</p>` : ''}
        ${merchant.no_telp ? `<p>Telp: ${esc(merchant.no_telp)}</p>` : ''}
      </div></div>
      <div class="doc"><div class="title">${esc(title)}</div><div class="meta">${metaRight}</div></div>
    </div>
    ${body}
    <div class="sign">
      <div class="box"><div>Dibuat oleh,</div><div class="line">( ........................ )</div></div>
      <div class="box"><div>Mengetahui,</div><div class="line">( ........................ )</div></div>
    </div>
    <div class="ft">Dicetak melalui Zona Kasir &middot; ${esc(new Date().toLocaleString('id-ID'))}</div>
  </body></html>`;
}

function openPrint(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  // Beri waktu logo termuat sebelum cetak.
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* ignore */ } }, 400);
}

interface PembelianDoc {
  NO_NOTA: string; TANGGAL: string; CATATAN?: string | null;
  supplier?: { NAMA: string } | null;
  detail?: Array<{ ID: number; HARGA_BELI: number; QTY: number; produk?: { NAMA: string }; ID_PRODUK: number }>;
}

export function cetakPembelian(p: PembelianDoc, merchant: MerchantHeader) {
  const det = p.detail || [];
  const total = det.reduce((s, d) => s + d.HARGA_BELI * d.QTY, 0);
  const rows = det.map((d, i) => `<tr>
    <td class="c">${i + 1}</td>
    <td>${esc(d.produk?.NAMA || d.ID_PRODUK)}</td>
    <td class="num">${d.QTY}</td>
    <td class="num">${formatRupiah(d.HARGA_BELI)}</td>
    <td class="num">${formatRupiah(d.HARGA_BELI * d.QTY)}</td>
  </tr>`).join('');
  const body = `
    <div class="party">
      <div><b>Supplier</b>: ${esc(p.supplier?.NAMA || '-')}</div>
    </div>
    <table>
      <thead><tr><th class="c">No</th><th>Nama Produk</th><th class="num">Qty</th><th class="num">Harga Beli</th><th class="num">Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="4" class="num">TOTAL PEMBELIAN</td><td class="num">${formatRupiah(total)}</td></tr></tfoot>
    </table>
    ${p.CATATAN ? `<div class="note"><b>Catatan:</b> ${esc(p.CATATAN)}</div>` : ''}`;
  const meta = `No. Nota: <b>${esc(p.NO_NOTA)}</b><br/>Tanggal: ${esc(formatDate(p.TANGGAL))}`;
  openPrint(shell(merchant, 'DOKUMEN PEMBELIAN BARANG', meta, body));
}

const RETUR_STATUS: Record<number, string> = { 0: 'DRAFT', 1: 'SELESAI', 2: 'DIBATALKAN' };

interface ReturDoc {
  NO_NOTA: string; TANGGAL: string; CATATAN?: string | null; STATUS: number;
  supplier?: { NAMA: string } | null;
  pembelian?: { NO_NOTA: string } | null;
  detail?: Array<{ ID: number; QTY: number; ALASAN?: string | null; KONDISI?: string | null; HARGA?: number | null; produk?: { NAMA: string }; ID_PRODUK: number }>;
}

export function cetakRetur(r: ReturDoc, merchant: MerchantHeader) {
  const det = r.detail || [];
  const adaHarga = det.some((d) => d.HARGA != null);
  const total = det.reduce((s, d) => s + (Number(d.HARGA) || 0) * d.QTY, 0);
  const rows = det.map((d, i) => `<tr>
    <td class="c">${i + 1}</td>
    <td>${esc(d.produk?.NAMA || d.ID_PRODUK)}</td>
    <td class="num">${d.QTY}</td>
    <td>${esc(d.ALASAN || '-')}</td>
    <td>${esc(d.KONDISI || '-')}</td>
    ${adaHarga ? `<td class="num">${d.HARGA != null ? formatRupiah(d.HARGA) : '-'}</td><td class="num">${d.HARGA != null ? formatRupiah(Number(d.HARGA) * d.QTY) : '-'}</td>` : ''}
  </tr>`).join('');
  const headHarga = adaHarga ? '<th class="num">Harga/Nilai</th><th class="num">Subtotal</th>' : '';
  const footHarga = adaHarga ? `<tfoot><tr><td colspan="5" class="num">TOTAL NILAI RETUR</td><td class="num" colspan="2">${formatRupiah(total)}</td></tr></tfoot>` : '';
  const body = `
    <div class="party">
      <div><b>Supplier</b>: ${esc(r.supplier?.NAMA || '-')}</div>
      <div><b>Pembelian asal</b>: ${esc(r.pembelian?.NO_NOTA || '-')}</div>
      <div><b>Status</b>: ${esc(RETUR_STATUS[r.STATUS] || '-')}</div>
    </div>
    <table>
      <thead><tr><th class="c">No</th><th>Nama Produk</th><th class="num">Qty Retur</th><th>Alasan</th><th>Kondisi</th>${headHarga}</tr></thead>
      <tbody>${rows}</tbody>
      ${footHarga}
    </table>
    ${r.CATATAN ? `<div class="note"><b>Catatan retur:</b> ${esc(r.CATATAN)}</div>` : ''}`;
  const meta = `No. Retur: <b>${esc(r.NO_NOTA)}</b><br/>Tanggal: ${esc(formatDate(r.TANGGAL))}`;
  openPrint(shell(merchant, 'DOKUMEN RETUR BARANG KE SUPPLIER', meta, body));
}
