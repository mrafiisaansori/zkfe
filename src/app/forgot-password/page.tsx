'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Turnstile, turnstileEnabled } from '@/components/ui';
import { authService } from '@/services';
import { getErrorMessage } from '@/services/api';

const inputCls =
  'h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/25';

interface EmailForm { email: string; }
interface ResetForm { otp: string; new_password: string; confirm: string; }

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [captcha, setCaptcha] = useState('');

  const emailForm = useForm<EmailForm>();
  const resetForm = useForm<ResetForm>();

  // Hitung mundur cooldown resend OTP.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Step 1 - kirim email untuk minta OTP. Pesan selalu generik.
  async function requestOtp(data: EmailForm) {
    if (turnstileEnabled && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(data.email, captcha);
      setEmail(data.email);
      setStep(2);
      setCooldown(60);
      setCaptcha('');
      toast.success(res.message || 'Jika email terdaftar, instruksi reset password akan dikirim.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    try {
      const res = await authService.resendResetOtp(email, captcha);
      setCooldown(res.cooldown || 60);
      toast.success(res.message || 'OTP baru telah dikirim bila email terdaftar.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // Step 2 - verifikasi OTP + set password baru.
  async function doReset(data: ResetForm) {
    if (data.new_password !== data.confirm) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    if (turnstileEnabled && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }
    setLoading(true);
    try {
      const res = await authService.resetPassword(email, data.otp, data.new_password, captcha);
      toast.success(res.message || 'Password berhasil diperbarui.');
      // Biarkan loading tetap aktif sampai benar-benar diarahkan ke halaman login
      // (TIDAK mematikan loading di sini) agar tidak ada kedipan tombol.
      router.replace('/login');
    } catch (err) {
      // Hanya matikan loading bila gagal — supaya user bisa mencoba lagi.
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthShell maxWidth="md">
      <AuthLoadingOverlay show={loading} label="Memproses permintaan..." />
      <div>
        <div className="mb-7">
          <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-primary">
            Lupa Password
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            {step === 1 ? 'Atur ulang password' : 'Verifikasi & password baru'}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {step === 1
              ? 'Masukkan email akun Anda. Jika terdaftar, kami kirim kode OTP untuk reset password.'
              : `Masukkan kode OTP yang dikirim ke ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(requestOtp)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...emailForm.register('email', { required: 'Email wajib diisi' })}
                  placeholder="email@toko.com"
                  className={inputCls}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <Turnstile onToken={setCaptcha} />
            <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
              Kirim kode reset <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(doReset)} className="space-y-5" autoComplete="off">
            {/* Decoy: menyerap autofill email/password browser agar tidak masuk ke field OTP. */}
            <input type="text" name="email" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden />
            <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} aria-hidden />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kode OTP</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  {...resetForm.register('otp', {
                    required: 'OTP wajib diisi',
                    pattern: { value: /^\d{6}$/, message: 'OTP harus 6 digit' },
                    // Bersihkan input: hanya sisakan angka, maksimal 6 digit.
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    },
                  })}
                  placeholder="6 digit kode"
                  className={`${inputCls} tracking-[0.4em]`}
                />
              </div>
              {resetForm.formState.errors.otp && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{resetForm.formState.errors.otp.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password baru</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...resetForm.register('new_password', { required: 'Password wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } })}
                  placeholder="Minimal 8 karakter"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {resetForm.formState.errors.new_password && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{resetForm.formState.errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ulangi password baru</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...resetForm.register('confirm', { required: 'Ulangi password' })}
                  placeholder="Ketik ulang password"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Turnstile onToken={setCaptcha} />
            <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
              Simpan password baru
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Ganti email
              </button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={cooldown > 0}
                className="font-semibold text-primary hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang OTP'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Ingat password Anda?{' '}
          <Link href="/login" className="font-semibold text-primary transition-colors hover:text-brand-700 hover:underline">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
