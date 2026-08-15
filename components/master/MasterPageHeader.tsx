'use client';

import React from 'react';

import { PageHeader } from '@/components/layout/PageHeader';

/**
 * The band every master screen opens with.
 *
 * It is the shared `PageHeader` with the master's blue accent and nothing else. It used
 * to be a second, hand-rolled band — a flat white card with its own glow and its own
 * type scale — which meant the cabinet had two headers that were *nearly* the same and
 * drifted apart every time either was touched. One band, one place to change it.
 *
 * Blue, not amber: the master's sidebar, active states and dashboard accents are all
 * blue, and a header in a different colour from the rail beside it read as a page
 * borrowed from somewhere else.
 */
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
  return <PageHeader icon={icon} eyebrow={eyebrow} title={title} hint={hint} action={action} accent="blue" />;
}
