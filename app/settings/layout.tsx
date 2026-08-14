'use client';

import React from 'react';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Settings screens are part of a cabinet, not standalone pages.
 *
 * They used to render only their own header band, so a master who opened "Services"
 * or "Working hours" lost the sidebar entirely and had no way back into their cabinet
 * except the browser's back button — the same for a client editing their profile.
 * Wrapping the whole segment puts every one of them behind the same nav.
 *
 * The role decides which nav appears, so it has to come from the session. While that is
 * still loading the children render bare rather than under a guessed sidebar that would
 * then swap out from under the reader.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) return <>{children}</>;

  return (
    <DashboardShell role={user.role}>
      <div className="space-y-6 pb-10">{children}</div>
    </DashboardShell>
  );
}
