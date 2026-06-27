'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import { usePageLoading } from '@/hooks/usePageLoading';

const initialForm = {
  price_monthly: 0,
  price_yearly: 0,
  price_business_monthly: 0,
  price_business_yearly: 0,
  payment_ttl_hours: 24,
};

export default function HargaLanggananSettingPage() {
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSetting();
      setForm({
        price_monthly: data.PRICE_MONTHLY || 0,
        price_yearly: data.PRICE_YEARLY || 0,
        price_business_monthly: data.PRICE_BUSINESS_MONTHLY || 0,
        price_business_yearly: data.PRICE_BUSINESS_YEARLY || 0,
        payment_ttl_hours: data.PAYMENT_TTL_HOURS || 24,
      });
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await subscriptionService.updateSetting(form);
      toast.success('Harga plan disimpan');
      await load();
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="Harga Upgrade Plan" description="Nominal QRIS dinamis Midtrans untuk paket PRO dan BUSINESS." />
      <Card><CardBody>
        <div className="max-w-2xl space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Harga PRO Bulanan (Rp)" type="number" min={0} value={form.price_monthly || ''} onChange={(event) => setForm((current) => ({ ...current, price_monthly: Number(event.target.value) }))} />
            <Input label="Harga PRO Tahunan (Rp)" type="number" min={0} value={form.price_yearly || ''} onChange={(event) => setForm((current) => ({ ...current, price_yearly: Number(event.target.value) }))} />
            <Input label="Harga BUSINESS Bulanan (Rp)" type="number" min={0} value={form.price_business_monthly || ''} onChange={(event) => setForm((current) => ({ ...current, price_business_monthly: Number(event.target.value) }))} />
            <Input label="Harga BUSINESS Tahunan (Rp)" type="number" min={0} value={form.price_business_yearly || ''} onChange={(event) => setForm((current) => ({ ...current, price_business_yearly: Number(event.target.value) }))} />
          </div>
          <Input label="Masa berlaku QRIS (jam)" type="number" min={1} max={168} value={form.payment_ttl_hours || ''} onChange={(event) => setForm((current) => ({ ...current, payment_ttl_hours: Number(event.target.value) }))} />
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-slate-600">QRIS dibuat oleh Midtrans sesuai nominal di atas. Kredensial gateway dikelola melalui ENV backend dan tidak ditampilkan di halaman ini.</p>
          <Button onClick={save} loading={saving}>Simpan Harga</Button>
        </div>
      </CardBody></Card>
    </div>
  );
}
