'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, LoadingState, ErrorState, Badge } from '@/components/ui';
import { Receipt } from '@/components/pos/Receipt';
import { penjualanService, getErrorMessage } from '@/services';
import type { Penjualan } from '@/types';
import { formatRupiah, formatDate } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/stores/authStore';
import type { PlanType } from '@/types';

export default function DetailRiwayatPage() {
  const user = useAuthStore((s) => s.user);
  const plan = (user?.merchant?.plan as PlanType) || 'FREE';
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trx, setTrx] = useState<Penjualan | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setTrx(await penjualanService.getById(Number(id))); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!trx) return null;

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Cetak</Button>
      </div>
      <Card><CardBody>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Nota #{String(trx.ID).padStart(6, '0')}</h2>
          <Badge tone={trx.STATUS === 1 ? 'green' : 'red'}>{trx.STATUS === 1 ? 'Sah' : 'Batal'}</Badge>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{formatDate(trx.TANGGAL)} {trx.JAM} &middot; {trx.jenisBayar?.NAMA}</span>
          <Badge tone="green">{trx.STATUS_BAYAR || 'LUNAS'}</Badge>
        </div>
        <div id="print-area" className="rounded-lg border border-dashed border-slate-200">
          <Receipt ref={printRef} trx={trx} namaToko={user?.merchant?.nama} plan={plan} />
        </div>
        <p className="mt-3 text-right text-lg font-bold text-brand-600">Total: {formatRupiah(trx.TOTAL)}</p>
      </CardBody></Card>
    </div>
  );
}
