'use client';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Turnstile, turnstileEnabled, type TurnstileHandle } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface FormData { username: string; password: string; }

/**
 * Login khusus Super Admin (URL terpisah dari merchant untuk keamanan).
 * Akun non-super-admin yang login di sini akan ditolak.
 */
export default function BeAdminLoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const turnstileRef = useRef<TurnstileHandle>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    if (loading) return;
    if (turnstileEnabled && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }
    setLoading(true);
    const res = await login(data.username, data.password, captcha, 'superadmin');
    if (!res.ok) {
      setLoading(false);
      turnstileRef.current?.reset();
      setCaptcha('');
      toast.error(res.message || 'Login gagal');
    }
  }

  return (
    <AuthShell maxWidth="md">
      <AuthLoadingOverlay show={loading} label="Masuk sebagai Super Admin..." />
      <div>
        <div className="mb-7">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
            <ShieldCheck className="h-3.5 w-3.5" /> Backend Admin
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Login Super Admin</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Halaman khusus pengelola Zona Kasir. Akun merchant tidak dapat masuk di sini.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                {...register('username', { required: 'Username wajib diisi' })}
                placeholder="Username super admin"
                className={`h-12 w-full rounded-2xl border bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/25 ${errors.username ? 'border-rose-400' : 'border-line'}`}
              />
            </div>
            {errors.username && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                {...register('password', { required: 'Password wajib diisi' })}
                type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password"
                className={`h-12 w-full rounded-2xl border bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/25 ${errors.password ? 'border-rose-400' : 'border-line'}`}
              />
              <button type="button" onClick={() => setShowPass((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password.message}</p>}
          </div>

          <Turnstile ref={turnstileRef} onToken={setCaptcha} />

          <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? 'Memproses...' : <>Masuk <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
