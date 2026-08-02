'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { bookingsApi } from '@/lib/api/endpoints';
import type { Booking } from '@/lib/api/types';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const [completed, setCompleted] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .list({ status: 'COMPLETED', limit: 50 })
      .then((res) => setCompleted(res.items))
      .catch(() => setCompleted([]))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = completed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <ClientPageHeader icon="dollarsign" eyebrow={t('badge')} title={t('title')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Total spent — no online payment gateway exists yet; masters are paid directly */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('summaryTitle')}</h3>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white space-y-2 shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">{t('totalSpentLabel')}</span>
            <p className="text-3xl font-extrabold">${totalSpent.toFixed(2)}</p>
            <span className="text-[11px] text-blue-100">{t('completedCount', { count: completed.length })}</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Icon name="Info" size={14} className="shrink-0 mt-0.5" />
            {t('payDirectlyNotice')}
          </p>
        </div>

        {/* Card 2: Real transaction history from completed bookings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('transactionsTitle')}</h3>
          {loading ? (
            <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>
          ) : completed.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold">{t('noTransactions')}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-80 overflow-y-auto">
              {completed.map((b) => (
                <div key={b.id} className="py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {b.masterDisplayName} ({b.serviceTitle})
                    </p>
                    <span className="text-slate-400">
                      {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ${Number(b.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
