import { get, post, postForm, putForm } from './api';
import type { SubscriptionSetting, SubscriptionPayment, Billing, SubscriptionStatus } from '@/types';

export const subscriptionService = {
  // Setting global (baca semua user; ubah super admin via multipart).
  getSetting: () => get<SubscriptionSetting>('/subscription/setting'),
  updateSetting: (form: FormData) => {
    // pakai PUT multipart
    return putForm<SubscriptionSetting>('/subscription/setting', form);
  },

  // Merchant
  billing: () => get<Billing>('/subscription/billing'),
  createPayment: (paket: 'BULANAN' | 'TAHUNAN') =>
    post<SubscriptionPayment>('/subscription/payment', { paket }),
  submitPayment: (id: number, file?: File | null) => {
    const fd = new FormData();
    if (file) fd.append('bukti', file);
    return postForm<SubscriptionPayment>(`/subscription/payment/${id}/submit`, fd);
  },

  // Super admin
  listPayments: (status?: SubscriptionStatus) =>
    get<SubscriptionPayment[]>('/subscription/payments', status ? { status } : undefined),
  getPayment: (id: number) => get<SubscriptionPayment>(`/subscription/payments/${id}`),
  verify: (id: number) => post(`/subscription/payments/${id}/verify`),
  reject: (id: number, reason: string) => post(`/subscription/payments/${id}/reject`, { reason }),
};
