'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { MOCK_BOOKINGS } from '@/lib/mockData';

export default function MasterDashboardPage() {
  const t = useTranslations('dashboardMaster');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings/schedule"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('manageSchedule')}
          </Link>
          <Link
            href="/settings/services"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
          >
            {t('editServices')}
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t('metricMonthlyRevenue'), value: '$4,850.00', growth: '+14.2%', icon: 'DollarSign', color: 'from-amber-500 to-orange-500' },
          { title: t('metricJobsCompleted'), value: t('metricJobsCompletedValue', { count: 38 }), growth: '+8.1%', icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-500' },
          { title: t('metricCustomerRating'), value: '4.95 / 5', growth: t('metricCustomerRatingTop'), icon: 'Star', color: 'from-yellow-500 to-amber-500' },
          { title: t('metricResponseTime'), value: t('metricResponseTimeValue', { minutes: 11 }), growth: t('metricResponseTimeFast'), icon: 'Clock', color: 'from-blue-600 to-sky-500' },
        ].map((m, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
              <span className="text-[10px] font-bold text-emerald-500">{m.growth}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
              <Icon name={m.icon} size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Profile Completion Progress Bar */}
      <div className="bg-gradient-to-r from-amber-900/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-amber-800/40 shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs text-white">
          <span className="font-bold">{t('profileCompletionLabel')}</span>
          <span className="font-extrabold text-amber-400">{t('profileCompletionPercent', { percent: 92 })}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 w-[92%] rounded-full" />
        </div>
        <p className="text-[11px] text-slate-300">{t('profileCompletionDesc')}</p>
      </div>

      {/* Pending Job Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pendingApprovals')}</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {MOCK_BOOKINGS.slice(0, 2).map((b) => (
            <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{b.serviceName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{t('newRequest')}</span>
                </div>
                <p className="text-xs text-slate-500">{t('scheduleAddressLine', { date: b.scheduledDate, time: b.scheduledTime, address: b.address })}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-red-100 hover:text-red-600 transition">
                  {t('decline')}
                </button>
                <button className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition">
                  {t('acceptJob', { price: b.totalPrice })}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
