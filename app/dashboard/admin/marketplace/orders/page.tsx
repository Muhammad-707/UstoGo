'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Order, Paginated } from '@/lib/api/types';
import { useMoney } from '@/lib/money';
import { useDateFormat } from '@/lib/datetime';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function AdminMarketplaceOrdersPage() {
  const t = useTranslations('adminMarketplaceOrders');
  const fmt = useDateFormat();
  const { money } = useMoney();
  useRequireAuth(['ADMIN']);

  const [result, setResult] = useState<Paginated<Order> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.orders
      .list({ page, limit: 15 })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches orders on page change
  useEffect(load, [page]);

  const handleCancel = async (id: string) => {
    if (!window.confirm(t('confirmCancel'))) return;
    setActingId(id);
    try {
      await adminApi.orders.cancel(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cancelFailed'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <Link href="/dashboard/admin" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition">
          <Icon name="chevronleft" size={14} />
          {t('back')}
        </Link>
      }
    >
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />)}
          </div>
        )}
        {!loading && (!result || result.items.length === 0) && <EmptyState icon="shoppingcart" title={t('noResults')} />}
        {!loading && result && result.items.length > 0 && (
          <div className="space-y-3">
            {result.items.map((order) => (
              <div key={order.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{t('orderItems', { count: order.items.length })}</p>
                  <p className="text-[11px] text-slate-400">{fmt.dateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${STATUS_STYLE[order.status] ?? ''}`}>{t(`status${order.status}`)}</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{money(order.totalAmount)}</span>
                  {order.status === 'PAID' && (
                    <button onClick={() => handleCancel(order.id)} disabled={actingId === order.id} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-60 transition">
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && result && result.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40">{t('prev')}</button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: result.meta.totalPages })}</span>
            <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page >= result.meta.totalPages} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40">{t('next')}</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
