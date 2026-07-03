'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { navForRole, flatNavForRole, isHrefActive, isGroupActive, isGroup, type NavGroup, type NavLeaf } from '@/constants/nav';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { BrandLogo } from './BrandLogo';
import { DecorativeBlob } from '@/components/ui/DecorativeBlob';

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setNavLoading = useUIStore((s) => s.setNavLoading);
  const menuOpen = useUIStore((s) => s.sidebarOpen);
  if (!user) return null;
  const nodes = navForRole(user.role);
  const leaves = flatNavForRole(user.role);

  function LeafLink({ item, nested = false }: { item: NavLeaf; nested?: boolean }) {
    const active = isHrefActive(pathname, item.href, leaves);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => { if (!active) setNavLoading(true); }}
        className={cn(
          'group relative flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-200',
          menuOpen ? (nested ? 'px-2.5' : 'px-3.5') : 'justify-center px-0',
          active
            ? 'bg-gradient-to-r from-accent/25 via-accent/10 to-transparent font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_16px_-8px_rgba(0,163,204,0.5)]'
            : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
        )}
      >
        {active && !nested && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_10px_rgba(0,180,216,0.7)]" />
        )}
        <span className={cn(
          'flex shrink-0 items-center justify-center rounded-2xl transition-colors duration-200',
          nested && menuOpen ? 'h-8 w-8' : 'h-10 w-10',
          active ? 'bg-accent text-white shadow-[0_4px_14px_-4px_rgba(0,180,216,0.75)]' : 'bg-white/[0.08] text-white/75 group-hover:bg-white/[0.14] group-hover:text-white',
        )}>
          <Icon className={cn(nested && menuOpen ? 'h-4 w-4' : 'h-5 w-5')} />
        </span>
        {menuOpen && item.label}
      </Link>
    );
  }

  function GroupBlock({ group }: { group: NavGroup }) {
    const groupActive = isGroupActive(pathname, group, leaves);
    const [open, setOpen] = useState(groupActive);
    const Icon = group.icon;

    // Mode menu disembunyikan (icon-only): tampilkan anak sebagai ikon datar.
    if (!menuOpen) {
      return <>{group.children.map((c) => <LeafLink key={c.href} item={c} />)}</>;
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200',
            groupActive
              ? 'bg-gradient-to-r from-accent/15 to-transparent font-bold text-white'
              : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
          )}
        >
          <span className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200',
            groupActive ? 'bg-accent text-white shadow-[0_4px_14px_-4px_rgba(0,180,216,0.75)]' : 'bg-white/[0.08] text-white/75',
          )}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-1 space-y-1 border-l border-white/10 pl-3">
            {group.children.map((c) => <LeafLink key={c.href} item={c} nested />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className={cn(
      'sticky top-0 hidden h-screen flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-gradient-to-b from-ink via-primary to-accent text-white shadow-[6px_0_30px_-14px_rgba(2,6,23,0.6)] transition-all duration-200 lg:flex',
      menuOpen ? 'w-56 xl:w-64' : 'w-20',
    )}>
      {/* Glow dekoratif halus (bukan neon): satu titik di bawah, satu di atas */}
      <DecorativeBlob tone="accent" className="-bottom-24 -left-16 h-56 w-56 opacity-[0.15]" />
      <DecorativeBlob tone="aqua" className="-top-20 -right-16 h-48 w-48 opacity-[0.08]" />

      <div className={cn('relative flex h-20 shrink-0 items-center px-4 transition-all duration-200 xl:px-5', !menuOpen && 'justify-center px-0')}>
        {menuOpen ? <BrandLogo tone="dark" /> : <BrandLogo tone="dark" variant="icon" />}
      </div>

      <nav className="relative flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <p className={cn('px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50', !menuOpen && 'sr-only')}>Menu</p>
        {nodes.map((node) => (
          isGroup(node)
            ? <GroupBlock key={node.label} group={node} />
            : <LeafLink key={node.href} item={node} />
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-white/[0.07] p-3">
        <div className={cn('flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.1] p-3', !menuOpen && 'justify-center')}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(0,180,216,0.75)]">
            {(user.nama ?? user.role).charAt(0).toUpperCase()}
          </span>
          <div className={cn('min-w-0', !menuOpen && 'hidden')}>
            <p className="truncate text-sm font-medium text-white">{user.nama}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
