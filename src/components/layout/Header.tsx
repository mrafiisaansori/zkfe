'use client';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from './BrandLogo';
import { MobileMenu } from './MobileMenu';
import { AccountMenu } from './AccountMenu';

export function Header({ title }: { title?: string }) {
  const { user, signOut, signingOut } = useAuth();
  const isKasir = user?.role === 'kasir';
  return (
    <header className={isKasir
      ? 'sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brand-100 bg-[#eef6fb]/90 px-3 backdrop-blur-md sm:px-6'
      : 'sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-white/75 px-3 backdrop-blur-md sm:px-6'}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <MobileMenu />
        <div className="lg:hidden">
          <BrandLogo size="sm" />
        </div>
        <h1 className={isKasir ? 'hidden truncate text-lg font-bold tracking-tight text-ink lg:block' : 'hidden truncate text-lg font-semibold tracking-tight text-ink lg:block'}>{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className={isKasir
          ? 'hidden items-center gap-2.5 rounded-full border border-brand-100 bg-white/85 py-1 pl-1 pr-3.5 shadow-card sm:flex'
          : 'hidden items-center gap-2.5 rounded-full border border-line bg-canvas py-1 pl-1 pr-3.5 sm:flex'}
        >
          <span className={isKasir ? 'flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white' : 'flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white'}>
            {(user?.nama ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-slate-700">{user?.nama}</span>
        </div>
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
