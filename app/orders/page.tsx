'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ordersApi } from '@/lib/api/endpoints';
import type { Order } from '@/lib/api/types';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMoney } from '@/lib/money';
import { useDateFormat } from '@/lib/datetime';

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function OrdersPage() {
  const t = useTranslations('orders');
  const fmt = useDateFormat();
  const { money } = useMoney();
  useRequireAuth(['CLIENT']);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setLoading(true);
    ordersApi
      .list({ page, limit: 10 })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.meta.totalPages);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <>
    <ClientPageHeader icon="package" eyebrow={t('badge')} title={t('title')} />
    <div className="page-shell page-shell-narrow py-12 space-y-8">

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <EmptyState
          icon="package"
          tone="emerald"
          title={t('noOrders')}
          description={t('noOrdersDesc')}
          actionLabel={t('browseShop')}
          actionHref="/marketplace"
        />
      )}

      {!loading && orders.length > 0 && (
        <FilterContainer className="space-y-3">
          {orders.map((order, idx) => (
            <FilterItem key={order.id} index={idx}>
              <Link
                href={`/orders/${order.id}`}
                className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-900 transition block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon name="package" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('orderItems', { count: order.items.length })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmt.dateTime(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${STATUS_STYLE[order.status] ?? ''}`}>
                    {t(`status${order.status}`)}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {money(order.totalAmount)}
                  </span>
                  <Icon name="chevronright" size={14} className="text-slate-300" />
                </div>
              </Link>
            </FilterItem>
          ))}
        </FilterContainer>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
          >
            {t('prev')}
          </button>
          <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: totalPages })}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
