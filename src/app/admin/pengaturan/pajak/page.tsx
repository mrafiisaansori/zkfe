'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsTabs } from '@/components/layout/SettingsTabs';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { taxService, getErrorMessage } from '@/services';
import type { TaxSetting } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function PajakPage() {
  const [data, setData] = useState<TaxSetting>({ PPN_ENABLED: false, PPN_PERSEN: 0, SERVICE_ENABLED: false, SERVICE_PERSEN: 0 });
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await taxService.get(); if (d) setData(d); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await taxService.update({
        ppn_enabled: data.PPN_ENABLED, ppn_persen: Number(data.PPN_PERSEN) || 0,
        service_enabled: data.SERVICE_ENABLED, service_persen: Number(data.SERVICE_PERSEN) || 0,
      });
      toast.success('Pengaturan pajak disimpan');
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );

  return (
    <div>
      <PageHeader title="Pengaturan" description="Pajak (PPN) & service charge berlaku untuk toko Anda saja." />
      <SettingsTabs />
      <Card><CardBody>
        <div className="max-w-lg space-y-4">
          <Toggle checked={data.PPN_ENABLED} onChange={(v) => setData((d) => ({ ...d, PPN_ENABLED: v }))} label="Aktifkan PPN" />
          {data.PPN_ENABLED && (
            <Input label="Persentase PPN (%)" type="number" min={0} max={100} value={data.PPN_PERSEN || ''}
              onChange={(e) => setData((d) => ({ ...d, PPN_PERSEN: Number(e.target.value) }))} />
          )}
          <Toggle checked={data.SERVICE_ENABLED} onChange={(v) => setData((d) => ({ ...d, SERVICE_ENABLED: v }))} label="Aktifkan Service Charge" />
          {data.SERVICE_ENABLED && (
            <Input label="Persentase Service Charge (%)" type="number" min={0} max={100} value={data.SERVICE_PERSEN || ''}
              onChange={(e) => setData((d) => ({ ...d, SERVICE_PERSEN: Number(e.target.value) }))} />
          )}
          <Button onClick={save} loading={saving}>Simpan</Button>
        </div>
      </CardBody></Card>
    </div>
  );
}
