'use client';
import { useCallback, useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { SubscriptionSetting } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function QrisLanggananSettingPage() {
  const [data, setData] = useState<SubscriptionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [form, setForm] = useState({ qris_label: '', price_monthly: 0, price_yearly: 0, payment_ttl_hours: 24 });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await subscriptionService.getSetting();
      setData(d);
      setForm({
        qris_label: d.QRIS_LABEL || '', price_monthly: d.PRICE_MONTHLY || 0,
        price_yearly: d.PRICE_YEARLY || 0, payment_ttl_hours: d.PAYMENT_TTL_HOURS || 24,
      });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('qris_label', form.qris_label);
      fd.append('price_monthly', String(form.price_monthly));
      fd.append('price_yearly', String(form.price_yearly));
      fd.append('payment_ttl_hours', String(form.payment_ttl_hours));
      if (file) fd.append('image', file);
      await subscriptionService.updateSetting(fd);
      toast.success('Pengaturan langganan disimpan');
      setFile(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="QRIS & Harga Langganan" description="QRIS Zona Kasir dan harga paket PRO untuk merchant." />
      <Card><CardBody>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Input label="Label QRIS (opsional)" value={form.qris_label} onChange={(e) => setForm((f) => ({ ...f, qris_label: e.target.value }))} placeholder="Zona Kasir" />
            <Input label="Harga PRO Bulanan (Rp)" type="number" min={0} value={form.price_monthly || ''} onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))} />
            <Input label="Harga PRO Tahunan (Rp)" type="number" min={0} value={form.price_yearly || ''} onChange={(e) => setForm((f) => ({ ...f, price_yearly: Number(e.target.value) }))} />
            <Input label="Masa berlaku pembayaran (jam)" type="number" min={1} value={form.payment_ttl_hours || ''} onChange={(e) => setForm((f) => ({ ...f, payment_ttl_hours: Number(e.target.value) }))} />
            <Button onClick={save} loading={saving}>Simpan</Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Gambar QRIS</p>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4">
              {(file || data?.QRIS_IMAGE_URL) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file ? URL.createObjectURL(file) : (data?.QRIS_IMAGE_URL as string)} alt="QRIS" className="h-56 w-56 rounded-xl border object-contain" />
              ) : <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">Belum ada QRIS</div>}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-semibold text-primary">
                <UploadCloud className="h-4 w-4" /> Pilih gambar QRIS
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
        </div>
      </CardBody></Card>
    </div>
  );
}
