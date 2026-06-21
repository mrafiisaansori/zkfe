import { get, post, put, del } from './api';

export interface Meja {
  ID: number;
  NOMOR: string;
  QR_TOKEN: string;
  IS_ACTIVE: boolean;
}

export const mejaService = {
  list: () => get<Meja[]>('/meja'),
  create: (nomor: string) => post<Meja>('/meja', { nomor }),
  update: (id: number, data: { nomor?: string; is_active?: boolean }) => put<Meja>(`/meja/${id}`, data),
  remove: (id: number) => del(`/meja/${id}`),
};
