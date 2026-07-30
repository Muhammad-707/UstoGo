'use client';

import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { ADMIN_STATS, MASTERS } from '@/lib/mockData';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardAdmin');
  const tm = useTranslations('mockData');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
          {t('platformHealth')}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: t('metricGrossRevenue'), value: `$${ADMIN_STATS.totalRevenue.toLocaleString()}`, growth: t('metricGrossRevenueGrowth', { growth: ADMIN_STATS.monthlyGrowth }), icon: 'DollarSign', color: 'from-purple-600 to-indigo-600' },
          { title: t('metricActiveMasters'), value: ADMIN_STATS.activeMasters.toLocaleString(), growth: t('metricActiveMastersGrowth', { percent: ADMIN_STATS.verifiedMastersPct }), icon: 'Users', color: 'from-blue-600 to-sky-500' },
          { title: t('metricMonthlyBookings'), value: ADMIN_STATS.totalBookingsThisMonth.toLocaleString(), growth: t('metricMonthlyBookingsGrowth'), icon: 'BarChart3', color: 'from-emerald-500 to-teal-500' },
          { title: t('metricCompletionRate'), value: `${ADMIN_STATS.completionRate}%`, growth: t('metricCompletionRateGrowth'), icon: 'ShieldCheck', color: 'from-amber-500 to-orange-500' },
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

      {/* Chart Visual Mock */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('chartTitle')}</h3>
            <p className="text-xs text-slate-500">{t('chartSubtitle')}</p>
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{t('chartPeriod')}</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
          {[40, 55, 70, 65, 85, 95, 110, 130, 150, 180, 210, 240].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div
                style={{ height: `${(val / 240) * 100}%` }}
                className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xl group-hover:from-purple-500 group-hover:to-sky-400 transition"
              />
              <span className="text-[10px] text-slate-400 font-bold">{['J','F','M','A','M','J','J','A','S','O','N','D'][idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Verification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('verificationQueue')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">{t('tableApplicant')}</th>
                <th className="pb-3">{t('tableSpecialization')}</th>
                <th className="pb-3">{t('tableExperience')}</th>
                <th className="pb-3">{t('tableLicenseProof')}</th>
                <th className="pb-3">{t('tableStatus')}</th>
                <th className="pb-3 text-right">{t('tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {MASTERS.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-4 flex items-center gap-3">
                    <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-slate-900 dark:text-white">{m.name}</span>
                  </td>
                  <td className="py-4 text-slate-500">{tm(`categories.${m.categoryId}.name`)}</td>
                  <td className="py-4 text-slate-500">{t('yearsExperience', { years: m.experienceYears })}</td>
                  <td className="py-4 text-purple-600 font-bold">{t('verifiedLicense')}</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                      {t('approved')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-xs text-blue-600 hover:underline">{t('manage')}</button>
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
