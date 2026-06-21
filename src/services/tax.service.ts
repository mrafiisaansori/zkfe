import { get, put } from './api';
import type { TaxSetting } from '@/types';

export interface TaxInput {
  ppn_enabled?: boolean;
  ppn_persen?: number;
  service_enabled?: boolean;
  service_persen?: number;
}

export const taxService = {
  get: () => get<TaxSetting>('/tax'),
  update: (data: TaxInput) => put<TaxSetting>('/tax', data),
};
