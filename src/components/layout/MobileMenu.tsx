'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Loader2 } from 'lucide-react';
import { navForRole, isNavItemActive } from '@/constants/nav';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { BrandLogo } from './BrandLogo';

/**
 * Hamburger + drawer geser untuk tablet/mobile. Menampilkan SELURUH menu sesuai
 * role (tidak terpotong seperti bottom-nav), plus profil & tombol keluar.
 * Self-contained: kelola open state sendiri, tidak mengubah logic/route apa pun.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setNavLoading = useUIStore((s) => s.setNavLoading);
  const { signOut, signingOut } = useAuth();

  // Pastikan portal hanya dibuat di client (hindari error SSR).
  useEffect(() => { setMounted(true); }, []);

  // Tutup otomatis saat pindah halaman.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Kunci scroll body + tutup dengan Escape saat drawer terbuka.
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!user) return null;
  const items = navForRole(user.role);
  const isKasir = user.role === 'kasir';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className={isKasir
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-white text-primary transition-colors hover:bg-brand-50 lg:hidden'
          : 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary lg:hidden'}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] animate-fade-in" onClick={() => setOpen(false)} />

          <aside className={cn(
            'zk-drawer absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col overflow-hidden text-white shadow-sidebar',
            isKasir ? 'bg-gradient-to-b from-[#042f1a] via-[#075c5d] to-[#0b8ab7]' : 'bg-gradient-to-b from-ink via-primary to-primary',
          )}>
            <span aria-hidden className="zk-pattern-dots pointer-events-none absolute inset-0 opacity-[0.06]" />

            <div className="relative flex h-16 items-center justify-between px-4">
              <BrandLogo tone="dark" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Menu</p>
              {items.map((item) => {
                const active = isNavItemActive(pathname, item.href, items);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { if (!active) setNavLoading(true); setOpen(false); }}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-white/20 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                        : 'text-white/70 hover:bg-white/[0.08] hover:text-white',
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_12px_rgba(0,180,216,0.7)]" />}
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                        active ? 'bg-accent text-white shadow-[0_6px_16px_-6px_rgba(0,180,216,0.9)]' : 'bg-white/[0.06] text-white/70 group-hover:text-accent',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="relative space-y-2 p-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-brand-300 text-sm font-semibold text-ink">
                  {(user.nama ?? user.role).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user.nama}</p>
                  <p className="text-xs capitalize text-white/50">{user.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.12] disabled:opacity-60"
              >
                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {signingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
