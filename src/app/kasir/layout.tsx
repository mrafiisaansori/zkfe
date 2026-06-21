'use client';
import { AppLayout } from '@/components/layout/AppLayout';
export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="kasir" title="Kasir">{children}</AppLayout>;
}
