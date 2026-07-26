'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Receipt as ReceiptIcon, Wallet, Package, Clock } from 'lucide-react';
import { Card, CardBody, Button, LoadingState, ErrorState, Badge, DataTable, type Column } from '@/components/ui';
import { memberService, getErrorMessage } from '@/services';
import type { MemberDetail, MemberRiwayatItem } from '@/types';
import { formatRupiah, formatDate, formatDateTime } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setDetail(await memberService.getDetail(Number(id))); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return null;

  const { member, rekap, riwayat } = detail;

  const columns: Column<MemberRiwayatItem>[] = [
    { header: 'No. Nota', accessor: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{r.NO_NOTA || `#${r.ID}`}</span> },
    { header: 'Tanggal', accessor: (r) => formatDateTime(`${r.TANGGAL}T${r.JAM || '00:00:00'}`) },
    { header: 'Total', accessor: (r) => formatRupiah(Number(r.TOTAL) || 0) },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS_BAYAR === 'LUNAS' || r.STATUS_BAYAR === 'PAID' ? 'green' : 'amber'}>{r.STATUS_BAYAR || '-'}</Badge> },
  ];

  return (
    <div>
      <Button variant="ghost" onClick={() => router.push('/admin/member')} className="mb-3"><ArrowLeft className="h-4 w-4" /> Kembali</Button>

      <Card className="mb-4"><CardBody>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{member.NAMA}</h2>
              <Badge tone={member.STATUS === 0 ? 'red' : 'green'}>{member.STATUS === 0 ? 'Nonaktif' : 'Aktif'}</Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-500">{member.KODE_MEMBER}</p>
          </div>
          <div className="text-sm text-slate-600">
            <p>{member.NO_HP}</p>
            {member.EMAIL && <p>{member.EMAIL}</p>}
            {member.ALAMAT && <p className="max-w-xs text-slate-500">{member.ALAMAT}</p>}
            <p className="mt-1 text-xs text-slate-400">Terdaftar {formatDate(member.TANGGAL_DAFTAR)}</p>
          </div>
        </div>
      </CardBody></Card>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardBody className="flex flex-col items-center gap-1 py-4 text-center">
          <ReceiptIcon className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-slate-900">{rekap.jumlah_transaksi}</span>
          <span className="text-xs text-slate-500">Total Transaksi</span>
        </CardBody></Card>
        <Card><CardBody className="flex flex-col items-center gap-1 py-4 text-center">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-slate-900">{formatRupiah(rekap.total_nilai)}</span>
          <span className="text-xs text-slate-500">Total Nilai Transaksi</span>
        </CardBody></Card>
        <Card><CardBody className="flex flex-col items-center gap-1 py-4 text-center">
          <Package className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-slate-900">{rekap.jumlah_item}</span>
          <span className="text-xs text-slate-500">Jumlah Item Dibeli</span>
        </CardBody></Card>
        <Card><CardBody className="flex flex-col items-center gap-1 py-4 text-center">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-slate-900">{rekap.transaksi_terakhir ? formatDate(rekap.transaksi_terakhir) : '-'}</span>
          <span className="text-xs text-slate-500">Transaksi Terakhir</span>
        </CardBody></Card>
      </div>

      <Card><CardBody>
        <h3 className="mb-3 text-sm font-bold text-slate-800">Riwayat Transaksi</h3>
        <DataTable columns={columns} data={riwayat} rowKey={(r) => r.ID} emptyTitle="Belum ada transaksi" showRowNumber />
      </CardBody></Card>
    </div>
  );
}
