import type { PlanType, TaxSetting } from '@/types';

/** Request gagal karena gak nyampe server (offline/putus) — beda dari server yang menolak (validasi/stok habis). */
export function isNetworkError(err: unknown): boolean {
  const e = err as { response?: unknown; request?: unknown };
  return !!e?.request && !e?.response;
}

/** Sama persis rumus pajak yang dipakai PaymentModal saat checkout online — biar draft offline konsisten. */
export function computeDraftTotals(params: { subtotal: number; diskon: number; tax: TaxSetting | null; plan: PlanType }) {
  const isPro = params.plan === 'PRO' || params.plan === 'BUSINESS';
  const dpp = Math.max(0, params.subtotal - params.diskon);
  const ppn = isPro && params.tax?.PPN_ENABLED ? Math.round((dpp * Number(params.tax.PPN_PERSEN || 0)) / 100) : 0;
  const service = isPro && params.tax?.SERVICE_ENABLED ? Math.round((dpp * Number(params.tax.SERVICE_PERSEN || 0)) / 100) : 0;
  const total = dpp + ppn + service;
  return { dpp, ppn, service, total };
}
