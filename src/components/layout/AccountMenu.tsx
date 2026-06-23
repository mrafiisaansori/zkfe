'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Mail, UserCog, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Input, PasswordInput, Button } from '@/components/ui';
import { accountService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';

/**
 * Menu akun: Ubah Password (semua role) + Ganti Email (khusus admin merchant,
 * via verifikasi password + OTP ke email baru). Dipakai di Header.
 */
export function AccountMenu({ compact }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'password' | 'email'>('password');
  // Portal: hindari modal "terjebak" di dalam Header yang memakai backdrop-blur
  // (filter membuat containing block untuk position:fixed).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const modal = (
    <Modal open={open} onClose={() => setOpen(false)} title="Pengaturan Akun" size="sm">
        <div className="space-y-4">
          {/* Identitas akun */}
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
              {(user?.nama ?? '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{user?.nama}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role === 'admin' ? 'Admin Merchant' : user?.role}</p>
            </div>
          </div>

          {/* Tab switcher (hanya admin yang punya menu email) */}
          {isAdmin && (
            <div className="flex gap-1 rounded-xl bg-canvas p-1">
              <TabButton active={tab === 'password'} onClick={() => setTab('password')} icon={<KeyRound className="h-4 w-4" />} label="Password" />
              <TabButton active={tab === 'email'} onClick={() => setTab('email')} icon={<Mail className="h-4 w-4" />} label="Email" />
            </div>
          )}

          {tab === 'password' || !isAdmin ? <ChangePasswordSection /> : <ChangeEmailSection />}
        </div>
    </Modal>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => { setTab('password'); setOpen(true); }}
        title="Pengaturan akun"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <UserCog className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">Akun</span>}
      </button>
      {mounted && open ? createPortal(modal, document.body) : null}
    </>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-white text-primary shadow-card' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ChangePasswordSection() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const tooShort = newPass.length > 0 && newPass.length < 6;
  const mismatch = confirm.length > 0 && confirm !== newPass;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
    if (newPass !== confirm) { toast.error('Konfirmasi password tidak cocok'); return; }
    setLoading(true);
    try {
      await accountService.changePassword(oldPass, newPass);
      toast.success('Password berhasil diubah');
      setOldPass(''); setNewPass(''); setConfirm('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-slate-500">Gunakan password yang kuat dan tidak dipakai di tempat lain. Minimal 6 karakter.</p>
      </div>

      <PasswordInput label="Password lama" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Password saat ini" />
      <div>
        <PasswordInput label="Password baru" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" />
        {tooShort && <p className="mt-1 text-xs font-medium text-rose-600">Minimal 6 karakter</p>}
      </div>
      <div>
        <PasswordInput label="Konfirmasi password baru" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi password baru" />
        {mismatch && <p className="mt-1 text-xs font-medium text-rose-600">Konfirmasi tidak cocok</p>}
      </div>

      <Button type="submit" loading={loading} disabled={!oldPass || !newPass || !confirm || tooShort || mismatch} className="w-full">
        Simpan Password
      </Button>
    </form>
  );
}

function ChangeEmailSection() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !newEmail) { toast.error('Lengkapi password & email baru'); return; }
    setLoading(true);
    try {
      const res = await accountService.requestEmail(password, newEmail);
      toast.success('OTP dikirim ke email baru');
      setCooldown(res.cooldown || 60);
      setStep('otp');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Masukkan 6 digit OTP'); return; }
    setLoading(true);
    try {
      await accountService.verifyEmail(otp);
      toast.success('Email berhasil diperbarui');
      setStep('form'); setPassword(''); setNewEmail(''); setOtp('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  async function resend() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const res = await accountService.resendEmail();
      toast.success('OTP baru dikirim');
      setCooldown(res.cooldown || 60);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setResending(false); }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-3.5">
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-5 text-slate-600">Masukkan 6 digit OTP yang dikirim ke <b className="break-all">{newEmail}</b>.</p>
        </div>
        <Input
          label="Kode OTP"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="text-center text-lg font-semibold tracking-[0.4em]"
        />
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={resend} disabled={cooldown > 0 || resending}
            className="font-semibold text-primary disabled:cursor-not-allowed disabled:text-slate-400">
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : resending ? 'Mengirim...' : 'Kirim ulang OTP'}
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep('form')} disabled={loading} className="flex-1">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
          <Button type="submit" loading={loading} disabled={otp.length !== 6} className="flex-1">Verifikasi</Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={request} className="space-y-3.5">
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-slate-500">Kode OTP dikirim ke email baru. Email hanya berubah setelah password benar &amp; OTP valid.</p>
      </div>
      <PasswordInput label="Password saat ini" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Verifikasi identitas Anda" />
      <Input label="Email baru" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email-baru@domain.com" />
      <Button type="submit" loading={loading} disabled={!password || !newEmail} className="w-full">Kirim OTP ke Email Baru</Button>
    </form>
  );
}
