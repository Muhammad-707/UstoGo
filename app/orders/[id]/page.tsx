'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ordersApi } from '@/lib/api/endpoints';
import type { Order } from '@/lib/api/types';

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const params = useParams<{ id: string }>();
  useRequireAuth(['CLIENT']);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setLoading(true);
    ordersApi
      .byId(params.id)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="page-shell page-shell-narrow py-12">
        <div className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('orderNotFound')}</p>
        <Link href="/orders" className="text-xs font-bold text-emerald-600 hover:underline">
          {t('backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-narrow py-10 space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
        <Icon name="chevronleft" size={14} />
        {t('backToOrders')}
      </Link>

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-slate-400">{t('orderPlaced')}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${STATUS_STYLE[order.status] ?? ''}`}>
            {order.status}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {order.items.map((item) => (
            <div key={item.productId} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/marketplace/${item.productId}`} className="text-sm font-bold text-slate-900 dark:text-white hover:underline line-clamp-1">
                  {item.productName}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">{t('unitPriceXQuantity', { price: item.unitPrice, quantity: item.quantity })}</p>
              </div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white shrink-0">{item.subtotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">{t('total')}</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{order.totalAmount} {order.currency}</span>
        </div>

        <p className="text-[10px] text-slate-400">{t('mockPaymentNote')}</p>
      </div>
    </div>
  );
}
