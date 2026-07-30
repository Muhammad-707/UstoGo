'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

export default function PaymentsPage() {
  const t = useTranslations('payments');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('badge')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Saved Payment Methods */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('savedMethodsTitle')}</h3>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('vaultLabel')}</span>
              <Icon name="CreditCard" size={20} />
            </div>
            <p className="font-mono text-sm font-bold tracking-widest">•••• •••• •••• 4829</p>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{t('expiresLabel', { date: '12/28' })}</span>
              <span>{t('cardBrand')}</span>
            </div>
          </div>

          <button className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('addCardButton')}
          </button>
        </div>

        {/* Card 2: Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('transactionsTitle')}</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-3 flex justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Alex Morgan (Electrical)</p>
                <span className="text-slate-400">Oct 14, 2026</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">$280.00</span>
            </div>
            <div className="py-3 flex justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Marcus Vance (Plumbing)</p>
                <span className="text-slate-400">Oct 04, 2026</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">$150.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
