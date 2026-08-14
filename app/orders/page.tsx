'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, CircleCheckBig, Package, Receipt, Wallet, X } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ordersApi } from '@/lib/api/endpoints';
import type { Order, OrderStatus } from '@/lib/api/types';
import { useMoney } from '@/lib/money';
import { useDateFormat } from '@/lib/datetime';
import { orderCode } from '@/lib/orderCode';
import { cn } from '@/lib/utils';

import { FilterButton, FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_ICON: Record<string, typeof CircleCheckBig> = {
  PAID: CircleCheckBig,
  CANCELLED: X,
};

type StatusFilter = 'ALL' | OrderStatus;

export default function OrdersPage() {
  const t = useTranslations('orders');
  const fmt = useDateFormat();
  const { money } = useMoney();
  useRequireAuth(['CLIENT']);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

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

  /**
   * Filtering runs on the page in hand, not the whole history — the list endpoint takes
   * no status parameter, so a server-side filter is not available to us. The counts on
   * the pills therefore describe what is on screen, which is what they are next to.
   */
  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  const totalSpent = useMemo(
    () => orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    [orders]
  );

  const statuses: StatusFilter[] = ['ALL', 'PAID', 'CANCELLED'];
  const countFor = (s: StatusFilter) => (s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length);

  return (
    <>
      <ClientPageHeader icon="package" eyebrow={t('badge')} title={t('title')} />

      <div className="page-shell space-y-8 py-12">

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-3xl" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 rounded-3xl" />
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
          <>
            {/* Summary strip — what the history adds up to, before the list of rows. */}
            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              {[
                { value: `${orders.length}`, label: t('statTotalOrders'), Icon: Receipt, tone: 'from-blue-600 to-sky-500 shadow-blue-500/25' },
                { value: money(totalSpent), label: t('statTotalSpent'), Icon: Wallet, tone: 'from-emerald-600 to-teal-500 shadow-emerald-500/25' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                      s.tone
                    )}
                  >
                    <s.Icon size={19} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status pills */}
            <FilterContainer className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {statuses.map((s, idx) => (
                <FilterButton
                  key={s}
                  index={idx}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition',
                    statusFilter === s
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
                  )}
                >
                  {s === 'ALL' ? t('filterAll') : t(`status${s}`)} ({countFor(s)})
                </FilterButton>
              ))}
            </FilterContainer>

            {filtered.length === 0 ? (
              <EmptyState
                icon="package"
                tone="emerald"
                variant="inline"
                title={t('noOrdersFiltered')}
                description={t('noOrdersFilteredDesc')}
              />
            ) : (
              <FilterContainer className="space-y-3">
                {filtered.map((order, idx) => {
                  const StatusIcon = STATUS_ICON[order.status] ?? Package;
                  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <FilterItem key={order.id} index={idx}>
                      <Link
                        href={`/orders/${order.id}`}
                        className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <StatusIcon size={20} strokeWidth={2.2} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {t('orderNumber', { code: orderCode(order.id) })}
                              </p>
                              {/* Naming the goods beats "3 items": a list of orders that
                                  differ only by date and price is unreadable. */}
                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                {order.items.map((i) => i.productName).join(' · ')}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {fmt.dateTime(order.createdAt)} · {t('orderItems', { count: itemCount })}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-1 text-[10px] font-extrabold',
                                STATUS_STYLE[order.status] ?? ''
                              )}
                            >
                              {t(`status${order.status}`)}
                            </span>
                            <span className="text-base font-extrabold text-slate-900 tabular-nums dark:text-white">
                              {money(order.totalAmount)}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-slate-300 transition-transform duration-200 group-hover:translate-x-1 dark:text-slate-600"
                            />
                          </div>
                        </div>
                      </Link>
                    </FilterItem>
                  );
                })}
              </FilterContainer>
            )}
          </>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="raw"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ChevronLeft size={14} />
              {t('prev')}
            </Button>
            <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('pageOf', { page, total: totalPages })}
            </span>
            <Button
              size="raw"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              {t('next')}
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
