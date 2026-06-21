import { get, put, postForm } from './api';
import type { Identitas } from '@/types';

export interface IdentitasInput {
  nama?: string; alamat?: string; no_telp?: string; email?: string; website?: string; logo?: string;
}

export const identitasService = {
  get: () => get<Identitas>('/identitas'),
  update: (data: IdentitasInput) => put<Identitas>('/identitas', data),
  uploadBanner: (file: File) => {
    const fd = new FormData();
    fd.append('banner', file);
    return postForm<Identitas>('/identitas/banner', fd);
  },
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return postForm<Identitas>('/identitas/logo', fd);
  },
};
