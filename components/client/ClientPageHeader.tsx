import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';

/**
 * Client-side page header — the shared `PageHeader` band with the blue/sky accent.
 * Kept as its own export so the thirteen pages already importing it did not all need
 * to change when the band replaced the old inline heading row.
 */
export function ClientPageHeader({
  icon,
  eyebrow,
  title,
  hint,
  action,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <PageHeader icon={icon} eyebrow={eyebrow} title={title} hint={hint} action={action} accent="blue" />
  );
}
