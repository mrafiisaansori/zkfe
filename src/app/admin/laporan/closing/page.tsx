'use client';
import { useCallback, useEffect, useState } from 'react';
import { Wallet, Banknote, CreditCard, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, Input, DataTable, Badge, type Column } from '@/components/ui';
import { kasShiftService, getErrorMessage } from '@/services';
import { formatRupiah, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';
import type { DailyReport, DailyReportRow } from '@/types';

function fmtJam(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Tampilkan selisih dengan label jelas: Pas / Kurang / Lebih + warna.
function selisihCell(v: number | null) {
  if (v === null) return <span className="text-xs text-slate-400">—</span>;
  if (v === 0) return <Badge tone="green">Pas</Badge>;
  const kurang = v < 0;
  return (
    <span className={`font-semibold ${kurang ? 'text-rose-600' : 'text-amber-600'}`}>
      {kurang ? 'Kurang ' : 'Lebih '}{formatRupiah(Math.abs(v))}
    </span>
  );
}

// Ringkas total selisih jadi kalimat yang mudah dipahami.
function selisihText(v: number) {
  if (v === 0) return 'Pas (Rp 0)';
  return v < 0 ? `Kurang ${formatRupiah(Math.abs(v))}` : `Lebih ${formatRupiah(Math.abs(v))}`;
}

export default function LaporanClosingPage() {
  const [tanggal, setTanggal] = useState(todayISO());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  usePageLoading(loading);

  const load = useCallback(async (tgl: string) => {
    setLoading(true);
    try { setReport(await kasShiftService.reportDaily(tgl)); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tanggal); }, [tanggal, load]);

  const r = report?.ringkasan;

  const columns: Column<DailyReportRow>[] = [
    {
      header: 'Kasir',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.kasir || '-'}</span>
          <span className="block text-xs text-slate-400">{row.station || 'Tanpa laci'} · {fmtJam(row.buka_at)}–{row.status === 'OPEN' ? 'kini' : fmtJam(row.tutup_at)}</span>
        </div>
      ),
    },
    { header: 'Modal Awal', accessor: (row) => <span className="text-slate-600">{formatRupiah(row.modal_awal)}</span> },
    { header: 'Penjualan Tunai', accessor: (row) => formatRupiah(row.cash_sales) },
    { header: 'Non-Tunai', accessor: (row) => (row.non_cash_sales > 0 ? formatRupiah(row.non_cash_sales) : <span className="text-slate-400">—</span>) },
    { header: 'Uang Seharusnya', accessor: (row) => <span className="font-semibold text-slate-800">{formatRupiah(row.expected_cash)}</span> },
    { header: 'Uang Dihitung', accessor: (row) => (row.actual_cash === null ? <span className="text-xs text-slate-400">—</span> : <span className="font-semibold text-slate-800">{formatRupiah(row.actual_cash)}</span>) },
    { header: 'Selisih', accessor: (row) => selisihCell(row.selisih_cash) },
    { header: 'Status', accessor: (row) => (row.status === 'OPEN' ? <Badge tone="amber" dot>BUKA</Badge> : <Badge tone="green" dot>SELESAI</Badge>) },
  ];

  return (
    <div>
      <PageHeader
        title="Laporan Closing Kasir"
        description="Rekap sesi kas seluruh kasir per hari beserta selisihnya."
      />

      <div className="mb-4 max-w-xs">
        <Input type="date" label="Tanggal" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Penjualan Tunai" value={formatRupiah(r?.total_cash_sales ?? 0)} icon={Banknote} tone="green" />
        <StatCard label="Total Non-Tunai" value={formatRupiah(r?.total_non_cash_sales ?? 0)} icon={CreditCard} tone="brand" />
        <StatCard label="Total Omzet" value={formatRupiah(r?.total_omzet ?? 0)} icon={Wallet} tone="brand" />
        <StatCard
          label="Selisih Kas Hari Ini"
          value={selisihText(r?.total_selisih_cash ?? 0)}
          icon={Scale}
          tone={(r?.total_selisih_cash ?? 0) === 0 ? 'green' : (r?.total_selisih_cash ?? 0) < 0 ? 'red' : 'amber'}
        />
      </div>

      <Card>
        <CardBody>
          <div className="mb-3 flex flex-col gap-1">
            <p className="text-sm text-slate-500">
              {report ? `${report.jumlah_shift} sesi kasir pada tanggal ini.` : 'Memuat...'}
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <b className="text-slate-600">Cara baca:</b> Uang Seharusnya = Modal Awal + Penjualan Tunai (uang yang mestinya ada di laci).
              Selisih = Uang Dihitung − Uang Seharusnya. <span className="text-emerald-600 font-semibold">Pas</span> berarti cocok,
              <span className="text-rose-600 font-semibold"> Kurang</span> berarti uang fisik lebih sedikit,
              <span className="text-amber-600 font-semibold"> Lebih</span> berarti uang fisik berlebih.
            </p>
          </div>
          <DataTable
            columns={columns}
            data={report?.shift || []}
            loading={loading}
            rowKey={(row) => row.id_shift}
            showRowNumber
            emptyTitle="Belum ada sesi kas pada tanggal ini"
          />
        </CardBody>
      </Card>
    </div>
  );
}
