'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowRight, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Input, PasswordInput, Turnstile, isTurnstileEnabled, type TurnstileHandle } from '@/components/ui';
import { authService, getErrorMessage } from '@/services';

interface FormData {
  owner_name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

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
        <div className="mb-6 flex items-center gap-3">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-card sm:flex">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Daftar Akun</h1>
            <p className="text-sm text-slate-500">Buat akun toko Anda untuk mulai mengelola transaksi, produk, dan laporan.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama"
            placeholder="Nama lengkap Anda"
            {...register('owner_name', { required: 'Wajib diisi' })}
            error={errors.owner_name?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            {...register('email', { required: 'Wajib diisi' })}
            error={errors.email?.message}
          />
          <Input
            label="No. Telepon / WhatsApp"
            placeholder="08xxxxxxxxxx"
            {...register('phone', { required: 'Wajib diisi' })}
            error={errors.phone?.message}
          />
          <Input
            label="Username"
            placeholder="Minimal 3 karakter"
            {...register('username', { required: 'Wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } })}
            error={errors.username?.message}
          />
          <PasswordInput
            label="Password"
            placeholder="Minimal 6 karakter"
            {...register('password', { required: 'Wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
            error={errors.password?.message}
          />

          <div className="pt-1"><Turnstile ref={turnstileRef} onToken={setCaptcha} /></div>

          <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? 'Mendaftarkan...' : <>Daftar & Kirim OTP <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <div className="pt-1 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-primary transition-colors hover:text-brand-700 hover:underline">
              Masuk
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
