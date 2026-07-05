'use client';
import { useEffect, useState } from 'react';
import { LogOut, Loader2, Sun, Moon, PanelLeftClose, PanelLeftOpen, Bluetooth, BluetoothConnected, WifiOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { useOfflineSalesQueue } from '@/hooks/useOfflineSalesQueue';
import { cn } from '@/utils/cn';
import { connectBluetoothPrinter, isWebBluetoothSupported } from '@/utils/blePrinter';
import { BrandLogo } from './BrandLogo';
import { MobileMenu } from './MobileMenu';
import { AccountMenu } from './AccountMenu';

export function Header() {
  const { user, signOut, signingOut } = useAuth();
  const isKasir = user?.role === 'kasir';
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const themeToggleable = user?.role === 'admin' || user?.role === 'kasir' || user?.role === 'superadmin';
  const isDark = themeToggleable && theme === 'dark';
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const { pendingCount, failedCount, sync } = useOfflineSalesQueue();

  const [btConnected, setBtConnected] = useState(false);
  // Default true di render pertama biar sama antara server & client (navigator cuma ada
  // di client); dikoreksi via useEffect — hindari hydration mismatch.
  const [btSupported, setBtSupported] = useState(true);
  useEffect(() => { setBtSupported(isWebBluetoothSupported()); }, []);

  const handleConnectBluetooth = async () => {
    if (!btSupported) {
      toast('Browser ini belum dukung Bluetooth langsung (pakai Chrome/Edge). Cetak struk tetap bisa lewat printer biasa.', { icon: 'ℹ️' });
      return;
    }
    if (btConnected) { toast.success('Printer Bluetooth tersambung'); return; }
    const result = await connectBluetoothPrinter();
    setBtConnected(result.ok);
    if (result.ok) toast.success('Printer Bluetooth tersambung');
    else toast.error(result.reason || 'Gagal sambung printer Bluetooth');
  };
  return (
    <header className={isKasir
      ? 'sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brand-100 bg-[#eef6fb]/90 px-3 backdrop-blur-md dark:bg-slate-900/90 sm:px-6'
      : 'sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-white/75 px-3 backdrop-blur-md sm:px-6'}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <MobileMenu />
        {/* Mobile: logo saja (hemat tempat). Tablet (sm-lg): logo + tulisan. */}
        <div className="sm:hidden">
          <BrandLogo variant="icon" size="sm" tone={isDark ? 'dark' : 'light'} />
        </div>
        <div className="hidden sm:block lg:hidden">
          <BrandLogo size="sm" tone={isDark ? 'dark' : 'light'} />
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Sembunyikan menu' : 'Tampilkan menu'}
          title={sidebarOpen ? 'Sembunyikan menu' : 'Tampilkan menu'}
          className="hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 lg:inline-flex"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isKasir && (failedCount > 0 || pendingCount > 0) && (
          <button
            type="button"
            onClick={sync}
            title="Klik untuk coba sinkron ulang sekarang"
            aria-label={failedCount > 0 ? `${failedCount} transaksi gagal sinkron` : `${pendingCount} transaksi belum sinkron`}
            className={cn('relative inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-colors sm:w-auto sm:justify-start sm:gap-2 sm:px-4 sm:text-sm',
              failedCount > 0
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300')}
          >
            {failedCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {/* Mobile: cuma angka kecil nempel di ikon. sm+: kalimat lengkap. */}
            <span className={cn('absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white sm:hidden',
              failedCount > 0 ? 'bg-rose-600' : 'bg-amber-600')}
            >
              {failedCount || pendingCount}
            </span>
            <span className="hidden sm:inline">{failedCount > 0 ? `${failedCount} transaksi gagal sinkron` : `${pendingCount} transaksi belum sinkron`}</span>
          </button>
        )}
        {isKasir ? (
          <button
            type="button"
            onClick={handleConnectBluetooth}
            title={!btSupported ? 'Browser ini belum dukung Bluetooth langsung — pakai Chrome/Edge' : btConnected ? 'Printer Bluetooth tersambung' : 'Sambungkan printer Bluetooth'}
            aria-label={btConnected ? 'Printer Bluetooth tersambung' : 'Sambungkan printer Bluetooth'}
            className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition-colors sm:w-auto sm:justify-start sm:gap-2 sm:px-4 sm:text-sm',
              !btSupported ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                : btConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-brand-100 bg-white/85 text-slate-600 shadow-card hover:bg-white')}
          >
            {btConnected ? <BluetoothConnected className="h-4 w-4" /> : <Bluetooth className="h-4 w-4" />}
            <span className="hidden sm:inline">{btConnected ? 'Printer Connected' : 'Connect Printer'}</span>
          </button>
        ) : (
          <div className="hidden items-center gap-2.5 rounded-full border border-line bg-canvas py-1 pl-1 pr-3.5 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {(user?.nama ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-slate-700">{user?.nama}</span>
          </div>
        )}
        {themeToggleable && (
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <AccountMenu />
        <button
          onClick={signOut}
          disabled={signingOut}
          aria-busy={signingOut}
          className={isKasir
            ? 'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-brand-100 bg-white/85 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
            : 'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'}
        >
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          <span className="hidden sm:inline">{signingOut ? 'Keluar...' : 'Keluar'}</span>
        </button>
      </div>
    </header>
  );
}
