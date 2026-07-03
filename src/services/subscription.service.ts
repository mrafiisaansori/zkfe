import { get, post, put } from './api';
import type { SubscriptionSetting, SubscriptionPayment, SubscriptionPaket, Billing, SubscriptionStatus, RevenueSummary, RevenueChart } from '@/types';

export const subscriptionService = {
  // Setting harga global. Kredensial Midtrans billing hanya berada di ENV backend.
  getSetting: () => get<SubscriptionSetting>('/subscription/setting'),
  updateSetting: (data: Partial<{
    price_monthly: number;
    price_3_months: number;
    price_6_months: number;
    price_yearly: number;
    price_business_monthly: number;
    price_business_yearly: number;
    payment_ttl_hours: number;
    maintenance_mode: boolean;
    maintenance_message: string;
  }>) => put<SubscriptionSetting>('/subscription/setting', data),

  // Merchant
  billing: () => get<Billing>('/subscription/billing'),
  createPayment: (plan: 'PRO' | 'BUSINESS', paket: SubscriptionPaket) =>
    post<SubscriptionPayment>('/subscription/payment', { plan, paket }),
  paymentStatus: (id: number) => get<SubscriptionPayment>(`/subscription/payment/${id}/status`),

  // Super admin
  listPayments: (status?: SubscriptionStatus) =>
    get<SubscriptionPayment[]>('/subscription/payments', status ? { status } : undefined),
  getPayment: (id: number) => get<SubscriptionPayment>(`/subscription/payments/${id}`),

  // Super admin — laporan pendapatan platform (read-only)
  revenueSummary: (tanggal_awal?: string, tanggal_akhir?: string) =>
    get<RevenueSummary>('/subscription/revenue', tanggal_awal && tanggal_akhir ? { tanggal_awal, tanggal_akhir } : undefined),
  revenueChart: (tahun: number) => get<RevenueChart>('/subscription/revenue/chart', { tahun }),
};
