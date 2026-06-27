import { get, post } from './api';
import type { MidtransQrisResult, PaymentStatusResult } from '@/types';

export interface CreateQrisInput {
  items: { id_produk: number; qty: number; modifier_option_ids?: number[] }[];
  id_jenis_bayar: number;
  id_user: number;
  diskon?: number;
  keterangan?: string;
  kode_voucher?: string;
  customer_name?: string;
}

// Payment gateway Midtrans (QRIS dinamis) - hanya untuk merchant plan BUSINESS.
// Backend memvalidasi plan; merchant_id selalu dari token login (bukan frontend).
export const paymentService = {
  // Buat transaksi + QRIS dinamis. Mengembalikan qr_string/qr_url + order_id.
  createQris: (data: CreateQrisInput) =>
    post<MidtransQrisResult>('/payments/midtrans/qris/create', data),

  // Polling status pembayaran (kasir). PAID = lunas otomatis dari webhook Midtrans.
  status: (transactionId: number) =>
    get<PaymentStatusResult>(`/payments/status/${transactionId}`),
};
