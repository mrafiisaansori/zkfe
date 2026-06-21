'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { navForRole, isNavItemActive } from '@/constants/nav';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { BrandLogo } from './BrandLogo';

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setNavLoading = useUIStore((s) => s.setNavLoading);
  const [menuOpen, setMenuOpen] = useState(true);
  if (!user) return null;
  const items = navForRole(user.role);

  return (
    <aside className={cn(
      'sticky top-0 m-3 hidden h-[calc(100vh-1.5rem)] flex-shrink-0 flex-col rounded-[28px] bg-gradient-to-b from-ink via-primary to-accent text-white shadow-sidebar transition-all duration-200 xl:m-5 xl:h-[calc(100vh-2.5rem)] lg:flex',
      menuOpen ? 'w-56 xl:w-64' : 'w-20',
    )}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? 'Sembunyikan menu' : 'Buka menu'}
        title={menuOpen ? 'Sembunyikan menu' : 'Buka menu'}
        className="absolute -right-4 top-7 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-brand-100 bg-white text-primary shadow-premium transition-colors hover:bg-brand-50"
      >
        {menuOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      <div className="flex h-20 items-center px-4 xl:px-5">
        <div className={cn(!menuOpen && 'hidden')}>
          <BrandLogo tone="dark" />
        </div>
        {!menuOpen && <BrandLogo tone="dark" variant="icon" />}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <p className={cn('px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50', !menuOpen && 'sr-only')}>Menu</p>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href, items);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (!active) setNavLoading(true); }}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-150',
                menuOpen ? 'px-3.5' : 'justify-center px-0',
                active
                  ? 'bg-white/[0.18] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                  : 'text-white/70 hover:bg-white/[0.08] hover:text-white',
              )}
            >
              <span className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                active ? 'bg-accent text-white' : 'bg-white/[0.08] text-white/75 group-hover:text-white',
              )}>
                <Icon className="h-5 w-5" />
              </span>
              {menuOpen && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className={cn('flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.12] p-3', !menuOpen && 'justify-center')}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white">
            {(user.nama ?? user.role).charAt(0).toUpperCase()}
          </span>
          <div className={cn('min-w-0', !menuOpen && 'hidden')}>
            <p className="truncate text-sm font-medium text-white">{user.nama}</p>
            <p className="text-xs capitalize text-white/45">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
