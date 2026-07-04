'use client';
import { useState } from 'react';
import { FileSpreadsheet, FileText, Search, TrendingUp, Wallet, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, Button, FilterDate, DataTable, LoadingState, Pagination, UpgradeModal, type Column } from '@/components/ui';
import { laporanService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { LaporanPenjualan, LaporanPendapatan, Penjualan, RekapLaporan, PlanType } from '@/types';
import type { PaginationMeta } from '@/services/api';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { exportFinancialReportExcel, exportFinancialReportPdf } from '@/utils/financialReportExport';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { usePageLoading } from '@/hooks/usePageLoading';

const PDF_LOADING_HTML = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Menyiapkan laporan...</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 32px; color: #0f172a;">
  <h1 style="font-size: 20px; margin: 0 0 8px;">Menyiapkan laporan PDF</h1>
  <p style="margin: 0; color: #64748b;">Mohon tunggu, data laporan sedang dimuat.</p>
</body>
</html>`;

export default function LaporanPage() {
  const user = useAuthStore((s) => s.user);
  const plan = (user?.merchant?.plan as PlanType) || 'FREE';
  const isPro = plan === 'PRO' || plan === 'BUSINESS'; // BUSINESS = superset PRO
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);
  const [penjualan, setPenjualan] = useState<LaporanPenjualan | null>(null);
  const [pendapatan, setPendapatan] = useState<LaporanPendapatan | null>(null);
  const [rekap, setRekap] = useState<RekapLaporan | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function run(pageNo = page) {
    setLoading(true);
    try {
      const [pj, pd] = await Promise.all([
        laporanService.penjualanPage(awal, akhir, 'all', 1, pageNo, 25),
        laporanService.pendapatan(awal, akhir, 1),
      ]);
      setPenjualan(pj.data); setMeta(pj.meta); setPendapatan(pd);
      // Rekap lengkap hanya untuk PRO/BUSINESS (FREE -> backend 403, diabaikan).
      if (isPro) {
        try { setRekap(await laporanService.rekap({ tanggal_awal: awal, tanggal_akhir: akhir, status: 1, top_limit: 20 })); }
        catch { setRekap(null); }
      } else { setRekap(null); }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  async function loadExportData() {
    const [fullPenjualan, fullPendapatan] = await Promise.all([
      laporanService.penjualan(awal, akhir, 'all', 1),
      laporanService.pendapatan(awal, akhir, 1),
    ]);
    let fullRekap: RekapLaporan | null = rekap;
    if (isPro) {
      try {
        fullRekap = await laporanService.rekap({ tanggal_awal: awal, tanggal_akhir: akhir, status: 1, top_limit: 20 });
      } catch {
        fullRekap = null;
      }
    }
    return { fullPenjualan, fullPendapatan, fullRekap };
  }

  async function handleExportExcel() {
    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }
    setExporting('excel');
    try {
      const { fullPenjualan, fullPendapatan, fullRekap } = await loadExportData();
      exportFinancialReportExcel({
        merchantName: user?.merchant?.nama,
        generatedBy: user?.nama,
        plan,
        tanggalAwal: awal,
        tanggalAkhir: akhir,
        penjualan: fullPenjualan,
        pendapatan: fullPendapatan,
        rekap: fullRekap,
      });
      toast.success('Laporan Excel berhasil dibuat');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }
    setExporting('pdf');
    const pdfWindow = window.open('', '_blank', 'width=1120,height=800');
    if (!pdfWindow) {
      toast.error('Popup diblokir browser. Izinkan popup untuk mengunduh PDF laporan.');
      setExporting(null);
      return;
    }
    pdfWindow.document.open();
    pdfWindow.document.write(PDF_LOADING_HTML);
    pdfWindow.document.close();
    try {
      const { fullPenjualan, fullPendapatan, fullRekap } = await loadExportData();
      exportFinancialReportPdf({
        merchantName: user?.merchant?.nama,
        generatedBy: user?.nama,
        plan,
        tanggalAwal: awal,
        tanggalAkhir: akhir,
        penjualan: fullPenjualan,
        pendapatan: fullPendapatan,
        rekap: fullRekap,
      }, pdfWindow);
      toast.success('Tampilan PDF dibuka. Pilih Save as PDF di dialog cetak.');
    } catch (err) {
      pdfWindow.close();
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">{nomorNotaPenjualanLabel(r)}</span> },
    { header: 'Tanggal', accessor: (r) => formatDate(r.TANGGAL) },
    { header: 'Kasir', accessor: (r) => r.kasir?.NAMA ?? '-' },
    { header: 'Metode', accessor: (r) => r.jenisBayar?.NAMA ?? '-' },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Laporan Penjualan" description="Rekap omzet, transaksi, dan laba per periode" />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <FilterDate
            awal={awal}
            akhir={akhir}
            onAwal={(v) => { setAwal(v); setPage(1); }}
            onAkhir={(v) => { setAkhir(v); setPage(1); }}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setPage(1); run(1); }} loading={loading}><Search className="h-4 w-4" /> Tampilkan</Button>
            {penjualan && pendapatan && (
              <>
                <Button variant="outline" onClick={handleExportExcel} loading={exporting === 'excel'}>
                  <FileSpreadsheet className="h-4 w-4" /> Export Excel
                </Button>
                <Button variant="outline" onClick={handleExportPdf} loading={exporting === 'pdf'}>
                  <FileText className="h-4 w-4" /> Export PDF
                </Button>
              </>
            )}
          </div>
        </div>
        {!isPro && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Rekapitulasi laporan lengkap (laba kotor, per metode bayar, per kasir, produk terlaris, rekap harian/bulanan, export)
            tersedia di paket <b>PRO</b> dan <b>BUSINESS</b>.
          </p>
        )}
      </CardBody></Card>

      {loading && <LoadingState />}

      {!loading && pendapatan && penjualan && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Omzet (bersih, tanpa PPN)" value={formatRupiah(penjualan.omzet)} icon={Wallet} tone="green" />
            <StatCard label="Jumlah transaksi" value={penjualan.jumlah_transaksi} icon={Receipt} tone="brand" />
            <StatCard label="PPN terkumpul" value={formatRupiah(penjualan.total_ppn)} icon={Receipt} tone="amber" />
            <StatCard label="Laba kotor" value={formatRupiah(pendapatan.laba)} icon={TrendingUp} tone="green" />
          </div>
          <Card className="mb-4"><CardBody>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-slate-400">Modal (HPP)</p><p className="font-bold text-slate-700">{formatRupiah(pendapatan.modal)}</p></div>
              <div><p className="text-slate-400">Service charge</p><p className="font-bold text-slate-700">{formatRupiah(penjualan.total_service)}</p></div>
              <div><p className="text-slate-400">PPN (titipan pajak)</p><p className="font-bold text-slate-700">{formatRupiah(penjualan.total_ppn)}</p></div>
              <div><p className="text-slate-400">Total diterima (bruto)</p><p className="font-bold text-slate-700">{formatRupiah(penjualan.total_dibayar)}</p></div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Omzet = penjualan bersih tanpa PPN &amp; service. PPN bukan pendapatan — disetor ke negara.</p>
          </CardBody></Card>
          <Card><CardBody>
            <DataTable columns={columns} data={penjualan.data} rowKey={(r) => r.ID} emptyTitle="Tidak ada penjualan" showRowNumber startIndex={(page - 1) * 25} />
            <Pagination page={page} totalPages={meta?.total_pages ?? 1} onChange={(p) => { setPage(p); run(p); }} />
          </CardBody></Card>

          {/* ===== Rekap lengkap (PRO/BUSINESS) ===== */}
          {isPro && rekap && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card><CardBody>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Penjualan per metode pembayaran</h3>
                <div className="space-y-1.5 text-sm">
                  {rekap.per_metode_bayar.length === 0 && <p className="text-slate-400">Tidak ada data.</p>}
                  {rekap.per_metode_bayar.map((m) => (
                    <div key={m.metode} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-600">{m.metode} <span className="text-slate-400">({m.jumlah_transaksi}x)</span></span>
                      <span className="font-semibold text-slate-700">{formatRupiah(m.total)}</span>
                    </div>
                  ))}
                </div>
              </CardBody></Card>

              <Card><CardBody>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Rekap penjualan per kasir</h3>
                <div className="space-y-1.5 text-sm">
                  {rekap.per_kasir.length === 0 && <p className="text-slate-400">Tidak ada data.</p>}
                  {rekap.per_kasir.map((k) => (
                    <div key={k.kasir} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-600">{k.kasir} <span className="text-slate-400">({k.jumlah_transaksi}x)</span></span>
                      <span className="font-semibold text-slate-700">{formatRupiah(k.total)}</span>
                    </div>
                  ))}
                </div>
              </CardBody></Card>

              <Card><CardBody>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Produk terlaris</h3>
                <div className="space-y-1.5 text-sm">
                  {rekap.produk_terlaris.length === 0 && <p className="text-slate-400">Tidak ada data.</p>}
                  {rekap.produk_terlaris.map((p) => (
                    <div key={p.id_produk} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-600">{p.nama} <span className="text-slate-400">({p.qty})</span></span>
                      <span className="font-semibold text-slate-700">{formatRupiah(p.omzet)}</span>
                    </div>
                  ))}
                </div>
              </CardBody></Card>

              <Card><CardBody>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Produk stok menipis</h3>
                <div className="space-y-1.5 text-sm">
                  {rekap.produk_stok_menipis.length === 0 && <p className="text-slate-400">Stok aman.</p>}
                  {rekap.produk_stok_menipis.map((p) => (
                    <div key={p.id} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-600">{p.nama}</span>
                      <span className="font-semibold text-rose-600">sisa {p.stok}</span>
                    </div>
                  ))}
                </div>
              </CardBody></Card>
            </div>
          )}
        </>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Export laporan tersedia di PRO"
        description="Paket FREE tetap bisa melihat laporan penjualan di layar. Download laporan Excel dan PDF hanya tersedia untuk paket PRO atau BUSINESS."
        benefits={['Download laporan Excel (.xlsx)', 'Download laporan PDF siap cetak', 'Rekap laporan lengkap untuk analisis bisnis']}
      />
    </div>
  );
}
