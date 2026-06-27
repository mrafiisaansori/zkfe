'use client';
import { AppLayout } from '@/components/layout/AppLayout';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role={['admin', 'gudang']} title="Admin Panel">{children}</AppLayout>;
}
