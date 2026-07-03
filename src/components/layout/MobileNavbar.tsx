'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { flatNavForRole, isHrefActive } from '@/constants/nav';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

// Bottom navigation untuk mobile (maks 5 item utama, leaf datar).
export function MobileNavbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setNavLoading = useUIStore((s) => s.setNavLoading);
  if (!user) return null;
  const allItems = flatNavForRole(user.role);
  const items = allItems.slice(0, 5);
  const isKasir = user.role === 'kasir';

  return (
    <nav className={cn(
      'fixed inset-x-3 bottom-3 z-40 flex items-stretch gap-1 rounded-2xl p-1.5 shadow-premium-lg backdrop-blur-md pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden',
      isKasir ? 'border border-brand-100 bg-white/95' : 'border border-line/80 bg-white/90',
    )}>
      {items.map((item) => {
        const active = isHrefActive(pathname, item.href, allItems);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => { if (!active) setNavLoading(true); }}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all duration-200',
              active
                ? isKasir ? 'bg-brand-50 text-primary shadow-card dark:bg-accent/15 dark:text-accent' : 'bg-gradient-to-b from-brand-50 to-white text-brand-700 shadow-card dark:from-accent/20 dark:to-accent/5 dark:text-accent'
                : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <Icon className={cn('h-5 w-5', active ? isKasir ? 'text-primary' : 'text-brand-600' : 'text-slate-400')} />
            <span className="truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
