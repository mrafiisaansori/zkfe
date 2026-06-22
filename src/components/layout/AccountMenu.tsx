'use client';
import { useEffect, useState } from 'react';
import { KeyRound, Mail, UserCog } from 'lucide-react';
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Pengaturan akun"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <UserCog className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">Akun</span>}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pengaturan Akun" size="sm">
        <div className="space-y-6">
          <ChangePasswordSection />
          {isAdmin && <div className="border-t border-line pt-5"><ChangeEmailSection /></div>}
        </div>
      </Modal>
    </>
  );
}

function ChangePasswordSection() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={submit} className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700"><KeyRound className="h-4 w-4 text-primary" /> Ubah Password</p>
      <PasswordInput label="Password lama" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
      <PasswordInput label="Password baru" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
      <PasswordInput label="Konfirmasi password baru" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" loading={loading} disabled={!oldPass || !newPass || !confirm}>Simpan password</Button>
      </div>
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

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Mail className="h-4 w-4 text-primary" /> Ganti Email Toko</p>
      {step === 'form' ? (
        <form onSubmit={request} className="space-y-3">
          <PasswordInput label="Password saat ini" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Email baru" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email-baru@domain.com" />
          <p className="text-xs text-slate-400">Kode OTP akan dikirim ke email baru. Email hanya berubah setelah OTP benar.</p>
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!password || !newEmail}>Kirim OTP</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-xs text-slate-500">Masukkan 6 digit OTP yang dikirim ke <b>{newEmail}</b>.</p>
          <Input
            label="Kode OTP"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center text-lg font-semibold tracking-[0.4em]"
          />
          <div className="flex items-center justify-between">
            <button type="button" onClick={resend} disabled={cooldown > 0 || resending}
              className="text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:text-slate-400">
              {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : resending ? 'Mengirim...' : 'Kirim ulang OTP'}
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('form')} disabled={loading}>Kembali</Button>
              <Button type="submit" loading={loading} disabled={otp.length !== 6}>Verifikasi</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
