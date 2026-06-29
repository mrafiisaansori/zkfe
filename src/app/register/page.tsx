'use client';
import { forwardRef, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Turnstile, isTurnstileEnabled, type TurnstileHandle } from '@/components/ui';
import { authService, getErrorMessage } from '@/services';
import { cn } from '@/utils/cn';

interface FormData {
  owner_name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: ReactNode;
}

const inputBaseClass =
  'h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/25 sm:h-12';

const AuthTextField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, icon, className, id, name, ...rest }, ref) => {
    const inputId = id ?? name;

    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
          <input
            ref={ref}
            id={inputId}
            name={name}
            aria-invalid={!!error}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            className={cn(
              inputBaseClass,
              error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-line',
              className,
            )}
            {...rest}
          />
        </div>
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="mt-1.5 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
AuthTextField.displayName = 'AuthTextField';

const AuthPasswordField = forwardRef<HTMLInputElement, Omit<AuthFieldProps, 'icon' | 'type'>>(
  ({ label, error, className, id, name, ...rest }, ref) => {
    const [showPass, setShowPass] = useState(false);
    const inputId = id ?? name;

    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={showPass ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            className={cn(
              inputBaseClass,
              'pr-11',
              error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-line',
              className,
            )}
            {...rest}
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
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="mt-1.5 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
AuthPasswordField.displayName = 'AuthPasswordField';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const turnstileRef = useRef<TurnstileHandle>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ mode: 'onTouched' });

  async function onSubmit(data: FormData) {
    if (loading) return;
    if (isTurnstileEnabled() && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }
    setLoading(true);
    try {
      // Data toko (alamat, kategori, dll.) dilengkapi nanti di halaman admin via onboarding.
      await authService.register(data, captcha);
      toast.success('OTP dikirim ke email Anda');
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setLoading(false);
      turnstileRef.current?.reset();
      setCaptcha('');
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <AuthShell maxWidth="md">
      <AuthLoadingOverlay show={loading} label="Mendaftarkan akun..." />
      <div>
        <div className="mb-6 sm:mb-7">
          <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-primary">
            Zona Kasir Merchant
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Daftar akun</h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Buat akun toko untuk mulai mengelola transaksi, produk, dan laporan.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <AuthTextField
            label="Nama"
            placeholder="Nama lengkap Anda"
            icon={<User className="h-4 w-4" />}
            {...register('owner_name', { required: 'Wajib diisi' })}
            error={errors.owner_name?.message}
          />
          <AuthTextField
            label="Email"
            type="email"
            placeholder="nama@email.com"
            icon={<Mail className="h-4 w-4" />}
            {...register('email', { required: 'Wajib diisi' })}
            error={errors.email?.message}
          />
          <AuthTextField
            label="No. Telepon / WhatsApp"
            placeholder="08xxxxxxxxxx"
            icon={<Phone className="h-4 w-4" />}
            {...register('phone', { required: 'Wajib diisi' })}
            error={errors.phone?.message}
          />
          <AuthTextField
            label="Username"
            placeholder="Minimal 3 karakter"
            icon={<User className="h-4 w-4" />}
            {...register('username', { required: 'Wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } })}
            error={errors.username?.message}
          />
          <AuthPasswordField
            label="Password"
            placeholder="Minimal 6 karakter"
            {...register('password', { required: 'Wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
            error={errors.password?.message}
          />

          <Turnstile ref={turnstileRef} onToken={setCaptcha} />

          <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? 'Mendaftarkan...' : <>Daftar & Kirim OTP <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary transition-colors hover:text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
