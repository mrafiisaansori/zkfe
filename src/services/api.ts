import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Instance terpusat: semua request lewat /api dengan JWT Bearer (multi-tenant).
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Sisipkan token JWT dari store ke setiap request. merchant_id diambil backend
// dari token ini — tidak pernah dari frontend.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout saat token invalid/kedaluwarsa (401).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const { logout } = useAuthStore.getState();
      logout();
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Ekstrak pesan error backend agar mudah ditampilkan ke user.
export function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<{ message?: string; details?: string[] }>;
  if (e?.response?.data) {
    const { message, details } = e.response.data;
    if (details && details.length) return `${message || 'Error'}: ${details.join(', ')}`;
    if (message) return message;
  }
  if (e?.message) return e.message;
  return 'Terjadi kesalahan tak terduga';
}

// Helper generik (mengembalikan field data dari response standar { success, data }).
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data?.data as T;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post(url, body);
  return res.data?.data as T;
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put(url, body);
  return res.data?.data as T;
}
export async function del<T>(url: string): Promise<T> {
  const res = await api.delete(url);
  return res.data?.data as T;
}

// Upload multipart/form-data (untuk gambar produk). Biarkan browser set boundary.
export async function postForm<T>(url: string, form: FormData): Promise<T> {
  const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data?.data as T;
}
export async function putForm<T>(url: string, form: FormData): Promise<T> {
  const res = await api.put(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data?.data as T;
}
