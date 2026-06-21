'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { homeForRole } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/layout/BrandLogo';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && user) router.replace(homeForRole(user.role));
    else router.replace('/login');
  }, [isAuthenticated, user, router]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <BrandLogo size="lg" />
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    </div>
  );
}
