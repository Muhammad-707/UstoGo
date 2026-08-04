'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

const TRUST_ITEMS = [
  { icon: 'ShieldCheck', key: 'trustVerified' as const },
  { icon: 'Award', key: 'trustTop1' as const },
  { icon: 'CheckCircle2', key: 'trustInsured' as const },
];

/** Shared two-column shell for all /auth pages: decorative gradient panel (lg+) + centered form card. */
export function AuthShell({
  children,
  minHeight = '80vh',
}: {
  children: React.ReactNode;
  minHeight?: string;
}) {
  const t = useTranslations('common');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight }}>
      {/* Decorative panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-950 to-indigo-950 items-center justify-center p-12">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-md space-y-8 text-white">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg">
              <Icon name="Wrench" size={22} />
            </div>
            <span className="text-2xl font-extrabold">UstoGo</span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            {t('heroTitlePrefix')} <span className="text-sky-400">{t('heroTitleHighlight')}</span> {t('heroTitleSuffix')}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="space-y-4 pt-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Icon name={item.icon} size={16} />
                </div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{t(item.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-4 sm:p-6 py-12 lg:py-4">
        {children}
      </div>
    </div>
  );
}
