'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CATEGORIES } from '@/lib/mockData';

export default function RegisterMasterPage() {
  const t = useTranslations('authRegisterMaster');
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-lg shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase">
            {t('joinEliteNetwork')}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard/master'); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('fullNameLabel')}</label>
              <input type="text" placeholder={t('fullNamePlaceholder')} className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('specialtyLabel')}</label>
              <select className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('hourlyRateLabel')}</label>
              <input type="number" placeholder="45" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('experienceLabel')}</label>
              <input type="number" placeholder="10" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('uploadLabel')}</label>
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-400">
              {t('dragDropText')} <span className="text-blue-600 font-bold">{t('browse')}</span>
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg btn-ripple">
            {t('submitButton')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t('alreadyMaster')} <Link href="/auth/login" className="font-bold text-amber-500 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
}
