import { post } from './api';

// Akun sendiri (butuh login). merchant_id & id user diambil backend dari token.
export const accountService = {
  // Ubah password sendiri (admin & kasir).
  changePassword: (old_password: string, new_password: string) =>
    post<{ message?: string }>('/account/change-password', { old_password, new_password }),

  // Ganti email akun/toko (admin merchant): password -> OTP ke email baru.
  requestEmail: (password: string, new_email: string) =>
    post<{ new_email: string; cooldown: number; expires_in_minutes: number }>(
      '/account/email/request', { password, new_email },
    ),
  verifyEmail: (otp: string) =>
    post<{ email: string }>('/account/email/verify', { otp }),
  resendEmail: () =>
    post<{ cooldown: number }>('/account/email/resend'),

  // Tandai onboarding/guide selesai untuk merchant ini.
  onboardingDone: () => post<{ message?: string }>('/account/onboarding-done'),
};
