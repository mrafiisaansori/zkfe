'use client';
import { AppLayout } from '@/components/layout/AppLayout';
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="superadmin" title="Super Admin">{children}</AppLayout>;
}
