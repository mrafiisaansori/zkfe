import { get, getWithMeta, post, put, del, type ApiDataWithMeta, type PaginationMeta } from './api';
import type { Member, MemberDetail } from '@/types';

export interface MemberInput {
  nama: string;
  no_hp: string;
  email?: string;
  alamat?: string;
  status?: 0 | 1;
}

export interface MemberListParams {
  search?: string;
  status?: 0 | 1;
  page?: number;
  limit?: number;
}

export const memberService = {
  list: (params?: MemberListParams): Promise<ApiDataWithMeta<Member[], PaginationMeta>> =>
    getWithMeta<Member[]>('/member', params as Record<string, unknown>),
  getById: (id: number) => get<Member>(`/member/${id}`),
  getDetail: (id: number) => get<MemberDetail>(`/member/${id}/detail`),
  create: (data: MemberInput) => post<Member>('/member', data),
  update: (id: number, data: Partial<MemberInput>) => put<Member>(`/member/${id}`, data),
  remove: (id: number) => del(`/member/${id}`),
};
