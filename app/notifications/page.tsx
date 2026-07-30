'use client';

import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { MOCK_NOTIFICATIONS } from '@/lib/mockData';

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            Activity Center
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Notifications</h1>
        </div>
        <button className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
          Mark All as Read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xl overflow-hidden">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div key={n.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
              <Icon name={n.type === 'booking' ? 'Clock' : n.type === 'promo' ? 'Sparkles' : 'CheckCircle2'} size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                <span className="text-xs text-slate-400">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
