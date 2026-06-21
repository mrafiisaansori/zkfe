import { post, get } from './api';
import type { User } from '@/types';

export interface LoginResult {
  token: string;
  user: User;
}

export interface RegisterInput {
  owner_name: string;
  store_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  business_category: string;
  username: string;
  password: string;
  password_confirmation: string;
}

// turnstile_token disertakan bila Turnstile aktif (production). Backend mengabaikannya bila nonaktif.
export const authService = {
  login: (username: string, password: string, turnstile_token?: string) =>
    post<LoginResult>('/auth/login', { username, password, turnstile_token }),
  register: (data: RegisterInput, turnstile_token?: string) =>
    post<{ email: string; expires_in_minutes: number }>('/auth/register', { ...data, turnstile_token }),
  verifyOtp: (email: string, otp: string, turnstile_token?: string) =>
    post<{ merchant_id: number; username: string; message: string }>('/auth/verify-otp', { email, otp, turnstile_token }),
  resendOtp: (email: string, turnstile_token?: string) =>
    post<{ email: string; cooldown: number }>('/auth/resend-otp', { email, turnstile_token }),
  me: () => get<User>('/auth/me'),

  // ===== Lupa password =====
  // Respons selalu generik (anti enumeration). FE menampilkan pesan dari backend.
  forgotPassword: (email: string, turnstile_token?: string) =>
    post<{ message: string }>('/auth/forgot-password', { email, turnstile_token }),
  resendResetOtp: (email: string, turnstile_token?: string) =>
    post<{ message: string; cooldown?: number }>('/auth/forgot-password/resend', { email, turnstile_token }),
  resetPassword: (email: string, otp: string, new_password: string, turnstile_token?: string) =>
    post<{ message: string }>('/auth/reset-password', { email, otp, new_password, turnstile_token }),
};
