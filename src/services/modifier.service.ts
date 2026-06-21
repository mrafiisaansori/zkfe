import { get, post, put, del } from './api';
import type { ModifierGroup } from '@/types';

export const modifierService = {
  listGroups: () => get<ModifierGroup[]>('/modifier/groups'),
  createGroup: (data: { nama: string; tipe: 'SINGLE' | 'MULTI'; wajib: boolean }) =>
    post<ModifierGroup>('/modifier/groups', data),
  updateGroup: (id: number, data: { nama?: string; tipe?: 'SINGLE' | 'MULTI'; wajib?: boolean }) =>
    put<ModifierGroup>(`/modifier/groups/${id}`, data),
  removeGroup: (id: number) => del(`/modifier/groups/${id}`),

  addOption: (groupId: number, data: { nama: string; harga: number }) =>
    post(`/modifier/groups/${groupId}/options`, data),
  updateOption: (id: number, data: { nama?: string; harga?: number }) => put(`/modifier/options/${id}`, data),
  removeOption: (id: number) => del(`/modifier/options/${id}`),

  getForProduct: (produkId: number) => get<ModifierGroup[]>(`/modifier/produk/${produkId}`),
  setProductGroups: (produkId: number, group_ids: number[]) =>
    put<ModifierGroup[]>(`/modifier/produk/${produkId}`, { group_ids }),
};
