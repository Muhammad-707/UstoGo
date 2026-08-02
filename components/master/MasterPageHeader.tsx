import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white items-center justify-center shadow-lg shadow-amber-900/20">
          <Icon name={icon} size={22} />
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {eyebrow}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">{title}</h1>
          {hint && <p className="text-xs text-slate-400 font-semibold mt-1">{hint}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
