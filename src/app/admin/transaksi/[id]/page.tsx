'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, LoadingState, ErrorState, Badge } from '@/components/ui';
import { Receipt, type ReceiptSize } from '@/components/pos/Receipt';
import { penjualanService, getErrorMessage } from '@/services';
import type { Penjualan } from '@/types';
import { formatRupiah, formatDate } from '@/utils/format';
import { nomorNotaPenjualanLabel } from '@/utils/nomorNota';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/stores/authStore';
import type { PlanType } from '@/types';
import { cn } from '@/utils/cn';
import { printReceipt } from '@/utils/printThermal';
import { buildReceiptEscPos } from '@/utils/escpos';

export default function DetailTransaksiPage() {
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
    <div>
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
            onClick={() => {
              const bytes = buildReceiptEscPos({ trx, namaToko: user?.merchant?.nama, plan, size: receiptSize });
              printReceipt(printRef.current, receiptSize, bytes);
            }}
          >
            <Printer className="h-4 w-4" /> Cetak struk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardBody>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Nota {nomorNotaPenjualanLabel(trx)}</h2>
              <p className="text-sm text-slate-500">{formatDate(trx.TANGGAL)}, {trx.JAM?.slice(0, 5)}</p>
            </div>
            <Badge tone={trx.STATUS === 1 ? 'green' : 'red'}>{trx.STATUS === 1 ? 'Sah' : 'Batal'}</Badge>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-400">Kasir (membayar)</p><p className="font-medium">{trx.kasir?.NAMA ?? '-'}</p></div>
            <div><p className="text-slate-400">Metode bayar</p><p className="font-medium">{trx.jenisBayar?.NAMA ?? '-'}</p></div>
            <div>
              <p className="text-slate-400">Status bayar</p>
              <Badge tone="green">{trx.STATUS_BAYAR || 'LUNAS'}</Badge>
            </div>
          </div>
          {trx.open_bill && (
            <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 dark:bg-accent/15 dark:text-accent">
              Dari Open Bill {trx.open_bill.no_bill} · Dibuka oleh {trx.open_bill.dibuka_oleh ?? '-'}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-xs uppercase text-slate-500">
                <th className="py-2">Produk</th><th className="py-2 text-right">Harga</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Subtotal</th>
              </tr></thead>
              <tbody>
                {trx.detail?.map((d) => (
                  <tr key={d.ID} className="border-b border-slate-100">
                    <td className="py-2">{d.produk?.NAMA ?? `#${d.ID_PRODUK}`}</td>
                    <td className="py-2 text-right">{formatRupiah(d.HARGA_JUAL)}</td>
                    <td className="py-2 text-center">{d.QTY}</td>
                    <td className="py-2 text-right font-medium">{formatRupiah(d.HARGA_JUAL * d.QTY)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            {Number(trx.DISKON) > 0 && <p className="text-slate-500">Diskon: {formatRupiah(trx.DISKON)}</p>}
            <p className="text-lg font-bold text-brand-600 dark:text-accent">Total: {formatRupiah(trx.TOTAL)}</p>
          </div>
        </CardBody></Card>

        <Card><CardBody>
          <h3 className="mb-3 font-semibold text-slate-800">Preview Struk</h3>
          <div id="print-area" className="rounded-lg border border-dashed border-slate-200">
            <Receipt ref={printRef} trx={trx} namaToko={user?.merchant?.nama} plan={plan} size={receiptSize} />
          </div>
        </CardBody></Card>
      </div>
    </div>
  );
}
