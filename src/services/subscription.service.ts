import { get, post, put, del } from './api';
import type { PlanType, SubscriptionVoucher, SubscriptionVoucherRedemption, SubscriptionSetting, SubscriptionPayment, SubscriptionPaket, Billing, SubscriptionStatus, RevenueSummary, RevenueChart } from '@/types';

export interface SubscriptionVoucherInput {
  kode: string;
  target_plan: 'PRO' | 'BUSINESS';
  paket: SubscriptionPaket;
  max_redemptions?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  note?: string;
}

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
  cancelPayment: (id: number) => post<SubscriptionPayment>(`/subscription/payment/${id}/cancel`),

  // Redeem kode voucher langganan (admin merchant)
  redeemVoucher: (kode: string) =>
    post<{ plan: PlanType; paket: SubscriptionPaket; pro_expires_at: string }>('/subscription/voucher/redeem', { kode }),

  // Super admin: kelola voucher redeem langganan
  listVouchers: () => get<SubscriptionVoucher[]>('/subscription/vouchers'),
  createVoucher: (data: SubscriptionVoucherInput) => post<SubscriptionVoucher>('/subscription/vouchers', data),
  updateVoucher: (id: number, data: Partial<SubscriptionVoucherInput>) => put<SubscriptionVoucher>(`/subscription/vouchers/${id}`, data),
  removeVoucher: (id: number) => del(`/subscription/vouchers/${id}`),
  voucherRedemptions: (id: number) => get<SubscriptionVoucherRedemption[]>(`/subscription/vouchers/${id}/redemptions`),

  // Super admin
  listPayments: (status?: SubscriptionStatus) =>
    get<SubscriptionPayment[]>('/subscription/payments', status ? { status } : undefined),
  getPayment: (id: number) => get<SubscriptionPayment>(`/subscription/payments/${id}`),

  // Super admin — laporan pendapatan platform (read-only)
  revenueSummary: (tanggal_awal?: string, tanggal_akhir?: string) =>
    get<RevenueSummary>('/subscription/revenue', tanggal_awal && tanggal_akhir ? { tanggal_awal, tanggal_akhir } : undefined),
  revenueChart: (tahun: number) => get<RevenueChart>('/subscription/revenue/chart', { tahun }),
};
