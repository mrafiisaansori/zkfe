import type { LaporanPendapatan, LaporanPenjualan, Penjualan, PlanType, RekapLaporan } from '@/types';
import { formatDate, formatNumber, formatRupiah } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';

export interface FinancialReportExportInput {
  merchantName?: string | null;
  generatedBy?: string | null;
  plan: PlanType;
  tanggalAwal: string;
  tanggalAkhir: string;
  penjualan: LaporanPenjualan;
  pendapatan: LaporanPendapatan;
  rekap?: RekapLaporan | null;
}

interface SummaryMetric {
  omzetBersih: number;
  penerimaanBruto: number;
  totalTransaksi: number;
  totalModal: number;
  labaKotor: number;
  marginLaba: number;
  ppn: number;
  serviceCharge: number;
  diskonTransaksi: number;
  diskonVoucher: number;
  totalDiskon: number;
  rataRataTransaksi: number;
  jumlahItem: number;
}

interface NamedTotalRow {
  label: string;
  jumlahTransaksi: number;
  total: number;
}

interface ProductRow {
  nama: string;
  qty: number;
  omzet: number;
}

interface LowStockRow {
  nama: string;
  stok: number;
  hargaJual: number;
}

interface PeriodTotalRow {
  periode: string;
  jumlahTransaksi: number;
  total: number;
}

interface ReportModel {
  merchantName: string;
  generatedBy: string;
  generatedAt: Date;
  plan: PlanType;
  tanggalAwal: string;
  tanggalAkhir: string;
  periodeLabel: string;
  summary: SummaryMetric;
  transaksi: Penjualan[];
  perMetode: NamedTotalRow[];
  perKasir: NamedTotalRow[];
  produkTerlaris: ProductRow[];
  stokMenipis: LowStockRow[];
  harian: PeriodTotalRow[];
  bulanan: PeriodTotalRow[];
  hasCompleteRekap: boolean;
}

interface ExcelCell {
  value?: string | number | null;
  type?: 'String' | 'Number';
  style?: string;
  mergeAcross?: number;
}

type ExcelRow = ExcelCell[];

const rupiahFormat = '"Rp" #,##0;[Red]-"Rp" #,##0';

function toNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function escapeXml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dateTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatReportDate(value?: string | null): string {
  if (!value) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return formatDate(value);
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function fileDateTime(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function safeFilenameSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'toko';
}

function notaLabel(t: Penjualan): string {
  return nomorNotaPenjualanLabel(t);
}

function monthLabel(value: string): string {
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

function sortTransactions(rows: Penjualan[]): Penjualan[] {
  return [...rows].sort((a, b) => {
    const aKey = `${a.TANGGAL ?? ''} ${a.JAM ?? ''} ${String(a.ID).padStart(10, '0')}`;
    const bKey = `${b.TANGGAL ?? ''} ${b.JAM ?? ''} ${String(b.ID).padStart(10, '0')}`;
    return aKey.localeCompare(bKey);
  });
}

function aggregateNamed(
  rows: Penjualan[],
  keyGetter: (row: Penjualan) => string,
): NamedTotalRow[] {
  const map = new Map<string, NamedTotalRow>();
  rows.forEach((row) => {
    const label = keyGetter(row) || '-';
    const current = map.get(label) ?? { label, jumlahTransaksi: 0, total: 0 };
    current.jumlahTransaksi += 1;
    current.total += toNumber(row.TOTAL);
    map.set(label, current);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function aggregatePeriod(
  rows: Penjualan[],
  keyGetter: (row: Penjualan) => string,
  labelFormatter: (key: string) => string = (key) => key,
): PeriodTotalRow[] {
  const map = new Map<string, { key: string; jumlahTransaksi: number; total: number }>();
  rows.forEach((row) => {
    const key = keyGetter(row) || '-';
    const current = map.get(key) ?? { key, jumlahTransaksi: 0, total: 0 };
    current.jumlahTransaksi += 1;
    current.total += toNumber(row.TOTAL);
    map.set(key, current);
  });
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({ periode: labelFormatter(row.key), jumlahTransaksi: row.jumlahTransaksi, total: row.total }));
}

function buildReportModel(input: FinancialReportExportInput): ReportModel {
  const transaksi = sortTransactions(input.penjualan.data ?? []);
  const ringkasan = input.rekap?.ringkasan;
  const totalTransaksi = ringkasan?.total_transaksi ?? input.penjualan.jumlah_transaksi ?? transaksi.length;
  const penerimaanBruto = ringkasan?.penerimaan_bruto ?? input.penjualan.total_dibayar ?? input.pendapatan.total_dibayar;
  const omzetBersih = ringkasan?.omzet_bersih ?? input.penjualan.omzet ?? input.pendapatan.omzet;
  const totalModal = ringkasan?.total_modal ?? input.pendapatan.modal;
  const labaKotor = ringkasan?.laba_kotor ?? input.pendapatan.laba;
  const ppn = ringkasan?.ppn ?? input.penjualan.total_ppn ?? input.pendapatan.ppn;
  const serviceCharge = ringkasan?.service_charge ?? input.penjualan.total_service ?? input.pendapatan.service;
  const diskonTransaksi = ringkasan?.diskon ?? transaksi.reduce((sum, row) => sum + toNumber(row.DISKON), 0);
  const diskonVoucher = ringkasan?.voucher ?? 0;
  const totalDiskon = ringkasan?.diskon_voucher_total ?? diskonTransaksi + diskonVoucher;

  return {
    merchantName: input.merchantName || 'Toko',
    generatedBy: input.generatedBy || '-',
    generatedAt: new Date(),
    plan: input.plan,
    tanggalAwal: input.tanggalAwal,
    tanggalAkhir: input.tanggalAkhir,
    periodeLabel: `${formatReportDate(input.tanggalAwal)} s/d ${formatReportDate(input.tanggalAkhir)}`,
    summary: {
      omzetBersih,
      penerimaanBruto,
      totalTransaksi,
      totalModal,
      labaKotor,
      marginLaba: omzetBersih > 0 ? (labaKotor / omzetBersih) * 100 : 0,
      ppn,
      serviceCharge,
      diskonTransaksi,
      diskonVoucher,
      totalDiskon,
      rataRataTransaksi: totalTransaksi > 0 ? penerimaanBruto / totalTransaksi : 0,
      jumlahItem: input.pendapatan.jumlah_item ?? 0,
    },
    transaksi,
    perMetode: input.rekap?.per_metode_bayar?.length
      ? input.rekap.per_metode_bayar.map((row) => ({
        label: row.metode,
        jumlahTransaksi: row.jumlah_transaksi,
        total: row.total,
      }))
      : aggregateNamed(transaksi, (row) => row.jenisBayar?.NAMA ?? '(Tanpa metode)'),
    perKasir: input.rekap?.per_kasir?.length
      ? input.rekap.per_kasir.map((row) => ({
        label: row.kasir,
        jumlahTransaksi: row.jumlah_transaksi,
        total: row.total,
      }))
      : aggregateNamed(transaksi, (row) => row.kasir?.NAMA ?? '(Tanpa kasir)'),
    produkTerlaris: input.rekap?.produk_terlaris?.map((row) => ({
      nama: row.nama,
      qty: row.qty,
      omzet: row.omzet,
    })) ?? [],
    stokMenipis: input.rekap?.produk_stok_menipis?.map((row) => ({
      nama: row.nama,
      stok: row.stok,
      hargaJual: row.harga_jual,
    })) ?? [],
    harian: input.rekap?.harian?.length
      ? input.rekap.harian.map((row) => ({
        periode: formatReportDate(row.tanggal),
        jumlahTransaksi: row.jumlah_transaksi,
        total: row.total,
      }))
      : aggregatePeriod(transaksi, (row) => String(row.TANGGAL ?? ''), formatReportDate),
    bulanan: input.rekap?.bulanan?.length
      ? input.rekap.bulanan.map((row) => ({
        periode: monthLabel(row.bulan),
        jumlahTransaksi: row.jumlah_transaksi,
        total: row.total,
      }))
      : aggregatePeriod(transaksi, (row) => String(row.TANGGAL ?? '').slice(0, 7), monthLabel),
    hasCompleteRekap: Boolean(input.rekap),
  };
}

function blankRow(): ExcelRow {
  return [{ value: '' }];
}

function titleRow(value: string, mergeAcross = 4): ExcelRow {
  return [{ value, style: 'Title', mergeAcross }];
}

function sectionRow(value: string, mergeAcross = 4): ExcelRow {
  return [{ value, style: 'Section', mergeAcross }];
}

function headerRow(values: string[]): ExcelRow {
  return values.map((value) => ({ value, style: 'Header' }));
}

function emptyExcelRow(message: string, mergeAcross: number): ExcelRow {
  return [{ value: message, style: 'Muted', mergeAcross }];
}

function summaryRows(report: ReportModel): ExcelRow[] {
  const s = report.summary;
  return [
    titleRow('Laporan Keuangan', 3),
    [{ value: report.merchantName, style: 'Subtitle', mergeAcross: 3 }],
    blankRow(),
    [{ value: 'Periode', style: 'Label' }, { value: report.periodeLabel, mergeAcross: 2 }],
    [{ value: 'Dibuat', style: 'Label' }, { value: dateTimeLabel(report.generatedAt), mergeAcross: 2 }],
    [{ value: 'Dibuat oleh', style: 'Label' }, { value: report.generatedBy, mergeAcross: 2 }],
    [{ value: 'Paket', style: 'Label' }, { value: report.plan, mergeAcross: 2 }],
    blankRow(),
    sectionRow('Ringkasan Utama', 3),
    headerRow(['Indikator', 'Nilai', 'Catatan']),
    [{ value: 'Omzet bersih', style: 'Label' }, { value: s.omzetBersih, style: 'Currency' }, { value: 'Penjualan tanpa PPN dan service charge' }],
    [{ value: 'Penerimaan bruto', style: 'Label' }, { value: s.penerimaanBruto, style: 'Currency' }, { value: 'Total dibayar pelanggan' }],
    [{ value: 'Total transaksi', style: 'Label' }, { value: s.totalTransaksi, style: 'Number' }, { value: 'Jumlah nota sah' }],
    [{ value: 'Rata-rata transaksi', style: 'Label' }, { value: s.rataRataTransaksi, style: 'Currency' }, { value: 'Penerimaan bruto dibagi transaksi' }],
    [{ value: 'HPP / modal', style: 'Label' }, { value: s.totalModal, style: 'Currency' }, { value: 'Total harga beli barang terjual' }],
    [{ value: 'Laba kotor', style: 'Label' }, { value: s.labaKotor, style: 'CurrencyGood' }, { value: `${s.marginLaba.toFixed(1)}% dari omzet bersih` }],
    [{ value: 'PPN terkumpul', style: 'Label' }, { value: s.ppn, style: 'Currency' }, { value: 'Titipan pajak, bukan pendapatan' }],
    [{ value: 'Service charge', style: 'Label' }, { value: s.serviceCharge, style: 'Currency' }, { value: 'Biaya layanan yang terkumpul' }],
    [{ value: 'Diskon transaksi', style: 'Label' }, { value: s.diskonTransaksi, style: 'Currency' }, { value: 'Diskon manual di transaksi' }],
    [{ value: 'Diskon voucher', style: 'Label' }, { value: s.diskonVoucher, style: 'Currency' }, { value: 'Diskon dari voucher' }],
    [{ value: 'Total diskon', style: 'Label' }, { value: s.totalDiskon, style: 'Currency' }, { value: 'Diskon transaksi + voucher' }],
    [{ value: 'Jumlah item terjual', style: 'Label' }, { value: s.jumlahItem, style: 'Number' }, { value: 'Jumlah baris item penjualan' }],
  ];
}

function namedTotalRows(title: string, rows: NamedTotalRow[]): ExcelRow[] {
  const excelRows: ExcelRow[] = [
    titleRow(title, 3),
    [{ value: 'Diurutkan berdasarkan total terbesar', style: 'Muted', mergeAcross: 3 }],
    blankRow(),
    headerRow(['Nama', 'Jumlah Transaksi', 'Total', 'Kontribusi']),
  ];
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  if (!rows.length) return [...excelRows, emptyExcelRow('Tidak ada data pada periode ini.', 3)];
  rows.forEach((row) => {
    excelRows.push([
      { value: row.label },
      { value: row.jumlahTransaksi, style: 'Number' },
      { value: row.total, style: 'Currency' },
      { value: total > 0 ? row.total / total : 0, style: 'Percent' },
    ]);
  });
  return excelRows;
}

function productRows(title: string, rows: ProductRow[], complete: boolean): ExcelRow[] {
  const excelRows: ExcelRow[] = [
    titleRow(title, 3),
    [{ value: 'Produk dengan kuantitas terjual tertinggi', style: 'Muted', mergeAcross: 3 }],
    blankRow(),
    headerRow(['Produk', 'Qty Terjual', 'Omzet', 'Rata-rata per Qty']),
  ];
  if (!complete) return [...excelRows, emptyExcelRow('Data produk terlaris tersedia pada laporan lengkap PRO/BUSINESS.', 3)];
  if (!rows.length) return [...excelRows, emptyExcelRow('Tidak ada data pada periode ini.', 3)];
  rows.forEach((row) => {
    excelRows.push([
      { value: row.nama },
      { value: row.qty, style: 'Number' },
      { value: row.omzet, style: 'Currency' },
      { value: row.qty > 0 ? row.omzet / row.qty : 0, style: 'Currency' },
    ]);
  });
  return excelRows;
}

function lowStockRows(title: string, rows: LowStockRow[], complete: boolean): ExcelRow[] {
  const excelRows: ExcelRow[] = [
    titleRow(title, 2),
    [{ value: 'Produk yang perlu dipantau untuk restock', style: 'Muted', mergeAcross: 2 }],
    blankRow(),
    headerRow(['Produk', 'Sisa Stok', 'Harga Jual']),
  ];
  if (!complete) return [...excelRows, emptyExcelRow('Data stok menipis tersedia pada laporan lengkap PRO/BUSINESS.', 2)];
  if (!rows.length) return [...excelRows, emptyExcelRow('Tidak ada produk stok menipis.', 2)];
  rows.forEach((row) => {
    excelRows.push([
      { value: row.nama },
      { value: row.stok, style: row.stok <= 0 ? 'NumberBad' : 'Number' },
      { value: row.hargaJual, style: 'Currency' },
    ]);
  });
  return excelRows;
}

function periodRows(title: string, rows: PeriodTotalRow[]): ExcelRow[] {
  const excelRows: ExcelRow[] = [
    titleRow(title, 3),
    [{ value: 'Rekap total penjualan per periode', style: 'Muted', mergeAcross: 3 }],
    blankRow(),
    headerRow(['Periode', 'Jumlah Transaksi', 'Total', 'Rata-rata Transaksi']),
  ];
  if (!rows.length) return [...excelRows, emptyExcelRow('Tidak ada data pada periode ini.', 3)];
  rows.forEach((row) => {
    excelRows.push([
      { value: row.periode },
      { value: row.jumlahTransaksi, style: 'Number' },
      { value: row.total, style: 'Currency' },
      { value: row.jumlahTransaksi > 0 ? row.total / row.jumlahTransaksi : 0, style: 'Currency' },
    ]);
  });
  return excelRows;
}

function transactionRows(report: ReportModel): ExcelRow[] {
  const excelRows: ExcelRow[] = [
    titleRow('Daftar Transaksi', 11),
    [{ value: report.periodeLabel, style: 'Muted', mergeAcross: 11 }],
    blankRow(),
    headerRow(['No', 'Nota', 'Tanggal', 'Jam', 'Kasir', 'Metode', 'Status Bayar', 'Total Bruto', 'PPN', 'Service', 'Diskon', 'Keterangan']),
  ];
  if (!report.transaksi.length) return [...excelRows, emptyExcelRow('Tidak ada transaksi pada periode ini.', 11)];
  report.transaksi.forEach((row, index) => {
    excelRows.push([
      { value: index + 1, style: 'Number' },
      { value: notaLabel(row) },
      { value: formatReportDate(row.TANGGAL) },
      { value: row.JAM || '-' },
      { value: row.kasir?.NAMA ?? '-' },
      { value: row.jenisBayar?.NAMA ?? '-' },
      { value: row.STATUS_BAYAR ?? '-' },
      { value: toNumber(row.TOTAL), style: 'Currency' },
      { value: toNumber(row.PPN), style: 'Currency' },
      { value: toNumber(row.SERVICE_CHARGE), style: 'Currency' },
      { value: toNumber(row.DISKON), style: 'Currency' },
      { value: row.KETERANGAN ?? '-' },
    ]);
  });
  return excelRows;
}

interface ExcelSheetDefinition {
  name: string;
  rows: ExcelRow[];
  widths: number[];
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

const XLSX_STYLE_INDEX: Record<string, number> = {
  Default: 0,
  Title: 1,
  Subtitle: 2,
  Section: 3,
  Header: 4,
  Label: 5,
  Muted: 6,
  Number: 7,
  NumberBad: 8,
  Currency: 9,
  CurrencyGood: 10,
  Percent: 11,
};

const textEncoder = new TextEncoder();

function xlsxStyle(style?: string): number {
  return XLSX_STYLE_INDEX[style || 'Default'] ?? XLSX_STYLE_INDEX.Default;
}

function columnLetter(index: number): string {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function cellRef(rowIndex: number, colIndex: number): string {
  return `${columnLetter(colIndex)}${rowIndex + 1}`;
}

function excelWidth(width: number): number {
  return Math.max(9, Math.min(42, Math.round(width / 6.5)));
}

function rowHeight(row: ExcelRow): number | undefined {
  const style = row.find((cell) => cell.style)?.style;
  if (style === 'Title') return 28;
  if (style === 'Subtitle') return 20;
  if (style === 'Section' || style === 'Header') return 18;
  return undefined;
}

function xlsxCell(cell: ExcelCell, rowIndex: number, colIndex: number): string {
  const ref = cellRef(rowIndex, colIndex);
  const style = xlsxStyle(cell.style);
  const isNumeric = typeof cell.value === 'number' && Number.isFinite(cell.value);
  const type = cell.type ?? (isNumeric ? 'Number' : 'String');

  if (type === 'Number') {
    return `<c r="${ref}" s="${style}"><v>${toNumber(cell.value)}</v></c>`;
  }

  const value = escapeXml(cell.value);
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${value}</t></is></c>`;
}

function xlsxRow(row: ExcelRow, rowIndex: number, mergeRefs: string[]): string {
  let colIndex = 0;
  const cells = row.map((cell) => {
    const currentCol = colIndex;
    if (cell.mergeAcross && cell.mergeAcross > 0) {
      mergeRefs.push(`${cellRef(rowIndex, currentCol)}:${cellRef(rowIndex, currentCol + cell.mergeAcross)}`);
    }
    colIndex += 1 + (cell.mergeAcross || 0);
    return xlsxCell(cell, rowIndex, currentCol);
  }).join('');
  const height = rowHeight(row);
  const customHeight = height ? ` ht="${height}" customHeight="1"` : '';
  return `<row r="${rowIndex + 1}"${customHeight}>${cells}</row>`;
}

function buildWorksheetXml(sheet: ExcelSheetDefinition): string {
  const mergeRefs: string[] = [];
  const cols = sheet.widths.map((width, index) => {
    const col = index + 1;
    const w = excelWidth(width);
    return `<col min="${col}" max="${col}" width="${w}" customWidth="1"/>`;
  }).join('');
  const rows = sheet.rows.map((row, index) => xlsxRow(row, index, mergeRefs)).join('');
  const merges = mergeRefs.length
    ? `<mergeCells count="${mergeRefs.length}">${mergeRefs.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="16"/>
  <cols>${cols}</cols>
  <sheetData>${rows}</sheetData>
  ${merges}
  <pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

function buildWorkbookXml(sheets: ExcelSheetDefinition[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr date1904="false"/>
  <sheets>
    ${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
  </sheets>
</workbook>`;
}

function buildWorkbookRelsXml(sheets: ExcelSheetDefinition[]): string {
  const worksheetRels = sheets.map((_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${worksheetRels}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildContentTypesXml(sheets: ExcelSheetDefinition[]): string {
  const worksheetOverrides = sheets.map((_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${worksheetOverrides}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function buildRootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="${escapeXml(rupiahFormat)}"/>
    <numFmt numFmtId="165" formatCode="0.0%"/>
  </numFmts>
  <fonts count="8">
    <font><sz val="10"/><color rgb="FF334155"/><name val="Arial"/></font>
    <font><b/><sz val="18"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><b/><sz val="12"/><color rgb="FF0F766E"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Arial"/></font>
    <font><sz val="10"/><color rgb="FF64748B"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FFBE123C"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF047857"/><name val="Arial"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0F2FE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="3" fontId="6" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="7" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
}

function buildCorePropsXml(report: ReportModel): string {
  const created = report.generatedAt.toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Laporan Keuangan</dc:title>
  <dc:subject>${escapeXml(report.merchantName)}</dc:subject>
  <dc:creator>Zona Kasir</dc:creator>
  <cp:lastModifiedBy>Zona Kasir</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppPropsXml(sheets: ExcelSheetDefinition[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Zona Kasir</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="${sheets.length}" baseType="lpstr">
      ${sheets.map((sheet) => `<vt:lpstr>${escapeXml(sheet.name)}</vt:lpstr>`).join('')}
    </vt:vector>
  </TitlesOfParts>
</Properties>`;
}

function buildExcelSheets(report: ReportModel): ExcelSheetDefinition[] {
  return [
    { name: 'Ringkasan', rows: summaryRows(report), widths: [190, 155, 360, 130] },
    { name: 'Transaksi', rows: transactionRows(report), widths: [50, 120, 115, 75, 160, 135, 105, 140, 120, 120, 120, 260] },
    { name: 'Metode Bayar', rows: namedTotalRows('Penjualan per Metode Pembayaran', report.perMetode), widths: [230, 135, 150, 110] },
    { name: 'Kasir', rows: namedTotalRows('Rekap Penjualan per Kasir', report.perKasir), widths: [230, 135, 150, 110] },
    { name: 'Produk Terlaris', rows: productRows('Produk Terlaris', report.produkTerlaris, report.hasCompleteRekap), widths: [310, 110, 150, 150] },
    { name: 'Stok Menipis', rows: lowStockRows('Produk Stok Menipis', report.stokMenipis, report.hasCompleteRekap), widths: [310, 110, 150] },
    { name: 'Harian', rows: periodRows('Rekap Harian', report.harian), widths: [150, 135, 150, 150] },
    { name: 'Bulanan', rows: periodRows('Rekap Bulanan', report.bulanan), widths: [160, 135, 150, 150] },
  ];
}

function textEntry(path: string, xml: string): ZipEntry {
  return { path, data: textEncoder.encode(xml) };
}

function buildExcelWorkbook(report: ReportModel): Blob {
  const sheets = buildExcelSheets(report);
  const entries: ZipEntry[] = [
    textEntry('[Content_Types].xml', buildContentTypesXml(sheets)),
    textEntry('_rels/.rels', buildRootRelsXml()),
    textEntry('xl/workbook.xml', buildWorkbookXml(sheets)),
    textEntry('xl/_rels/workbook.xml.rels', buildWorkbookRelsXml(sheets)),
    textEntry('xl/styles.xml', buildStylesXml()),
    textEntry('docProps/core.xml', buildCorePropsXml(report)),
    textEntry('docProps/app.xml', buildAppPropsXml(sheets)),
    ...sheets.map((sheet, index) => textEntry(`xl/worksheets/sheet${index + 1}.xml`, buildWorksheetXml(sheet))),
  ];
  return createZipBlob(entries, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function dosTimestamp(date = new Date()): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { time: dosTime, date: dosDate };
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function createZipBlob(entries: ZipEntry[], type: string): Blob {
  const now = dosTimestamp();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const name = textEncoder.encode(entry.path);
    const checksum = crc32(entry.data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x0800);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, now.time);
    writeUint16(localView, 12, now.date);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, entry.data.length);
    writeUint32(localView, 22, entry.data.length);
    writeUint16(localView, 26, name.length);
    writeUint16(localView, 28, 0);
    localHeader.set(name, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x0800);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, now.time);
    writeUint16(centralView, 14, now.date);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, entry.data.length);
    writeUint32(centralView, 24, entry.data.length);
    writeUint16(centralView, 28, name.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(name, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  const zipBytes = concatBytes([...localParts, centralDirectory, end]);
  return new Blob([zipBytes.buffer as ArrayBuffer], { type });
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function reportFilename(report: ReportModel, extension: 'xlsx' | 'pdf'): string {
  const merchant = safeFilenameSegment(report.merchantName);
  return `laporan-keuangan-${merchant}-${report.tanggalAwal}_${report.tanggalAkhir}-${fileDateTime(report.generatedAt)}.${extension}`;
}

export function exportFinancialReportExcel(input: FinancialReportExportInput) {
  const report = buildReportModel(input);
  const workbook = buildExcelWorkbook(report);
  downloadBlob(
    reportFilename(report, 'xlsx'),
    workbook,
  );
}

function metricCard(label: string, value: string, note?: string): string {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ''}
    </div>`;
}

function tableHtml(
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  emptyMessage: string,
  numericColumns: number[] = [],
): string {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead>
          <tr>${headers.map((header, index) => `<th class="${numericColumns.includes(index) ? 'right' : ''}">${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.length
            ? rows.map((row) => `<tr>${row.map((cell, index) => `<td class="${numericColumns.includes(index) ? 'right' : ''}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
            : `<tr><td colspan="${headers.length}" class="empty">${escapeHtml(emptyMessage)}</td></tr>`}
        </tbody>
      </table>
    </section>`;
}

function buildPdfHtml(report: ReportModel): string {
  const s = report.summary;
  const transaksiRows = report.transaksi.map((row, index) => [
    index + 1,
    notaLabel(row),
    formatReportDate(row.TANGGAL),
    row.JAM || '-',
    row.kasir?.NAMA ?? '-',
    row.jenisBayar?.NAMA ?? '-',
    formatRupiah(row.TOTAL),
  ]);
  const completeMessage = 'Data ini tersedia pada laporan lengkap PRO/BUSINESS.';

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportFilename(report, 'pdf'))}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .page {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 22px;
      background: #ffffff;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .merchant {
      margin-top: 6px;
      color: #0f766e;
      font-size: 15px;
      font-weight: 700;
    }
    .meta {
      min-width: 230px;
      border-left: 1px solid #cbd5e1;
      padding-left: 18px;
      color: #475569;
    }
    .meta div {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid #e2e8f0;
      padding: 4px 0;
    }
    .meta b { color: #0f172a; }
    .note {
      margin: 0 0 18px;
      padding: 10px 12px;
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      color: #78350f;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 18px;
      break-inside: avoid;
    }
    .metric {
      min-height: 76px;
      border: 1px solid #dbe3eb;
      border-radius: 6px;
      padding: 9px;
      background: #ffffff;
    }
    .metric span {
      display: block;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .metric strong {
      display: block;
      margin-top: 6px;
      color: #0f172a;
      font-size: 16px;
      line-height: 1.2;
    }
    .metric small {
      display: block;
      margin-top: 5px;
      color: #64748b;
    }
    section {
      margin-top: 18px;
      break-inside: auto;
      page-break-inside: auto;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #0f172a;
      break-after: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #cbd5e1;
      font-size: 10.5px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 5px 6px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: normal;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    .right { text-align: right; }
    .empty {
      text-align: center;
      color: #64748b;
      padding: 14px;
    }
    footer {
      margin-top: 24px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      color: #64748b;
      font-size: 10px;
    }
    @media print {
      body { background: #ffffff; }
      .page { max-width: none; padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
    @media screen and (max-width: 760px) {
      body { background: #ffffff; }
      .page { padding: 16px; }
      header { flex-direction: column; }
      .meta {
        width: 100%;
        min-width: 0;
        border-left: 0;
        padding-left: 0;
      }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div>
        <h1>Laporan Keuangan</h1>
        <div class="merchant">${escapeHtml(report.merchantName)}</div>
      </div>
      <div class="meta">
        <div><span>Periode</span><b>${escapeHtml(report.periodeLabel)}</b></div>
        <div><span>Dibuat</span><b>${escapeHtml(dateTimeLabel(report.generatedAt))}</b></div>
        <div><span>Dibuat oleh</span><b>${escapeHtml(report.generatedBy)}</b></div>
        <div><span>Paket</span><b>${escapeHtml(report.plan)}</b></div>
      </div>
    </header>

    <p class="note">Omzet bersih tidak termasuk PPN dan service charge. Penerimaan bruto adalah total uang yang dibayar pelanggan.</p>

    <div class="metrics">
      ${metricCard('Omzet bersih', formatRupiah(s.omzetBersih), 'Tanpa PPN dan service')}
      ${metricCard('Penerimaan bruto', formatRupiah(s.penerimaanBruto), 'Total dibayar pelanggan')}
      ${metricCard('Laba kotor', formatRupiah(s.labaKotor), `${s.marginLaba.toFixed(1)}% dari omzet bersih`)}
      ${metricCard('Transaksi', formatNumber(s.totalTransaksi), `Rata-rata ${formatRupiah(s.rataRataTransaksi)}`)}
      ${metricCard('HPP / modal', formatRupiah(s.totalModal))}
      ${metricCard('PPN', formatRupiah(s.ppn), 'Titipan pajak')}
      ${metricCard('Service charge', formatRupiah(s.serviceCharge))}
      ${metricCard('Total diskon', formatRupiah(s.totalDiskon), `${formatRupiah(s.diskonTransaksi)} transaksi, ${formatRupiah(s.diskonVoucher)} voucher`)}
    </div>

    ${tableHtml(
      'Penjualan per Metode Pembayaran',
      ['Metode', 'Transaksi', 'Total', 'Kontribusi'],
      report.perMetode.map((row) => [
        row.label,
        formatNumber(row.jumlahTransaksi),
        formatRupiah(row.total),
        `${(s.penerimaanBruto > 0 ? (row.total / s.penerimaanBruto) * 100 : 0).toFixed(1)}%`,
      ]),
      'Tidak ada data metode pembayaran.',
      [1, 2, 3],
    )}

    ${tableHtml(
      'Rekap Penjualan per Kasir',
      ['Kasir', 'Transaksi', 'Total', 'Rata-rata'],
      report.perKasir.map((row) => [
        row.label,
        formatNumber(row.jumlahTransaksi),
        formatRupiah(row.total),
        formatRupiah(row.jumlahTransaksi > 0 ? row.total / row.jumlahTransaksi : 0),
      ]),
      'Tidak ada data kasir.',
      [1, 2, 3],
    )}

    ${tableHtml(
      'Rekap Harian',
      ['Tanggal', 'Transaksi', 'Total', 'Rata-rata'],
      report.harian.map((row) => [
        row.periode,
        formatNumber(row.jumlahTransaksi),
        formatRupiah(row.total),
        formatRupiah(row.jumlahTransaksi > 0 ? row.total / row.jumlahTransaksi : 0),
      ]),
      'Tidak ada data harian.',
      [1, 2, 3],
    )}

    ${tableHtml(
      'Produk Terlaris',
      ['Produk', 'Qty', 'Omzet'],
      report.produkTerlaris.map((row) => [row.nama, formatNumber(row.qty), formatRupiah(row.omzet)]),
      report.hasCompleteRekap ? 'Tidak ada data produk terlaris.' : completeMessage,
      [1, 2],
    )}

    ${tableHtml(
      'Produk Stok Menipis',
      ['Produk', 'Stok', 'Harga Jual'],
      report.stokMenipis.map((row) => [row.nama, formatNumber(row.stok), formatRupiah(row.hargaJual)]),
      report.hasCompleteRekap ? 'Tidak ada produk stok menipis.' : completeMessage,
      [1, 2],
    )}

    ${tableHtml(
      'Daftar Transaksi',
      ['No', 'Nota', 'Tanggal', 'Jam', 'Kasir', 'Metode', 'Total'],
      transaksiRows,
      'Tidak ada transaksi pada periode ini.',
      [0, 6],
    )}

    <footer>
      Dibuat otomatis dari Zona Kasir pada ${escapeHtml(dateTimeLabel(report.generatedAt))}. Gunakan file Excel untuk analisis detail dengan semua sheet laporan.
    </footer>
  </main>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
}

export function exportFinancialReportPdf(input: FinancialReportExportInput, targetWindow?: Window | null) {
  const report = buildReportModel(input);
  const printWindow = targetWindow ?? window.open('', '_blank', 'width=1120,height=800');
  if (!printWindow) {
    throw new Error('Popup diblokir browser. Izinkan popup untuk mengunduh PDF laporan.');
  }
  printWindow.document.open();
  printWindow.document.write(buildPdfHtml(report));
  printWindow.document.close();
}
