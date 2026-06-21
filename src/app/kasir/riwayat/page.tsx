'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, ReceiptText, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, FilterDate, Badge, SelectMenu, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { penjualanService, jenisBayarService, getErrorMessage } from '@/services';
import type { Penjualan, JenisBayar } from '@/types';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function RiwayatKasirPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Penjualan[]>([]);
  const [jenisBayar, setJenisBayar] = useState<JenisBayar[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const [metode, setMetode] = useState<number>(0); // 0 = semua metode

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setData((await penjualanService.list({ tanggal_awal: awal, tanggal_akhir: akhir, id_user: user.id, status: 1 })) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [user, awal, akhir]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { jenisBayarService.list().then((j) => setJenisBayar(j || [])).catch(() => {}); }, []);

  // Filter metode bayar dilakukan di sisi client atas hasil list.
  const shown = useMemo(
    () => (metode ? data.filter((d) => d.ID_JENIS_BAYAR === metode) : data),
    [data, metode],
  );

  // Rekap: jumlah transaksi, total penjualan, dan rincian per metode bayar.
  const rekap = useMemo(() => {
    const total = shown.reduce((sum, r) => sum + (Number(r.TOTAL) || 0), 0);
    const perMetode = new Map<string, { jumlah: number; total: number }>();
    for (const r of shown) {
      const nama = r.jenisBayar?.NAMA ?? 'Lainnya';
      const cur = perMetode.get(nama) ?? { jumlah: 0, total: 0 };
      cur.jumlah += 1;
      cur.total += Number(r.TOTAL) || 0;
      perMetode.set(nama, cur);
    }
    return { jumlah: shown.length, total, perMetode: Array.from(perMetode.entries()) };
  }, [shown]);

  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">#{String(r.ID).padStart(6, '0')}</span> },
    { header: 'Tanggal', accessor: (r) => formatDate(r.TANGGAL) },
    { header: 'Jam', accessor: (r) => r.JAM },
    { header: 'Metode', accessor: (r) => <Badge tone="blue">{r.jenisBayar?.NAMA ?? '-'}</Badge> },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS === 1 ? 'green' : 'red'}>{r.STATUS === 1 ? 'Sah' : 'Batal'}</Badge> },
    { header: 'Aksi', accessor: (r) => <Link href={`/kasir/riwayat/${r.ID}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link> },
  ];

  return (
    <div>
      <PageHeader title="Riwayat Transaksi" description="Transaksi yang Anda proses" />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
          <div className="w-full sm:w-52">
            <SelectMenu
              label="Metode bayar"
              value={metode}
              onChange={(v) => setMetode(Number(v))}
              options={[{ value: 0, label: 'Semua metode' }, ...jenisBayar.map((j) => ({ value: j.ID, label: j.NAMA }))]}
            />
          </div>
          <Button onClick={load}>Terapkan</Button>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={shown} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada transaksi" showRowNumber />
      </CardBody></Card>

      {/* Rekap total untuk memudahkan kasir merekap penjualan */}
      {!loading && shown.length > 0 && (
        <Card className="mt-4"><CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-600"><ReceiptText className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-slate-500">Jumlah transaksi</p>
                <p className="text-lg font-semibold text-slate-800">{rekap.jumlah}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600"><Wallet className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-slate-500">Total penjualan</p>
                <p className="text-lg font-semibold text-emerald-700">{formatRupiah(rekap.total)}</p>
              </div>
            </div>
          </div>

          {rekap.perMetode.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Rincian per metode</p>
              <div className="divide-y divide-slate-100 rounded-xl border border-line">
                {rekap.perMetode.map(([nama, v]) => (
                  <div key={nama} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Badge tone="blue">{nama}</Badge>
                      <span className="text-slate-400">{v.jumlah} transaksi</span>
                    </span>
                    <span className="font-semibold text-slate-800">{formatRupiah(v.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody></Card>
      )}
    </div>
  );
}
