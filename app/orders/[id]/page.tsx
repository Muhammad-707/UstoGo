'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, CircleCheckBig, Package, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cartApi, ordersApi } from '@/lib/api/endpoints';
import type { Order } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';
import { useMoney } from '@/lib/money';
import { orderCode } from '@/lib/orderCode';
import { cn } from '@/lib/utils';

import { RecommendedProducts } from '@/components/marketplace/RecommendedProducts';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const tm = useTranslations('marketplace');
  const tc = useTranslations('cart');
  const fmt = useDateFormat();
  const { money } = useMoney();
  const params = useParams<{ id: string }>();
  useRequireAuth(['CLIENT']);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setLoading(true);
    ordersApi
      .byId(params.id)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  /** Put the same basket back together — the commonest thing to want from a past order. */
  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
      await Promise.all(order.items.map((i) => cartApi.addItem(i.productId, i.quantity)));
      showToast(t('reordered'));
    } catch {
      showToast(t('reorderFailed'));
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell space-y-6 py-6 sm:py-12">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="page-shell py-8 sm:py-16">
        <EmptyState
          icon="package"
          tone="emerald"
          title={t('orderNotFound')}
          description={t('noOrdersDesc')}
          actionLabel={t('backToOrders')}
          actionHref="/orders"
        />
      </div>
    );
  }

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const cancelled = order.status === 'CANCELLED';

  return (
    <>
      <div className="page-shell space-y-8 py-10">

        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:gap-2.5 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <ChevronLeft size={14} />
          {t('backToOrders')}
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">

          {/* Items */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t('orderNumber', { code: orderCode(order.id) })}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('orderPlaced')} · {fmt.dateTime(order.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold',
                    STATUS_STYLE[order.status] ?? ''
                  )}
                >
                  {cancelled ? <X size={13} /> : <CircleCheckBig size={13} />}
                  {t(`status${order.status}`)}
                </span>
              </div>

              {/* Lines */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-4 p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Package size={20} />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/marketplace/${item.productId}`}
                          className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {t('unitPriceXQuantity', { price: money(item.unitPrice), quantity: item.quantity })}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-slate-900 tabular-nums dark:text-white">
                      {money(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="px-1 text-[11px] text-slate-400">{t('mockPaymentNote')}</p>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-[88px] space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative space-y-5 p-6">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                  {t('orderSummary')}
                </p>

                <div className="space-y-2.5 border-b border-slate-100 pb-5 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>{t('orderItems', { count: itemCount })}</span>
                    <span className="tabular-nums">{money(order.totalAmount)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('total')}</p>
                  <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {money(order.totalAmount)}
                  </p>
                </div>

                <Button
                  size="raw"
                  variant="ghost"
                  onClick={handleReorder}
                  disabled={reordering}
                  className="btn-ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  {reordering ? '…' : t('reorder')}
                </Button>

                <ul className="space-y-2.5 pt-1">
                  <li className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                    {tc('trustSecure')}
                  </li>
                  <li className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Truck size={14} className="shrink-0 text-emerald-500" />
                    {tm('heroNote')}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        <RecommendedProducts excludeIds={order.items.map((i) => i.productId)} onAdded={showToast} />
      </div>

      {toast && (
        <div className="animate-fade-in fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 lg:bottom-6 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </>
  );
}
