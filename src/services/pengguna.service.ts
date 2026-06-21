import { get, post, put, del } from './api';
import type { Pengguna } from '@/types';

export interface PenggunaInput {
  nama: string;
  username: string;
  password?: string;
  level: 1 | 2;
  telp?: string;
}

export const penggunaService = {
  list: () => get<Pengguna[]>('/pengguna'),
  getById: (id: number) => get<Pengguna>(`/pengguna/${id}`),
  create: (data: PenggunaInput) => post<Pengguna>('/pengguna', data),
  update: (id: number, data: Partial<PenggunaInput>) => put<Pengguna>(`/pengguna/${id}`, data),
  remove: (id: number) => del(`/pengguna/${id}`),
  // Reset password oleh admin: backend generate password acak & mengembalikannya
  // SEKALI untuk ditampilkan/disalin. Password disimpan sebagai hash di DB.
  resetPassword: (id: number) =>
    post<{ username: string; password: string }>(`/pengguna/${id}/reset-password`),
  changePassword: (id: number, old_password: string, new_password: string) =>
    post(`/pengguna/${id}/change-password`, { old_password, new_password }),
};
