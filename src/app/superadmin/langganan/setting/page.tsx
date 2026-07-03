'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import { usePageLoading } from '@/hooks/usePageLoading';

const initialForm = {
  price_monthly: 0,
  price_3_months: 0,
  price_6_months: 0,
  price_yearly: 0,
  price_business_monthly: 0,
  price_business_yearly: 0,
  payment_ttl_hours: 24,
};

const initialMaintenance = { maintenance_mode: false, maintenance_message: '' };

export default function HargaLanggananSettingPage() {
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [form, setForm] = useState(initialForm);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [saving, setSaving] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSetting();
      setForm({
        price_monthly: data.PRICE_MONTHLY || 0,
        price_3_months: data.PRICE_3_MONTHS || 0,
        price_6_months: data.PRICE_6_MONTHS || 0,
        price_yearly: data.PRICE_YEARLY || 0,
        price_business_monthly: data.PRICE_BUSINESS_MONTHLY || 0,
        price_business_yearly: data.PRICE_BUSINESS_YEARLY || 0,
        payment_ttl_hours: data.PAYMENT_TTL_HOURS || 24,
      });
      setMaintenance({
        maintenance_mode: Number(data.MAINTENANCE_MODE) === 1,
        maintenance_message: data.MAINTENANCE_MESSAGE || '',
      });
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);

  async function saveMaintenance(nextMode?: boolean) {
    const payload = {
      maintenance_mode: nextMode ?? maintenance.maintenance_mode,
      maintenance_message: maintenance.maintenance_message,
    };
    setSavingMaintenance(true);
    try {
      await subscriptionService.updateSetting(payload);
      setMaintenance((c) => ({ ...c, maintenance_mode: payload.maintenance_mode }));
      toast.success(payload.maintenance_mode ? 'Maintenance diaktifkan' : 'Maintenance dinonaktifkan');
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSavingMaintenance(false); }
  }
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
            <Input label="Harga PRO 1 Bulan (Rp)" type="number" min={0} value={form.price_monthly || ''} onChange={(event) => setForm((current) => ({ ...current, price_monthly: Number(event.target.value) }))} />
            <Input label="Harga PRO 3 Bulan (Rp)" type="number" min={0} value={form.price_3_months || ''} onChange={(event) => setForm((current) => ({ ...current, price_3_months: Number(event.target.value) }))} />
            <Input label="Harga PRO 6 Bulan (Rp)" type="number" min={0} value={form.price_6_months || ''} onChange={(event) => setForm((current) => ({ ...current, price_6_months: Number(event.target.value) }))} />
            <Input label="Harga PRO 1 Tahun (Rp)" type="number" min={0} value={form.price_yearly || ''} onChange={(event) => setForm((current) => ({ ...current, price_yearly: Number(event.target.value) }))} />
            <Input label="Harga BUSINESS Bulanan (Rp)" type="number" min={0} value={form.price_business_monthly || ''} onChange={(event) => setForm((current) => ({ ...current, price_business_monthly: Number(event.target.value) }))} />
            <Input label="Harga BUSINESS Tahunan (Rp)" type="number" min={0} value={form.price_business_yearly || ''} onChange={(event) => setForm((current) => ({ ...current, price_business_yearly: Number(event.target.value) }))} />
          </div>
          <Input label="Masa berlaku QRIS (jam)" type="number" min={1} max={168} value={form.payment_ttl_hours || ''} onChange={(event) => setForm((current) => ({ ...current, payment_ttl_hours: Number(event.target.value) }))} />
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-slate-600">QRIS dibuat oleh Midtrans sesuai nominal di atas. Kredensial gateway dikelola melalui ENV backend dan tidak ditampilkan di halaman ini.</p>
          <Button onClick={save} loading={saving}>Simpan Harga</Button>
        </div>
      </CardBody></Card>

      <Card className="mt-5"><CardBody>
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-bold text-ink">Maintenance Mode</p>
              <p className="text-sm text-slate-500">
                Saat aktif, Admin/Kasir/Gudang melihat halaman pemeliharaan. Super Admin tetap bisa masuk.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={maintenance.maintenance_mode}
              disabled={savingMaintenance}
              onClick={() => saveMaintenance(!maintenance.maintenance_mode)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${maintenance.maintenance_mode ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${maintenance.maintenance_mode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <Input
            label="Pesan maintenance (opsional)"
            placeholder="cth: Aplikasi sedang diperbarui, kembali dalam 30 menit."
            value={maintenance.maintenance_message}
            onChange={(event) => setMaintenance((c) => ({ ...c, maintenance_message: event.target.value }))}
          />
          <Button variant="outline" onClick={() => saveMaintenance()} loading={savingMaintenance}>
            Simpan Pesan
          </Button>
        </div>
      </CardBody></Card>
    </div>
  );
}
