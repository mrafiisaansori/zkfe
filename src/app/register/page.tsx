'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Building2, Check, MapPin, ShieldCheck, Store, UserRound, type LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLoadingOverlay, AuthShell } from '@/components/auth/AuthShell';
import { Button, Input, PasswordInput, SelectMenu, Turnstile, turnstileEnabled } from '@/components/ui';
import { cn } from '@/utils/cn';
import { authService, getErrorMessage, wilayahService } from '@/services';
import type { Kota, Provinsi } from '@/types';

const CATEGORIES = [
  'Retail / Toko Kelontong', 'Makanan & Minuman', 'Fashion & Pakaian', 'Elektronik',
  'Kesehatan & Kecantikan', 'Pertanian', 'Jasa', 'Lainnya',
];

interface FormData {
  owner_name: string;
  store_name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  password: string;
  password_confirmation: string;
}

const STEPS: Array<{ title: string; shortTitle: string; description: string; icon: LucideIcon }> = [
  {
    title: 'Data pemilik',
    shortTitle: 'Pemilik',
    description: 'Kontak utama untuk OTP dan administrasi merchant.',
    icon: UserRound,
  },
  {
    title: 'Informasi toko',
    shortTitle: 'Toko',
    description: 'Identitas toko yang akan tampil di struk dan laporan.',
    icon: Building2,
  },
  {
    title: 'Lokasi usaha',
    shortTitle: 'Lokasi',
    description: 'Wilayah toko untuk data merchant yang lebih rapi.',
    icon: MapPin,
  },
  {
    title: 'Keamanan akun',
    shortTitle: 'Akun',
    description: 'Buat akses login yang aman untuk dashboard POS.',
    icon: ShieldCheck,
  },
];

const STEP_FIELDS: Array<Array<keyof FormData>> = [
  ['owner_name', 'email', 'phone', 'username'],
  ['store_name', 'address'],
  [],
  ['password', 'password_confirmation'],
];

function StepHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="hidden items-start gap-3 rounded-2xl bg-brand-50/75 px-4 py-3 sm:flex">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-card">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Stepper({ activeStep }: { activeStep: number }) {
  return (
    <div>
      <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Langkah {activeStep + 1}/{STEPS.length}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{STEPS[activeStep].title}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-card">
            {Math.round(((activeStep + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="hidden grid-cols-4 gap-2 sm:grid">
        {STEPS.map((step, index) => {
          const completed = index < activeStep;
          const active = index === activeStep;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={cn(
                'rounded-2xl border px-2.5 py-2.5 transition-colors sm:px-3',
                active || completed ? 'border-brand-200 bg-brand-50 text-primary' : 'border-line bg-white text-slate-400',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                    completed ? 'bg-primary text-white' : active ? 'bg-white text-primary shadow-card' : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {completed ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{step.shortTitle}</p>
                  <p className="hidden text-[11px] text-slate-500 sm:block">Langkah {index + 1}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletionNote() {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-card">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Setelah daftar</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            OTP akan dikirim ke email pemilik. Setelah verifikasi, merchant bisa masuk dan mulai setup produk.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kategori, setKategori] = useState('');

  const [provinsiList, setProvinsiList] = useState<Provinsi[]>([]);
  const [kotaList, setKotaList] = useState<Kota[]>([]);
  const [provId, setProvId] = useState('');
  const [kotaId, setKotaId] = useState('');
  const [loadingKota, setLoadingKota] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [captcha, setCaptcha] = useState('');

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({ mode: 'onTouched' });

  useEffect(() => {
    wilayahService.provinsi().then((d) => setProvinsiList(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setKotaId('');
    setKotaList([]);
    if (!provId) return;
    setLoadingKota(true);
    wilayahService.kota(provId)
      .then((d) => setKotaList(d || []))
      .catch(() => {})
      .finally(() => setLoadingKota(false));
  }, [provId]);

  async function onSubmit(data: FormData) {
    if (!provId) { toast.error('Pilih provinsi'); return; }
    if (!kotaId) { toast.error('Pilih kota/kabupaten'); return; }
    if (!kategori) { toast.error('Pilih kategori usaha'); return; }
    if (data.password !== data.password_confirmation) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (turnstileEnabled && !captcha) { toast.error('Selesaikan verifikasi keamanan dulu'); return; }

    const province = provinsiList.find((p) => p.ID === provId)?.NAMA || '';
    const city = kotaList.find((k) => k.ID === kotaId)?.NAMA || '';

    setLoading(true);
    try {
      await authService.register({ ...data, province, city, business_category: kategori }, captcha);
      toast.success('OTP dikirim ke email Anda');
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setLoading(false);
      toast.error(getErrorMessage(err));
    }
  }

  async function goNext() {
    const fields = STEP_FIELDS[stepIndex];
    if (fields.length) {
      const valid = await trigger(fields);
      if (!valid) return;
    }

    if (stepIndex === 1 && !kategori) {
      toast.error('Pilih kategori usaha');
      return;
    }

    if (stepIndex === 2) {
      if (!provId) { toast.error('Pilih provinsi'); return; }
      if (!kotaId) { toast.error('Pilih kota/kabupaten'); return; }
    }

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <AuthShell maxWidth="xl">
      <AuthLoadingOverlay show={loading} label="Mendaftarkan merchant..." />
      <div>
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-card sm:flex sm:h-12 sm:w-12">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="mb-1 hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex">Merchant baru</p>
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Daftar Toko</h1>
              <p className="hidden text-sm text-slate-500 sm:block">Lengkapi data toko untuk mengaktifkan akun POS.</p>
            </div>
          </div>
          <Link href="/login" className="text-sm font-semibold text-primary transition-colors hover:text-brand-700 hover:underline sm:text-right">
            Sudah punya akun? Masuk
          </Link>
        </div>

        <Stepper activeStep={stepIndex} />

        <form
          onSubmit={isLastStep ? handleSubmit(onSubmit) : (event) => { event.preventDefault(); void goNext(); }}
          className="mt-4 space-y-4 sm:mt-5 sm:space-y-5"
        >
          <StepHeader icon={currentStep.icon} title={currentStep.title} description={currentStep.description} />

          {stepIndex === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nama pemilik" placeholder="Nama lengkap pemilik" {...register('owner_name', { required: 'Wajib diisi' })} error={errors.owner_name?.message} />
              <Input label="Email" type="email" placeholder="nama@email.com" {...register('email', { required: 'Wajib diisi' })} error={errors.email?.message} />
              <Input label="No. Telepon / WhatsApp" placeholder="08xxxxxxxxxx" {...register('phone', { required: 'Wajib diisi' })} error={errors.phone?.message} />
              <Input label="Username" placeholder="Minimal 3 karakter" {...register('username', { required: 'Wajib diisi', minLength: { value: 3, message: 'Minimal 3 karakter' } })} error={errors.username?.message} />
            </div>
          )}

          {stepIndex === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Nama toko / merchant" placeholder="Nama toko Anda" {...register('store_name', { required: 'Wajib diisi' })} error={errors.store_name?.message} />
              <SelectMenu
                label="Kategori usaha"
                value={kategori}
                onChange={(v) => setKategori(String(v))}
                placeholder="Pilih kategori"
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <div className="sm:col-span-2">
                <Input label="Alamat toko" placeholder="Alamat lengkap toko" {...register('address', { required: 'Wajib diisi' })} error={errors.address?.message} />
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectMenu
                label="Provinsi"
                value={provId}
                onChange={(v) => setProvId(String(v))}
                placeholder="Pilih provinsi"
                searchable
                searchPlaceholder="Cari provinsi..."
                options={provinsiList.map((p) => ({ value: p.ID, label: p.NAMA }))}
              />
              <SelectMenu
                label={loadingKota ? 'Kota/Kabupaten (memuat...)' : 'Kota / Kabupaten'}
                value={kotaId}
                onChange={(v) => setKotaId(String(v))}
                placeholder={provId ? 'Pilih kota/kabupaten' : 'Pilih provinsi dulu'}
                searchable
                searchPlaceholder="Cari kota/kabupaten..."
                options={kotaList.map((k) => ({ value: k.ID, label: k.NAMA }))}
              />
            </div>
          )}

          {stepIndex === 3 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordInput label="Password" placeholder="Minimal 6 karakter" {...register('password', { required: 'Wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })} error={errors.password?.message} />
              <PasswordInput label="Konfirmasi password" placeholder="Ulangi password" {...register('password_confirmation', { required: 'Wajib diisi', validate: (v) => v === watch('password') || 'Konfirmasi tidak cocok' })} error={errors.password_confirmation?.message} />
              <div className="sm:col-span-2">
                <CompletionNote />
              </div>
            </div>
          )}

          {isLastStep && <div className="pt-3"><Turnstile onToken={setCaptcha} /></div>}

          <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-line bg-white/95 px-5 pb-1 pt-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:backdrop-blur-0">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={stepIndex === 0 || loading}
              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
              className="h-12 w-full rounded-xl px-5 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>

            {isLastStep ? (
              <Button type="submit" variant="gradient" size="lg" loading={loading} className="h-12 w-full rounded-xl px-6 text-base font-semibold sm:w-auto sm:min-w-56">
                {loading ? 'Mendaftarkan...' : <>Daftar & Kirim OTP <ArrowRight className="h-4 w-4" /></>}
              </Button>
            ) : (
              <Button type="button" variant="gradient" size="lg" onClick={goNext} className="h-12 w-full rounded-xl px-6 text-base font-semibold sm:w-auto sm:min-w-44">
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
