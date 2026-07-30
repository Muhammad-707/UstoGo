'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { MOCK_BOOKINGS, MASTERS } from '@/lib/mockData';

export default function ClientDashboardPage() {
  const t = useTranslations('dashboardClient');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('overview')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <Link
          href="/booking"
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple flex items-center gap-2"
        >
          <Icon name="Calendar" size={16} />
          <span>{t('newBooking')}</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t('metricTotalSpent'), value: '$580.00', icon: 'DollarSign', color: 'from-blue-600 to-sky-500' },
          { title: t('metricActiveBookings'), value: t('metricActiveBookingsValue', { count: 2 }), icon: 'Clock', color: 'from-amber-500 to-orange-500' },
          { title: t('metricCompletedProjects'), value: t('metricCompletedProjectsValue', { count: 14 }), icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-500' },
          { title: t('metricSavedMasters'), value: t('metricSavedMastersValue', { count: 5 }), icon: 'Heart', color: 'from-purple-500 to-pink-500' },
        ].map((m, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-lg`}>
              <Icon name={m.icon} size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('recentBookings')}</h3>
          <Link href="/booking/b-101" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            {t('viewTracker')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">{t('tableCode')}</th>
                <th className="pb-3">{t('tableService')}</th>
                <th className="pb-3">{t('tableMaster')}</th>
                <th className="pb-3">{t('tableDate')}</th>
                <th className="pb-3">{t('tablePrice')}</th>
                <th className="pb-3">{t('tableStatus')}</th>
                <th className="pb-3 text-right">{t('tableAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {MOCK_BOOKINGS.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-4 font-mono font-bold text-blue-600 dark:text-sky-400">{b.bookingCode}</td>
                  <td className="py-4 text-slate-900 dark:text-white">{b.serviceName}</td>
                  <td className="py-4 flex items-center gap-2">
                    <img src={b.masterAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span>{b.masterName}</span>
                  </td>
                  <td className="py-4 text-slate-500">{b.scheduledDate}</td>
                  <td className="py-4 font-bold text-slate-900 dark:text-white">${b.totalPrice}</td>
                  <td className="py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <Link href={`/booking/${b.id}`} className="text-blue-600 hover:underline">
                      {t('details')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
