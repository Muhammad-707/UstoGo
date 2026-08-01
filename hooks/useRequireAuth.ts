'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, dashboardPathFor } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/api/types';

export function useRequireAuth(allowedRoles?: Array<UserRole>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(dashboardPathFor(user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, router]);

  return { user, loading };
}
