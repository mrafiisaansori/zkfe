import { post } from './api';

export interface MidtransTestResult {
  order_id: string;
  transaction_status: string | null;
  qr_image_url: string | null;
  qr_string: string | null;
  raw: unknown;
}

export const midtransTestService = {
  chargeGopayQrisTest: () => post<MidtransTestResult>('/midtrans-test/gopay-qris'),
};
