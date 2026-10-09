'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, FilterDate, LoadingState, UpgradeModal } from '@/components/ui';
import { laporanService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { LaporanPenjualan, LaporanPendapatan, RekapLaporan, PlanType } from '@/types';
import { formatRupiah, todayISO } from '@/utils/format';
import { exportFinancialReportExcel, exportFinancialReportPdf } from '@/utils/financialReportExport';
import { usePageLoading } from '@/hooks/usePageLoading';
import { cn } from '@/utils/cn';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const [pj, pd] = await Promise.all([
        laporanService.penjualanPage(awal, akhir, 'all', 1, 1, 1),
        laporanService.pendapatan(awal, akhir, 1),
      ]);
      setPenjualan(pj.data); setPendapatan(pd);
      // Rekap lengkap hanya untuk PRO/BUSINESS (FREE -> backend 403, diabaikan).
      if (isPro) {
        try { setRekap(await laporanService.rekap({ tanggal_awal: awal, tanggal_akhir: akhir, status: 1, top_limit: 20 })); }
        catch { setRekap(null); }
      } else { setRekap(null); }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (awal && akhir && awal <= akhir) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awal, akhir]);

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

  const rp = formatRupiah;
  const omzet = Number(pendapatan?.omzet ?? penjualan?.omzet ?? 0);
  const modal = Number(pendapatan?.modal ?? 0);
  const laba = Number(pendapatan?.laba ?? 0);
  const ppn = Number(penjualan?.total_ppn ?? 0);
  const service = Number(penjualan?.total_service ?? 0);
  const margin = omzet > 0 ? (laba / omzet) * 100 : 0;

  return (
    <div>
      <PageHeader title="Laporan Keuangan" description="Ringkasan omzet, laba, dan penjualan per periode" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
        <div className="relative">
          <Button variant="outline" onClick={() => setMenuOpen((o) => !o)} loading={!!exporting} disabled={!penjualan || !pendapatan}>
            <Download className="h-4 w-4" /> Ekspor <ChevronDown className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-brand-50" onClick={() => { setMenuOpen(false); handleExportPdf(); }}>
                <FileText className="h-4 w-4" /> Ekspor PDF
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-brand-50" onClick={() => { setMenuOpen(false); handleExportExcel(); }}>
                <FileSpreadsheet className="h-4 w-4" /> Ekspor Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingState />}

      {!loading && penjualan && pendapatan && (
        <div className="space-y-4">
          <Card><CardBody>
            <p className="text-sm text-slate-500">Omzet periode ini</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">{rp(omzet)}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-400">Transaksi</p><p className="font-bold text-slate-700">{penjualan.jumlah_transaksi}</p></div>
              <div><p className="text-slate-400">Laba kotor</p><p className={cn('font-bold', laba < 0 ? 'text-rose-600' : 'text-slate-700')}>{rp(laba)}</p></div>
              <div><p className="text-slate-400">Margin</p><p className="font-bold text-slate-700">{margin.toFixed(1)}%</p></div>
            </div>
          </CardBody></Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Dari omzet ke laba" note="Laba kotor = omzet bersih dikurangi modal barang terjual.">
              <Row label="Omzet bersih" value={rp(omzet)} />
              <Row label="Modal (HPP)" value={`− ${rp(modal)}`} />
              <Row label="Laba kotor" value={rp(laba)} total danger={laba < 0} />
            </Section>
            <Section title="Uang diterima" note="PPN disetor ke negara, bukan pendapatan toko.">
              <Row label="Omzet bersih" value={rp(omzet)} />
              <Row label="PPN" value={`+ ${rp(ppn)}`} />
              <Row label="Service charge" value={`+ ${rp(service)}`} />
              <Row label="Total diterima" value={rp(omzet + ppn + service)} total />
            </Section>
          </div>

          {!isPro ? (
            <Card><CardBody>
              <p className="text-sm text-slate-500">Rekap per metode bayar, per kasir, produk terlaris, dan stok menipis tersedia di paket PRO dan BUSINESS.</p>
            </CardBody></Card>
          ) : rekap && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="Penjualan per metode bayar">
                  <Share rows={rekap.per_metode_bayar.map((m) => ({ key: m.metode, nama: m.metode, n: m.jumlah_transaksi, total: m.total }))} empty="Belum ada pembayaran di periode ini." />
                </Section>
                <Section title="Penjualan per kasir">
                  <Share rows={rekap.per_kasir.map((k) => ({ key: String(k.id_user ?? k.kasir), nama: k.kasir, n: k.jumlah_transaksi, total: k.total }))} empty="Belum ada penjualan di periode ini." />
                </Section>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section title="Produk terlaris" note="Urut berdasarkan jumlah terjual.">
                  {rekap.produk_terlaris.length === 0 && <p className="text-sm text-slate-400">Belum ada produk terjual di periode ini.</p>}
                  {[...rekap.produk_terlaris].sort((a, b) => b.qty - a.qty).map((p, i) => (
                    <div key={p.id_produk} className="flex items-center gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
                      <span className="w-5 text-slate-400">{i + 1}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-700">{p.nama}</span><span className="text-xs text-slate-400">{rp(p.omzet)}</span></span>
                      <span className="text-slate-500">{p.qty} terjual</span>
                    </div>
                  ))}
                </Section>
                <Section title="Perlu restock">
                  {rekap.produk_stok_menipis.length === 0 && <p className="text-sm text-slate-400">Semua stok di atas batas minimum.</p>}
                  {rekap.produk_stok_menipis.map((p) => (
                    <div key={p.id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                      <span className="text-slate-700">{p.nama}</span>
                      {p.stok <= 0 ? <span className="font-semibold text-rose-600">Habis</span> : <span className="font-semibold text-orange-500">Sisa {p.stok}</span>}
                    </div>
                  ))}
                </Section>
              </div>
            </>
          )}
        </div>
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

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Card><CardBody>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {note && <p className="mb-2 text-xs text-slate-400">{note}</p>}
      <div className={note ? '' : 'mt-2'}>{children}</div>
    </CardBody></Card>
  );
}

function Row({ label, value, total, danger }: { label: string; value: string; total?: boolean; danger?: boolean }) {
  return (
    <div className={cn('flex justify-between py-1.5 text-sm', total && 'mt-1 border-t border-slate-200 pt-2 font-bold')}>
      <span className="text-slate-600">{label}</span>
      <span className={danger ? 'text-rose-600' : 'text-slate-800'}>{value}</span>
    </div>
  );
}

// Daftar nama + jumlah transaksi + total + persen porsi (bar), urut terbesar.
function Share({ rows, empty }: { rows: { key: string; nama: string; n: number; total: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;
  const sum = rows.reduce((a, r) => a + Number(r.total), 0);
  return (
    <div className="space-y-3">
      {[...rows].sort((a, b) => b.total - a.total).map((r) => {
        const pct = sum > 0 ? (Number(r.total) / sum) * 100 : 0;
        return (
          <div key={r.key} className="text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">{r.nama} <span className="text-slate-400">({r.n}x)</span></span>
              <span className="font-semibold text-slate-800">{formatRupiah(r.total)} <span className="font-normal text-slate-400">· {pct.toFixed(0)}%</span></span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}
