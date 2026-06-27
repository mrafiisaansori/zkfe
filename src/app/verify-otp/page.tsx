'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MailCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Input, Turnstile, isTurnstileEnabled, type TurnstileHandle } from '@/components/ui';
import { authService, getErrorMessage } from '@/services';

function VerifyOtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [captcha, setCaptcha] = useState('');
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => { setEmail(params.get('email') || ''); }, [params]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Masukkan 6 digit OTP'); return; }
    if (loading) return; // cegah double submit
    if (isTurnstileEnabled() && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, otp, captcha);
      toast.success(res.message || 'Verifikasi berhasil');
      router.push('/login');
    } catch (err) {
      setLoading(false);
      turnstileRef.current?.reset();
      setCaptcha('');
      toast.error(getErrorMessage(err));
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await authService.resendOtp(email, captcha);
      toast.success('OTP baru telah dikirim');
      setCooldown(res.cooldown || 60);
    } catch (err) {
      turnstileRef.current?.reset();
      setCaptcha('');
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell maxWidth="md">
      <AuthLoadingOverlay show={loading} label="Memverifikasi kode OTP..." />
      <div>
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-card">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-primary">
            Verifikasi merchant
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Cek Email Anda</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masukkan 6 digit OTP yang dikirim ke email pendaftaran merchant.
          </p>
        </div>

        <form onSubmit={onVerify} className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-card">
                <MailCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email tujuan</p>
                <p className="truncate text-sm font-semibold text-slate-800">{email || '-'}</p>
              </div>
            </div>
          </div>

          <Input
            label="Kode OTP"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="h-14 text-center text-xl font-semibold tracking-[0.45em]"
          />
          <Turnstile ref={turnstileRef} onToken={setCaptcha} />
          <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? 'Memverifikasi OTP...' : <>Verifikasi <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-500">
          <span>Tidak menerima kode?</span>
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : resending ? 'Mengirim...' : 'Kirim ulang OTP'}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-slate-600 transition-colors hover:text-primary hover:underline">Kembali ke login</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpInner />
    </Suspense>
  );
}
