'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { notificationsApi } from '@/lib/api/endpoints';
import type { NotificationItem } from '@/lib/api/types';
import { FilterItem } from '@/components/ui/FilterAnimate';

export default function NotificationsPage() {
  const t = useTranslations('notifications');

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .list({ limit: 30 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleOpen = async (n: NotificationItem) => {
    if (n.isRead) return;
    try {
      await notificationsApi.markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    } catch {
      // ignore
    }
  };

  const notificationTitle = (n: NotificationItem) =>
    (n.payload?.title as string | undefined) ?? n.type.replace(/_/g, ' ');
  const notificationMessage = (n: NotificationItem) =>
    (n.payload?.message as string | undefined) ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        </div>
        <button onClick={handleMarkAllRead} className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
          {t('markAllRead')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xl overflow-hidden">
        {loading && <div className="p-6 text-xs text-slate-400 font-semibold">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="p-6 text-xs text-slate-400 font-semibold">No notifications yet.</div>
        )}
        {items.map((n, idx) => (
          <FilterItem
            key={n.id}
            index={idx}
            onClick={() => handleOpen(n)}
            className={`p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer ${
              n.isRead ? '' : 'bg-blue-50/40 dark:bg-blue-950/20'
            }`}
          >
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
              <Icon name={n.type.includes('BOOKING') ? 'Clock' : n.type.includes('PROMO') ? 'Sparkles' : 'CheckCircle2'} size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{notificationTitle(n)}</h3>
                <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{notificationMessage(n)}</p>
            </div>
          </FilterItem>
        ))}
      </div>
    </div>
  );
}
