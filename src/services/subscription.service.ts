import { get, post, put } from './api';
import type { SubscriptionSetting, SubscriptionPayment, Billing, SubscriptionStatus } from '@/types';

export const subscriptionService = {
  // Setting harga global. Kredensial Midtrans billing hanya berada di ENV backend.
  getSetting: () => get<SubscriptionSetting>('/subscription/setting'),
  updateSetting: (data: {
    price_monthly: number;
    price_yearly: number;
    price_business_monthly: number;
    price_business_yearly: number;
    payment_ttl_hours: number;
  }) => put<SubscriptionSetting>('/subscription/setting', data),

  // Merchant
  billing: () => get<Billing>('/subscription/billing'),
  createPayment: (plan: 'PRO' | 'BUSINESS', paket: 'BULANAN' | 'TAHUNAN') =>
    post<SubscriptionPayment>('/subscription/payment', { plan, paket }),
  paymentStatus: (id: number) => get<SubscriptionPayment>(`/subscription/payment/${id}/status`),

  // Super admin
  listPayments: (status?: SubscriptionStatus) =>
    get<SubscriptionPayment[]>('/subscription/payments', status ? { status } : undefined),
  getPayment: (id: number) => get<SubscriptionPayment>(`/subscription/payments/${id}`),
};
