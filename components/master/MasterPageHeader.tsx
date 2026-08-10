import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';

/** Master-side page header — the shared `PageHeader` band with the amber/orange accent. */
export function MasterPageHeader({
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
    <PageHeader icon={icon} eyebrow={eyebrow} title={title} hint={hint} action={action} accent="amber" />
  );
}
