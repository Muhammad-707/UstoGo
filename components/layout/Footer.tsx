'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { categoriesApi } from '@/lib/api/endpoints';
import type { Category } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer: React.FC = () => {
  const t = useTranslations('common');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoriesApi.tree().then(setCategories).catch(() => {});
  }, []);

  return (
    // Tighter on a phone. At desktop spacing this footer ran to about two full screens
    // of scrolling below every page, which on a phone is the last thing anyone wants
    // between them and the bottom bar.
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-900 pt-10 pb-8 text-slate-400 sm:pt-16 sm:pb-12">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="page-shell relative z-10">
        
        {/* Top Newsletter & Banner Callout */}
        <div className="mb-10 flex flex-col items-center justify-between gap-6 rounded-3xl border border-blue-800/40 bg-gradient-to-r from-blue-900/40 via-slate-800/80 to-blue-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-12 lg:mb-16 lg:flex-row lg:gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="px-3 py-1 text-xs font-bold text-sky-400 bg-sky-950/60 rounded-full border border-sky-800/60 uppercase tracking-widest inline-block mb-3">
              {t('joinHomeowners')}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('footerSubTitle')}
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              {t('footerSubDesc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Input
                type="email"
                placeholder={t('enterEmail')}
                aria-label={t('enterEmail')}
                className="h-auto w-full px-5 py-3.5 rounded-2xl bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 text-sm dark:bg-slate-950/80"
              />
            </div>
            <Button className="w-full sm:w-auto h-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 btn-ripple gap-2 whitespace-nowrap">
              <span>{t('subscribe')}</span>
              <Icon name="ArrowRight" size={16} />
            </Button>
          </div>
        </div>

        {/* Links Grid */}
        {/* Two columns of links on a phone, not one. Four stacked lists is a very long
            scroll for four short lists. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-slate-800 pb-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-10 lg:pb-12">

          {/* Brand Info */}
          <div className="col-span-2 space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Icon name="Wrench" size={22} className="stroke-[2.5]" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Usto<span className="text-sky-400">Go</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {t('footerAboutDesc')}
            </p>

            <div className="flex items-center gap-4 pt-2">
              {['ShieldCheck', 'Award', 'CheckCircle2'].map((badgeIcon, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                  <Icon name={badgeIcon} size={15} className="text-sky-400" />
                  <span>{idx === 0 ? t('trustInsured') : idx === 1 ? t('trustTop1') : t('trustVerified')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Services */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">{t('topServicesFooter')}</h4>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/search?category=${cat.id}`} className="hover:text-sky-400 transition flex items-center gap-2">
                    <Icon name="ChevronRight" size={14} className="text-slate-600" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">{t('marketplace')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search" className="hover:text-sky-400 transition">{t('findMasters')}</Link></li>
              <li><Link href="/booking" className="hover:text-sky-400 transition">{t('bookService')}</Link></li>
              <li><Link href="/auth/register/master" className="hover:text-sky-400 transition text-amber-400 font-semibold">{t('joinAsMaster')}</Link></li>
              <li><Link href="/reviews" className="hover:text-sky-400 transition">{t('customerReviews')}</Link></li>
              <li><Link href="/payments" className="hover:text-sky-400 transition">{t('pricingGuarantees')}</Link></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">{t('company')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-sky-400 transition">{t('aboutUstoGo')}</Link></li>
              <li><Link href="/contact" className="hover:text-sky-400 transition">{t('contactSupport')}</Link></li>
              <li><Link href="/faq" className="hover:text-sky-400 transition">{t('faq')}</Link></li>
              <li><Link href="/404" className="hover:text-sky-400 transition text-slate-500">{t('footer404Link')}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:gap-4 sm:pt-8 sm:text-left">
          <p>{t('copyright')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="cursor-pointer hover:text-slate-300">{t('privacyPolicy')}</span>
            <span className="cursor-pointer hover:text-slate-300">{t('termsOfService')}</span>
            <span className="cursor-pointer hover:text-slate-300">{t('craftsmanEthics')}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
