'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, LoadingState, ErrorState, Badge } from '@/components/ui';
import { Receipt, type ReceiptSize } from '@/components/pos/Receipt';
import { penjualanService, identitasService, getErrorMessage } from '@/services';
import type { Penjualan, Identitas } from '@/types';
import { formatRupiah, formatDate } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/stores/authStore';
import type { PlanType } from '@/types';
import { cn } from '@/utils/cn';
import { printReceipt } from '@/utils/printThermal';
import { buildReceiptEscPos } from '@/utils/escpos';

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
  const [receiptSize, setReceiptSize] = useState<ReceiptSize>('58');
  const [identitas, setIdentitas] = useState<Identitas | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setTrx(await penjualanService.getById(Number(id))); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { identitasService.get().then((it) => setIdentitas(it || null)).catch(() => {}); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!trx) return null;

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
            {(['58', '80'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setReceiptSize(s)}
                className={cn('rounded-md px-2.5 py-1 text-xs font-bold transition-colors',
                  receiptSize === s ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100')}
              >{s}mm</button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              const bytes = await buildReceiptEscPos({
                trx,
                namaToko: identitas?.NAMA || user?.merchant?.nama,
                alamatToko: identitas?.ALAMAT || undefined,
                logoUrl: identitas?.LOGO_URL,
                plan,
                size: receiptSize,
              });
              printReceipt(printRef.current, receiptSize, bytes);
            }}
          >
            <Printer className="h-4 w-4" /> Cetak
          </Button>
        </div>
      </div>
      <Card><CardBody>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Nota {nomorNotaPenjualanLabel(trx)}</h2>
          <Badge tone={trx.STATUS === 1 ? 'green' : 'red'}>{trx.STATUS === 1 ? 'Sah' : 'Batal'}</Badge>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{formatDate(trx.TANGGAL)}, {trx.JAM?.slice(0, 5)} &middot; {trx.jenisBayar?.NAMA}</span>
          <Badge tone="green">{trx.STATUS_BAYAR || 'LUNAS'}</Badge>
        </div>
        {trx.open_bill && (
          <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 dark:bg-accent/15 dark:text-accent">
            Dari Open Bill {trx.open_bill.no_bill} · Dibuka oleh {trx.open_bill.dibuka_oleh ?? '-'}
          </p>
        )}
        <div id="print-area" className="rounded-lg border border-dashed border-slate-200">
          <Receipt
            ref={printRef}
            trx={trx}
            namaToko={identitas?.NAMA || user?.merchant?.nama}
            alamatToko={identitas?.ALAMAT || undefined}
            logoUrl={identitas?.LOGO_URL}
            plan={plan}
            size={receiptSize}
          />
        </div>
        <p className="mt-3 text-right text-lg font-bold text-brand-600 dark:text-accent">Total: {formatRupiah(trx.TOTAL)}</p>
      </CardBody></Card>
    </div>
  );
}
