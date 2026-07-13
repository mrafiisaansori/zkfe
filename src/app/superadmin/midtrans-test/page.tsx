'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { QrCode } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { midtransTestService, getErrorMessage } from '@/services';
import type { MidtransTestResult } from '@/services/midtransTest.service';

// Alat internal Super Admin - bukan fitur bisnis, tidak nyimpan data apapun.
// Charge GoPay Rp1 LANGSUNG lewat Core API Midtrans (bukan Snap) supaya QR-nya
// tampil langsung tanpa layar pilih metode bayar. Scan QR-nya pakai app APAPUN
// (bukan cuma app GoPay) - kalau bisa, GoPay QRIS Aggregator sudah aktif.
export default function MidtransTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MidtransTestResult | null>(null);

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      setResult(await midtransTestService.chargeGopayQrisTest());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Test Midtrans GoPay QRIS" description="Cek apakah GoPay QRIS Aggregator sudah aktif di akun Midtrans billing" />
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-canvas p-4">
            <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1 text-sm text-slate-600">
              <p>Tombol di bawah charge GoPay senilai <b>Rp1</b> langsung lewat Core API Midtrans (bukan Snap) pakai akun billing platform - QR-nya tampil langsung di halaman ini.</p>
              <p>Scan QR yang muncul pakai app <b>apa aja</b> (OVO, DANA, m-banking, dll):</p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>Bisa discan → GoPay QRIS Aggregator <b>sudah aktif</b>.</li>
                <li>Cuma bisa lewat app GoPay → aggregator <b>belum aktif</b>.</li>
              </ul>
              <p className="text-xs text-slate-400">Kalau tombol ini malah error, itu belum tentu berarti aggregator mati - akses Core API per-channel kadang butuh diaktifkan terpisah oleh Midtrans, beda dari Snap yang otomatis ikut apa yang aktif di dashboard.</p>
            </div>
          </div>

          <Button onClick={runTest} loading={loading}>Charge GoPay Test Rp1</Button>

          {result && (
            <div className="space-y-3 rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge tone="blue">order_id: {result.order_id}</Badge>
                {result.transaction_status && <Badge tone="amber">{result.transaction_status}</Badge>}
              </div>
              {result.qr_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.qr_image_url} alt="QR GoPay test" className="h-56 w-56 rounded-lg border border-line" />
              ) : (
                <p className="text-sm text-rose-600">Midtrans tidak mengembalikan gambar QR (cek qr_string di bawah, atau respons mentahnya).</p>
              )}
              {result.qr_string && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">qr_string (payload QRIS mentah)</p>
                  <p className="break-all rounded-lg bg-canvas p-2 font-mono text-[11px] text-slate-600">{result.qr_string}</p>
                </div>
              )}
              <details>
                <summary className="cursor-pointer text-xs font-medium text-slate-500">Respons mentah Midtrans (buat diagnosa)</summary>
                <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-canvas p-2 text-[11px] text-slate-600">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
