'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Boxes, Receipt, BarChart3, Users, LayoutDashboard,
  Wallet, ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import {
  Card, CardBody, Button, DataTable, Badge, LoadingState, FilterDate, type Column,
} from '@/components/ui';
import { merchantService, getErrorMessage } from '@/services';
import type { Merchant, Produk, Pengguna, Penjualan, LaporanPendapatan } from '@/types';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { cn } from '@/utils/cn';
import { usePageLoading } from '@/hooks/usePageLoading';

type Tab = 'ringkasan' | 'produk' | 'stok' | 'penjualan' | 'laporan' | 'pengguna';
const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'produk', label: 'Produk', icon: Package },
  { key: 'stok', label: 'Stok', icon: Boxes },
  { key: 'penjualan', label: 'Penjualan', icon: Receipt },
  { key: 'laporan', label: 'Laporan', icon: BarChart3 },
  { key: 'pengguna', label: 'Pengguna', icon: Users },
];

const statusTone = (s?: string) => (s === 'active' ? 'green' : s === 'suspended' ? 'red' : 'amber');
const levelLabel = (l: number) => (l === 0 ? 'Super Admin' : l === 1 ? 'Admin' : 'Kasir');

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mid = Number(id);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('ringkasan');
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    merchantService.getById(mid).then(setMerchant).catch((e) => toast.error(getErrorMessage(e)));
  }, [mid]);

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Kembali</Button>
      </div>

      <PageHeader
        title={merchant?.NAMA || 'Detail Merchant'}
        description={merchant ? `${merchant.OWNER_NAME ?? '-'} · ${merchant.CITY ?? '-'}` : 'Memuat...'}
      />

      {merchant && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Badge tone={statusTone(merchant.STATUS)}>{merchant.STATUS}</Badge>
          <span>· {merchant.EMAIL ?? '-'}</span>
          <span>· {merchant.PHONE ?? '-'}</span>
          {merchant.INVOICE_PREFIX && <span>· Nota: {merchant.INVOICE_PREFIX}-xxxxxx</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700',
              )}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'ringkasan' && <RingkasanTab id={mid} />}
      {tab === 'produk' && <ProdukTab id={mid} />}
      {tab === 'stok' && <StokTab id={mid} />}
      {tab === 'penjualan' && <PenjualanTab id={mid} />}
      {tab === 'laporan' && <LaporanTab id={mid} />}
      {tab === 'pengguna' && <PenggunaTab id={mid} />}
    </div>
  );
}

function RingkasanTab({ id }: { id: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof merchantService.monitorDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  useEffect(() => {
    setLoading(true);
    merchantService.monitorDashboard(id).then(setData).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <LoadingState />;
  const s = data?.summary;
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Transaksi hari ini" value={s?.transaksi_hari_ini ?? 0} icon={ShoppingCart} tone="brand" />
        <StatCard label="Pendapatan hari ini" value={formatRupiah(s?.pendapatan_hari_ini ?? 0)} icon={Wallet} tone="green" />
        <StatCard label="Total produk" value={s?.total_produk ?? 0} icon={Package} tone="amber" />
        <StatCard label="Total pengguna" value={s?.total_pengguna ?? 0} icon={Users} tone="brand" />
      </div>
      <Card><CardBody>
        <h3 className="mb-3 font-semibold text-slate-800">Stok menipis</h3>
        {s?.stok_menipis?.length ? (
          <div className="divide-y divide-slate-100">
            {s.stok_menipis.map((p) => (
              <div key={p.ID} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{p.NAMA}</span>
                <Badge tone={p.STOK <= 5 ? 'red' : 'amber'}>{p.STOK}</Badge>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400">Tidak ada produk yang menipis.</p>}
      </CardBody></Card>
    </div>
  );
}

function ProdukTab({ id }: { id: number }) {
  const [data, setData] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  useEffect(() => {
    setLoading(true);
    merchantService.monitorProduk(id).then((d) => setData(d || [])).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id]);
  const columns: Column<Produk>[] = [
    { header: 'Produk', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Kategori', accessor: (r) => r.kategori?.DESKRIPSI ?? '-' },
    { header: 'Stok', accessor: (r) => <Badge tone={r.STOK <= 10 ? 'amber' : 'slate'}>{r.STOK}</Badge> },
    { header: 'Harga beli', accessor: (r) => formatRupiah(r.HARGA_BELI) },
    { header: 'Harga jual', accessor: (r) => <span className="font-medium">{formatRupiah(r.HARGA_JUAL)}</span> },
  ];
  return <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada produk" /></CardBody></Card>;
}

function StokTab({ id }: { id: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof merchantService.monitorStok>> | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  useEffect(() => {
    setLoading(true);
    merchantService.monitorStok(id).then(setData).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <LoadingState />;
  const columns: Column<Produk>[] = [
    { header: 'Produk', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Stok', accessor: (r) => <Badge tone={r.STOK <= 10 ? 'amber' : 'slate'}>{r.STOK}</Badge> },
    { header: 'Nilai (stok×beli)', accessor: (r) => formatRupiah(r.STOK * r.HARGA_BELI) },
  ];
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Jumlah produk" value={data?.jumlah_produk ?? 0} icon={Package} tone="brand" />
        <StatCard label="Nilai stok" value={formatRupiah(data?.nilai_stok ?? 0)} icon={Boxes} tone="green" />
      </div>
      <Card><CardBody><DataTable columns={columns} data={(data?.data as Produk[]) || []} loading={loading} rowKey={(r) => r.ID} emptyTitle="Tidak ada data stok" /></CardBody></Card>
    </div>
  );
}

function PenjualanTab({ id }: { id: number }) {
  const [data, setData] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const load = useCallback(() => {
    setLoading(true);
    merchantService.monitorPenjualan(id, { tanggal_awal: awal, tanggal_akhir: akhir, status: 1 })
      .then((d) => setData(d || [])).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id, awal, akhir]);
  useEffect(() => { load(); }, [load]);
  const total = data.reduce((s, r) => s + (Number(r.TOTAL) || 0), 0);
  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">{nomorNotaPenjualanLabel(r)}</span> },
    { header: 'Tanggal', accessor: (r) => formatDate(r.TANGGAL) },
    { header: 'Kasir', accessor: (r) => r.kasir?.NAMA ?? '-' },
    { header: 'Metode', accessor: (r) => <Badge tone="blue">{r.jenisBayar?.NAMA ?? '-'}</Badge> },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
  ];
  return (
    <div>
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
          <Button onClick={load}>Terapkan</Button>
        </div>
      </CardBody></Card>
      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Tidak ada transaksi" />
        {!loading && data.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm dark:bg-emerald-500/15">
            <span className="text-slate-600">{data.length} transaksi</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Total: {formatRupiah(total)}</span>
          </div>
        )}
      </CardBody></Card>
    </div>
  );
}

function LaporanTab({ id }: { id: number }) {
  const [data, setData] = useState<LaporanPendapatan | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const load = useCallback(() => {
    setLoading(true);
    merchantService.monitorLaporanPendapatan(id, { tanggal_awal: awal, tanggal_akhir: akhir })
      .then(setData).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id, awal, akhir]);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
          <Button onClick={load}>Terapkan</Button>
        </div>
      </CardBody></Card>
      {loading ? <LoadingState /> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Omzet" value={formatRupiah(data?.omzet ?? 0)} icon={Wallet} tone="brand" />
          <StatCard label="Modal" value={formatRupiah(data?.modal ?? 0)} icon={ShoppingCart} tone="amber" />
          <StatCard label="Laba" value={formatRupiah(data?.laba ?? 0)} icon={BarChart3} tone="green" />
        </div>
      )}
    </div>
  );
}

function PenggunaTab({ id }: { id: number }) {
  const [data, setData] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  useEffect(() => {
    setLoading(true);
    merchantService.monitorPengguna(id).then((d) => setData(d || [])).catch((e) => toast.error(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id]);
  const columns: Column<Pengguna>[] = [
    { header: 'Nama', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Username', accessor: (r) => r.USERNAME },
    { header: 'Role', accessor: (r) => <Badge tone={r.LEVEL === 1 ? 'blue' : 'slate'}>{levelLabel(r.LEVEL)}</Badge> },
    { header: 'Telp', accessor: (r) => r.TELP ?? '-' },
  ];
  return <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada pengguna" /></CardBody></Card>;
}
