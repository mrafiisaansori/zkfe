import { get } from './api';
import type { Provinsi, Kota } from '@/types';

export const wilayahService = {
  provinsi: () => get<Provinsi[]>('/wilayah/provinsi'),
  kota: (provinsiId: string) => get<Kota[]>('/wilayah/kota', { provinsi_id: provinsiId }),
};
