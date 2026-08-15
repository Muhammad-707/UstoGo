'use client';

import React from 'react';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { useAuth } from '@/contexts/AuthContext';

/**
 * A cabinet screen that does not live under `/dashboard` or `/settings`.
 *
 * Quotes, messages, reviews and payments are all in the master's sidebar, and all four
 * used to render as bare public pages: clicking "Пардохтҳо" in the cabinet dropped the
 * sidebar entirely and left the browser's back button as the only way home. They are
 * the same cabinet, so they get the same chrome — and the header takes the signed-in
 * role's accent rather than a hardcoded blue that made every master screen look like a
 * client's.
 *
 * A signed-out visitor still gets the bare page: these routes are public, and a rail
 * for a cabinet you cannot enter would be furniture.
 */
/**
 * The cabinet chrome around a page that already has its own header and containers.
 *
 * `CabinetPage` is the tidy version for screens willing to hand over their header;
 * this is for the ones that are not — `/reviews` opens with a full hero band and a
 * tab switcher — so they keep their own layout and only gain the rail. The `.in-cabinet`
 * rule in `globals.css` neutralises their nested `page-shell` for them.
 */
export function CabinetFrame({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading || !user) return <>{children}</>;
  return <DashboardShell role={user.role}>{children}</DashboardShell>;
}

export function CabinetPage({
  icon,
  eyebrow,
  title,
  hint,
  action,
  narrow = false,
  bodyClassName,
  children,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  narrow?: boolean;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  // The band takes the accent of the rail standing next to it: violet for admin, blue
  // for everyone else. It used to hand masters an amber header against a blue sidebar,
  // so /payments and /quotes looked like pages on loan from another product.
  const accent = user?.role === 'ADMIN' ? 'violet' : 'blue';

  const inner = (
    <>
      <PageHeader icon={icon} eyebrow={eyebrow} title={title} hint={hint} action={action} accent={accent} />
      <PageBody narrow={narrow} className={bodyClassName}>
        {children}
      </PageBody>
    </>
  );

  if (loading || !user) return inner;

  return <DashboardShell role={user.role}>{inner}</DashboardShell>;
}

export default CabinetPage;
