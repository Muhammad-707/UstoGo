'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

export default function RegisterClientPage() {
  const t = useTranslations('authRegisterClient');
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard/client'); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('fullNameLabel')}</label>
            <input type="text" placeholder={t('fullNamePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('emailLabel')}</label>
            <input type="email" placeholder={t('emailPlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('passwordLabel')}</label>
            <input type="password" placeholder={t('passwordPlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
          </div>
          <button type="submit" className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg btn-ripple">
            {t('registerButton')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t('alreadyHaveAccount')} <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
}
